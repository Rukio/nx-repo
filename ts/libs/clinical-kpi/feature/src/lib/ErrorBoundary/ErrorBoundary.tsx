import React from 'react';

export type ErrorBoundaryProps = {
  children: React.ReactNode;
  errorComponent: React.ReactNode;
};

type State = {
  hasError: boolean;
};

class ErrorBoundary extends React.Component<ErrorBoundaryProps, State> {
  override state: State = {
    hasError: false,
  };

  static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  override componentDidCatch() {
    return { hasError: true };
  }

  override render() {
    const { children, errorComponent } = this.props;
    const { hasError } = this.state;
    if (hasError) {
      return errorComponent;
    }

    return children;
  }
}

export default ErrorBoundary;
