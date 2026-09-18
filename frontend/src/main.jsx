import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("App Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'red', fontFamily: 'monospace', background: '#fff0f0', height: '100vh' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold' }}>⚠️ May Error sa React Render:</h1>
          <pre style={{ whiteSpace: 'pre-wrap', marginTop: '10px', background: '#fff', padding: '10px', border: '1 border red' }}>
            {this.state.error && this.state.error.toString()}
          </pre>
          <p style={{ marginTop: '10px', color: '#333' }}>Component Stack Log:</p>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '11px', background: '#eee', padding: '10px' }}>
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </pre>
        </div>
      );
    }

    return this.props.children; 
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)