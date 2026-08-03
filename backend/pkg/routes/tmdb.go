package routes

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"

	"github.com/bakseter/mandagsmiddag/pkg/config"
	"github.com/gin-gonic/gin"
)

const tmdbAPIBase = "https://api.themoviedb.org/3"

type TMDBSearchJSON struct {
	Page    uint            `json:"page,omitempty"`
	Results []TMDBMovieJSON `json:"results,omitempty"`
}

type TMDBMovieJSON struct {
	ID          uint   `json:"id,omitempty"`
	Title       string `json:"title,omitempty"`
	ReleaseDate string `json:"release_date,omitempty"` //nolint:tagliatelle
	PosterPath  string `json:"poster_path,omitempty"`  //nolint:tagliatelle
}

type TMDBMovieCamelcaseJSON struct {
	ID          uint   `json:"id,omitempty"`
	Title       string `json:"title,omitempty"`
	ReleaseDate string `json:"releaseDate,omitempty"`
	PosterPath  string `json:"posterPath,omitempty"`
}

func (tmdbMovie *TMDBMovieJSON) toCamelcase() *TMDBMovieCamelcaseJSON {
	return &TMDBMovieCamelcaseJSON{
		ID:          tmdbMovie.ID,
		Title:       tmdbMovie.Title,
		ReleaseDate: tmdbMovie.ReleaseDate,
		PosterPath:  tmdbMovie.PosterPath,
	}
}

type TMDBExternalIDsJSON struct {
	IMDBID string `json:"imdb_id,omitempty"` //nolint:tagliatelle
}

type TMDBExternalIDsCamelcaseJSON struct {
	IMDBID string `json:"imdbId,omitempty"`
}

func (tmdbExternalIDs *TMDBExternalIDsJSON) toCamelcase() *TMDBExternalIDsCamelcaseJSON {
	return &TMDBExternalIDsCamelcaseJSON{
		IMDBID: tmdbExternalIDs.IMDBID,
	}
}

func TmdbRoutes(router *gin.RouterGroup, conf *config.Config) {
	router.GET("/tmdb/search", config.WithConfig(tmdbSearch, conf))
	router.GET("/tmdb/movie/:id/externalIds", config.WithConfig(tmdbExternalIDs, conf))
}

func tmdbSearch(ctx *gin.Context, conf *config.Config) {
	query := ctx.Query("q")
	if query == "" {
		config.LoggerFrom(ctx, conf.Logger).Error("missing query parameter 'q'")
		ctx.JSON(400, gin.H{"error": "missing query parameter 'q'"})

		return
	}

	tmdbURL := fmt.Sprintf(
		"%s/search/movie?query=%s&include_adult=false&language=en-US&page=1",
		tmdbAPIBase,
		url.QueryEscape(query),
	)

	request, err := http.NewRequestWithContext(ctx, http.MethodGet, tmdbURL, nil)
	if err != nil {
		config.LoggerFrom(ctx, conf.Logger).WithError(err).Error("failed to create request for TMDB")
		ctx.JSON(502, gin.H{"error": "failed to create request for TMDB"})

		return
	}

	request.Header.Add("Authorization", "Bearer "+conf.TMDBAPIReadAccessToken)

	response, err := conf.HTTPClient.Do(request)
	if err != nil {
		config.LoggerFrom(ctx, conf.Logger).WithError(err).Error("failed to reach TMDB")
		ctx.JSON(502, gin.H{"error": "failed to reach TMDB"})

		return
	}
	defer response.Body.Close()

	if response.StatusCode != 200 { //nolint:usestdlibvars
		config.LoggerFrom(ctx, conf.Logger).Errorf(
			"TMDB request failed: statuscode=%d, response=%s",
			response.StatusCode,
			response.Body,
		)
		ctx.JSON(response.StatusCode, gin.H{"error": "TMDB request failed"})

		return
	}

	var tmdbSearch TMDBSearchJSON
	if err := json.NewDecoder(response.Body).Decode(&tmdbSearch); err != nil {
		config.LoggerFrom(ctx, conf.Logger).WithError(err).Error("failed to parse TMDB response")
		ctx.JSON(502, gin.H{"error": "failed to parse TMDB response"})

		return
	}

	var tmdbMoviesCamelcase []TMDBMovieCamelcaseJSON
	for _, movie := range tmdbSearch.Results {
		tmdbMoviesCamelcase = append(tmdbMoviesCamelcase, *movie.toCamelcase())
	}

	ctx.JSON(response.StatusCode, tmdbMoviesCamelcase)
}

func tmdbExternalIDs(ctx *gin.Context, conf *config.Config) {
	movieID := ctx.Param("id")

	tmdbURL := fmt.Sprintf(
		"%s/movie/%s/external_ids",
		tmdbAPIBase,
		movieID,
	)

	request, err := http.NewRequestWithContext(ctx, http.MethodGet, tmdbURL, nil)
	if err != nil {
		config.LoggerFrom(ctx, conf.Logger).WithError(err).Error("failed to create request for TMDB")
		ctx.JSON(502, gin.H{"error": "failed to create request for TMDB"})

		return
	}

	request.Header.Add("Authorization", "Bearer "+conf.TMDBAPIReadAccessToken)

	response, err := conf.HTTPClient.Do(request)
	if err != nil {
		config.LoggerFrom(ctx, conf.Logger).WithError(err).Error("failed to reach TMDB")
		ctx.JSON(502, gin.H{"error": "failed to reach TMDB"})

		return
	}
	defer response.Body.Close()

	if response.StatusCode != 200 { //nolint:usestdlibvars
		config.LoggerFrom(ctx, conf.Logger).Errorf(
			"TMDB request failed: statuscode=%d, response=%s",
			response.StatusCode,
			response.Body,
		)
		ctx.JSON(response.StatusCode, gin.H{"error": "TMDB request failed"})

		return
	}

	var tmdbExternalIDs TMDBExternalIDsJSON
	if err := json.NewDecoder(response.Body).Decode(&tmdbExternalIDs); err != nil {
		config.LoggerFrom(ctx, conf.Logger).WithError(err).Error("failed to parse TMDB response")
		ctx.JSON(502, gin.H{"error": "failed to parse TMDB response"})

		return
	}

	ctx.JSON(response.StatusCode, tmdbExternalIDs.toCamelcase())
}
