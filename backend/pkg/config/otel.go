package config

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"os"
	"runtime/debug"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
	"go.opentelemetry.io/contrib/bridges/otellogrus"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/exporters/otlp/otlplog/otlploggrpc"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc"
	"go.opentelemetry.io/otel/exporters/prometheus"
	"go.opentelemetry.io/otel/log/global"
	meter "go.opentelemetry.io/otel/metric"
	"go.opentelemetry.io/otel/propagation"
	otelLog "go.opentelemetry.io/otel/sdk/log"
	"go.opentelemetry.io/otel/sdk/metric"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.26.0"
	"go.opentelemetry.io/otel/trace"
)

type ApplicationMetrics struct {
	httpRequestsReceivedTotal  meter.Int64Counter
	httpRequestDurationSeconds meter.Float64Histogram
}

const (
	ServiceName      = "mandagsmiddag-backend"
	ServiceNamespace = "mandagsmiddag"
)

func resolveServiceVersion() string {
	if info, ok := debug.ReadBuildInfo(); ok {
		for _, setting := range info.Settings {
			if setting.Key == "vcs.revision" {
				return setting.Value
			}
		}

		if info.Main.Version != "" && info.Main.Version != "(devel)" {
			return info.Main.Version
		}
	}

	return "unknown"
}

func instanceID() string {
	if hostname := os.Getenv("HOSTNAME"); hostname != "" {
		return hostname
	}

	if hostname, err := os.Hostname(); err == nil {
		return hostname
	}

	return "unknown"
}

func newResource(ctx context.Context, log *logrus.Logger) (*resource.Resource, error) {
	res, err := resource.New(
		ctx,
		resource.WithFromEnv(),
		resource.WithHost(),
		resource.WithContainer(),
		resource.WithProcessRuntimeDescription(),
		resource.WithTelemetrySDK(),
		resource.WithAttributes(
			semconv.ServiceName(ServiceName),
			semconv.ServiceNamespace(ServiceNamespace),
			semconv.ServiceVersion(resolveServiceVersion()),
			// service.instance.id is what distinguishes your two replicas in
			// Tempo/Loki. HOSTNAME is the pod name inside Kubernetes.
			semconv.ServiceInstanceID(instanceID()),
		),
	)
	// resource.New returns a USABLE resource alongside a non-fatal error for
	// schema-URL conflicts and partial detector failures. Treat those as a
	// warning rather than killing startup over telemetry metadata.
	if err != nil {
		if res == nil {
			return nil, fmt.Errorf("failed to build otel resource: %w", err)
		}

		log.Warnf("partial otel resource detection: %v", err)
	}

	return res, nil
}

func ConfigureOpenTelemetry(
	ctx context.Context,
	log *logrus.Logger,
) (*ApplicationMetrics, func(context.Context) error, error) {
	res, err := resource.New(
		ctx,
		resource.WithAttributes(semconv.ServiceNameKey.String(ServiceName)),
		resource.WithAttributes(semconv.ServiceNamespaceKey.String(ServiceNamespace)),
		resource.WithSchemaURL(semconv.SchemaURL),
	)
	if err != nil {
		return nil, nil, err
	}

	loggerProvider, err := configureLogs(ctx, res, log)
	if err != nil {
		return nil, nil, err
	}

	tracerProvider, err := configureTraces(ctx, res)
	if err != nil {
		_ = loggerProvider.Shutdown(ctx)

		return nil, nil, err
	}

	applicationMetrics, meterProvider, err := configureMetrics(res)
	if err != nil {
		_ = tracerProvider.Shutdown(ctx)
		_ = loggerProvider.Shutdown(ctx)

		return nil, nil, err
	}

	shutdown := func(ctx context.Context) error {
		return errors.Join(
			tracerProvider.Shutdown(ctx),
			meterProvider.Shutdown(ctx),
			loggerProvider.Shutdown(ctx),
		)
	}

	return applicationMetrics, shutdown, nil
}

func configureLogs(
	ctx context.Context,
	resource *resource.Resource,
	log *logrus.Logger,
) (*otelLog.LoggerProvider, error) {
	logExporter, err := otlploggrpc.New(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to create log exporter: %w", err)
	}

	processor := otelLog.NewBatchProcessor(logExporter)
	loggerProvider := otelLog.NewLoggerProvider(
		otelLog.WithResource(resource),
		otelLog.WithProcessor(processor),
	)

	global.SetLoggerProvider(loggerProvider)

	log.SetOutput(os.Stdout)
	log.SetFormatter(&logrus.JSONFormatter{})

	hook := otellogrus.NewHook(
		ServiceNamespace+"/"+ServiceName,
		otellogrus.WithLoggerProvider(loggerProvider),
	)

	log.AddHook(hook)

	return loggerProvider, nil
}

