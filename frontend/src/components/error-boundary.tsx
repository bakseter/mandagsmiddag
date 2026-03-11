import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProperties {
    children: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
}

class ErrorBoundary extends Component<
    ErrorBoundaryProperties,
    ErrorBoundaryState
> {
    constructor(properties: ErrorBoundaryProperties) {
        super(properties);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
        console.error('Error getDerivedStateFromError:', error);
        // Update state to indicate that an error has occurred
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // You can log the error here if needed
        console.error('Error caught by boundary:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            // You can render a fallback UI here
            return <div>Something went wrong!</div>;
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
