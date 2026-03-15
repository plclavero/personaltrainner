import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

console.log("🚀 Iniciando PersonalTrainner...");

// Error Boundary minimalista para depuración en producción
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("❌ Error Fatal en React:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', background: '#450a0a', color: '#fca5a5', height: '100vh' }}>
          <h1>Algo salió mal en el arranque</h1>
          <pre style={{ background: '#000', padding: '10px', borderRadius: '4px' }}>
            {this.state.error?.toString()}
          </pre>
          <p>Revisa las variables de entorno o la consola del navegador.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);