func configureMetrics(resource *resource.Resource) (*ApplicationMetrics, *metric.MeterProvider, error) {
	metricExporter, err := prometheus.New()
	if err != nil {
		return nil, nil, fmt.Errorf("failed to create Prometheus exporter: %w", err)
	}

	meterProvider := metric.NewMeterProvider(
		metric.WithReader(metricExporter),
		metric.WithResource(resource),
	)
	otel.SetMeterProvider(meterProvider)

	metrics := meterProvider.Meter(ServiceName)

	httpRequestsReceivedTotal, err := metrics.Int64Counter(
		"http_requests_received",
		meter.WithDescription("Total number of HTTP requests received"),
	)
	if err != nil {
		return nil, nil, fmt.Errorf("could not create counter: %w", err)
	}

	httpRequestDurationSeconds, err := metrics.Float64Histogram(
		"http_request_duration_seconds",
		meter.WithDescription("The duration of HTTP requests processed by Gin, in seconds."),
		meter.WithExplicitBucketBoundaries(
			0.01, 0.02, 0.05, 0.1, 0.2, 0.5,
			1, 2, 5, 10, 20, 60, 120, 300, 600,
		),
	)
	if err != nil {
		return nil, nil, fmt.Errorf("could not create histogram: %w", err)
	}

	return &ApplicationMetrics{
		httpRequestsReceivedTotal:  httpRequestsReceivedTotal,
		httpRequestDurationSeconds: httpRequestDurationSeconds,
	}, meterProvider, nil
}

func configureTraces(
	ctx context.Context,
	resource *resource.Resource,
) (*sdktrace.TracerProvider, error) {
	traceExporter, err := otlptracegrpc.New(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to create trace exporter: %w", err)
	}

	tracerProvider := sdktrace.NewTracerProvider(
		sdktrace.WithBatcher(traceExporter),
		sdktrace.WithResource(resource),
		sdktrace.WithSampler(sdktrace.ParentBased(sdktrace.AlwaysSample())),
	)

	otel.SetTracerProvider(tracerProvider)

	// CRITICAL: OTel Go defaults to a NO-OP propagator. Without this line, the
	// traceparent header Envoy Gateway injects is silently ignored and your app
	// starts a fresh, disconnected trace instead of joining Envoy's span.
	otel.SetTextMapPropagator(
		propagation.NewCompositeTextMapPropagator(
			propagation.TraceContext{},
			propagation.Baggage{},
		),
	)

	return tracerProvider, nil
}

func MetricsMiddleware(conf *Config) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		start := time.Now()

		ctx.Next()

		route := ctx.FullPath()
		if route == "" || route == "/metrics" || route == "/healthz" {
			return
		}

		attrs := []attribute.KeyValue{
			semconv.HTTPRequestMethodKey.String(ctx.Request.Method),
			semconv.HTTPResponseStatusCode(ctx.Writer.Status()),
			semconv.HTTPRoute(route),
		}

		reqCtx := ctx.Request.Context()

		conf.ApplicationMetrics.httpRequestDurationSeconds.Record(
			reqCtx,
			time.Since(start).Seconds(),
			meter.WithAttributes(attrs...),
		)

		conf.ApplicationMetrics.httpRequestsReceivedTotal.Add(
			reqCtx,
			1,
			meter.WithAttributes(attrs...),
		)
	}
}

func LogrusMiddleware(log *logrus.Logger) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		start := time.Now()

		ctx.Next()

		route := ctx.FullPath()
		if route == "/metrics" || route == "/healthz" {
			return
		}

		if route == "" {
			route = "unmatched"
		}

		entry := log.WithContext(ctx.Request.Context()).WithFields(logrus.Fields{
			"status":     ctx.Writer.Status(),
			"method":     ctx.Request.Method,
			"path":       ctx.Request.URL.Path,
			"route":      route,
			"ip":         ctx.ClientIP(),
			"latency_ms": float64(time.Since(start).Microseconds()) / 1000.0,
			"userAgent":  ctx.Request.UserAgent(),
		})

		switch {
		case ctx.Writer.Status() >= http.StatusInternalServerError:
			entry.Error("request completed")
		case ctx.Writer.Status() >= http.StatusBadRequest:
			entry.Warn("request completed")
		default:
			entry.Info("request completed")
		}
	}
}

func LoggerFrom(ctx *gin.Context, log *logrus.Logger) *logrus.Entry {
	return log.WithContext(ctx.Request.Context())
}

func SpanFrom(ctx context.Context, name string) (context.Context, trace.Span) {
	return otel.Tracer(ServiceName).Start(ctx, name)
}
