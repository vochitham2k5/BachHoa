import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() { return { hasError: true }; }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container my-5 text-center">
          <h3>Đã có lỗi xảy ra</h3>
          <p>Vui lòng thử lại hoặc tải lại trang.</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>Tải lại</button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
