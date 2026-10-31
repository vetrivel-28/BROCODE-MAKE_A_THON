import { useEffect, useState } from "react";

type BackendStatus = "checking" | "connected" | "disconnected";

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

function App() {
  const [backendStatus, setBackendStatus] = useState<BackendStatus>("checking");

  useEffect(() => {
    const controller = new AbortController();

    async function checkBackend() {
      try {
        const response = await fetch(`${apiUrl}/api/health`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Health check failed with HTTP ${response.status}`);
        }

        const health: unknown = await response.json();
        if (
          typeof health !== "object" ||
          health === null ||
          !("status" in health) ||
          health.status !== "ok"
        ) {
          throw new Error("Health endpoint returned an unexpected response");
        }

        setBackendStatus("connected");
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        console.error("Unable to connect to the LoopDesk API:", error);
        setBackendStatus("disconnected");
      }
    }

    void checkBackend();
    return () => controller.abort();
  }, []);

  const statusText = {
    checking: "Checking connection",
    connected: "Backend connected",
    disconnected: "Backend unavailable",
  }[backendStatus];

  return (
    <main className="page-shell">
      <nav className="topbar" aria-label="Main navigation">
        <a className="brand" href="/" aria-label="LoopDesk home">
          <span className="brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span>loopdesk</span>
        </a>
        <span className="topbar-label">SUBSCRIPTION OPERATIONS</span>
      </nav>

      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="eyebrow-dot" />
            YOUR REVENUE, IN A BETTER RHYTHM
          </div>
          <h1 id="hero-title">
            Subscriptions,
            <br />
            <span>in sync.</span>
          </h1>
          <p className="hero-description">
            B2B Subscription Management
            <br />
            <span>
              One clear view of every plan, renewal, and relationship.
            </span>
          </p>
          <div className={`connection-card ${backendStatus}`}>
            <span className="connection-indicator" aria-hidden="true" />
            <span>{statusText}</span>
            <span className="connection-divider" />
            <span className="connection-endpoint">API · /api/health</span>
          </div>
        </div>

        <div className="visual" aria-hidden="true">
          <div className="visual-orbit orbit-outer" />
          <div className="visual-orbit orbit-inner" />
          <div className="visual-spark spark-one">✳</div>
          <div className="visual-spark spark-two">✳</div>
          <div className="visual-spark spark-three">✦</div>
          <div className="visual-card">
            <div className="visual-card-top">
              <span className="visual-card-label">YOUR WORKSPACE</span>
              <span className="visual-card-menu">···</span>
            </div>
            <div className="visual-avatar-row">
              <span className="visual-avatar avatar-purple">L</span>
              <span className="visual-avatar avatar-mint">D</span>
              <span className="visual-avatar avatar-coral">S</span>
              <span className="visual-avatar avatar-yellow">+</span>
            </div>
            <div className="visual-card-footer">
              <div>
                <span className="footer-title">Everything in rhythm</span>
                <span className="footer-subtitle">A calmer way to grow</span>
              </div>
              <span className="footer-arrow">↗</span>
            </div>
          </div>
          <div className="floating-note note-top">
            <span className="note-icon mint-icon">↻</span>
            <span>Made for recurring revenue</span>
          </div>
          <div className="floating-note note-bottom">
            <span className="note-icon coral-icon">✦</span>
            <span>Less admin. More momentum.</span>
          </div>
        </div>

        <div className="hero-footer">
          <span>BUILT FOR THE LONG GAME</span>
          <span className="footer-decoration" aria-hidden="true">
            ━━━ <span>✳</span> ━━━
          </span>
          <span>LOOPDESK · 2026</span>
        </div>
      </section>
    </main>
  );
}

export default App;
