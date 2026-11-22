import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info?.componentStack);
  }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen grid place-items-center bg-[#080B11] text-neutral-200 p-6">
          <div className="sf-panel max-w-md w-full p-6 text-center space-y-4">
            <p className="font-disp text-2xl font-bold tracking-tight">Something went wrong</p>
            <p className="text-sm text-neutral-400 font-mono">{String(this.state.error?.message || this.state.error).slice(0, 200)}</p>
            <button className="sf-btn sf-btn-p" onClick={() => { this.setState({ error: null }); window.location.reload(); }}>Reload</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}