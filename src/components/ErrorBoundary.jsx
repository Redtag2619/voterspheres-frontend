import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error("App crashed:", error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            background: "#f3f6f9",
            padding: "32px",
            fontFamily: "Arial, sans-serif",
            color: "#0f172a"
          }}
        >
          <div
            style={{
              maxWidth: "960px",
              margin: "0 auto",
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: "24px",
              padding: "24px",
              boxShadow: "0 10px 30px rgba(15,23,42,0.06)"
            }}
          >
            <div
              style={{
                fontSize: "12px",
                textTransform: "uppercase",
                letterSpacing: "0.18em",
                color: "#0176d3",
                fontWeight: 700
              }}
            >
              VoterSpheres Error Boundary
            </div>

            <h1 style={{ marginTop: "12px", fontSize: "28px" }}>
              The app crashed before rendering.
            </h1>

            <p style={{ color: "#64748b", lineHeight: 1.6 }}>
              This replaces the white screen so we can see the real runtime error.
            </p>

            <div
              style={{
                marginTop: "20px",
                padding: "16px",
                borderRadius: "16px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#b91c1c",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word"
              }}
            >
              {String(this.state.error)}
            </div>

            {this.state.errorInfo?.componentStack ? (
              <pre
                style={{
                  marginTop: "20px",
                  padding: "16px",
                  borderRadius: "16px",
                  background: "#0f172a",
                  color: "#fff",
                  overflowX: "auto",
                  fontSize: "12px",
                  whiteSpace: "pre-wrap"
                }}
              >
                {this.state.errorInfo.componentStack}
              </pre>
            ) : null}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
