"use client";
import { useState, useEffect } from "react";
import styles from '../../styles/Home.module.css';

export default function LiveKitTokenGenerator() {
  const [roomName, setRoomName] = useState("my-room");
  const [names, setNames] = useState("");
  const [count, setCount] = useState("");
  const [tokensData, setTokensData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Scroll to top when tokens are generated
  useEffect(() => {
    if (tokensData.length > 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [tokensData]);

  const requestTokens = async () => {
    try {
      setIsLoading(true);
      const payload = { room: roomName };

      if (names.trim() !== "") {
        payload.names = names
          .split(",")
          .map((name) => name.trim())
          .filter((name) => name !== "");
      }

      payload.count = count.trim() !== "" ? parseInt(count, 10) : 0;

      const res = await fetch("/api/livekit-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Error generating token");
        return;
      }

      setTokensData(data.tokens);
    } catch (err) {
      console.error(err);
      alert("Failed contacting server");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("Token copied to clipboard!");
  };

  const clearTokens = () => {
    setTokensData([]);
  };

  return (
    <div
      className={styles.main}
      data-lk-theme="default"
      style={{
        minHeight: "auto",   // ← FIX
        height: "auto",      // ← FIX
        overflow: "visible", // ← FIX
      }}
    >
      <div className="header">
        <h2>
          Token Generator for{" "}
          <a href="https://github.com/livekit/components-js" rel="noopener">
            LiveKit&nbsp;Components
          </a>
        </h2>
      </div>

      {/* OUTPUT */}
      {tokensData.length > 0 && (
        <div style={{ marginBottom: '3rem', width: '100%' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem'
          }}>
            <h3 style={{ margin: 0 }}>
              🎉 Generated Access Tokens ({tokensData.length})
            </h3>
            <button
              onClick={clearTokens}
              className="lk-button"
              style={{
                padding: "8px 16px",
                fontSize: "14px",
                backgroundColor: "var(--lk-secondary)",
              }}
            >
              Clear Tokens
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.5rem',
            width: '100%',
          }}>
            {tokensData.map((item, index) => (
              <div
                key={index}
                style={{
                  background: "var(--lk-bg2)",
                  border: "1px solid var(--lk-border)",
                  padding: "20px",
                  borderRadius: "12px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  display: 'flex',
                  flexDirection: 'column',
                  height: 'fit-content'
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "80px 1fr",
                    rowGap: "6px",
                    columnGap: "10px",
                    marginBottom: "15px",
                    fontSize: "14px",
                  }}
                >
                  <strong>Name:</strong>
                  <span style={{ wordBreak: 'break-word' }}>{item.name}</span>
                  <strong>Room:</strong>
                  <span>{item.room}</span>
                  <strong>Server:</strong>
                  <span style={{ wordBreak: "break-all", fontSize: '12px' }}>
                    {item.roomUrl}
                  </span>
                </div>

                <div style={{ marginBottom: '15px', flex: 1 }}>
                  <strong
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontSize: '14px'
                    }}>
                    Access Token:
                  </strong>
                  <textarea
                    style={{
                      width: "100%",
                      height: "120px",
                      padding: "12px",
                      borderRadius: "8px",
                      border: "1px solid var(--lk-border)",
                      fontFamily: "monospace",
                      fontSize: "12px",
                      backgroundColor: "var(--lk-bg)",
                      color: "var(--lk-text)",
                      resize: "vertical",
                      boxSizing: "border-box"
                    }}
                    value={item.token}
                    readOnly
                  />
                </div>

                <button
                  onClick={() => copyToClipboard(item.token)}
                  className="lk-button"
                  style={{
                    width: "100%",
                    padding: "10px 16px",
                    fontSize: "14px",
                    backgroundColor: "var(--lk-secondary)",
                  }}
                >
                  Copy Token
                </button>
              </div>
            ))}
          </div>

          <div style={{
            textAlign: 'center',
            marginTop: '30px',
            padding: '20px',
            backgroundColor: 'var(--lk-bg2)',
            borderRadius: '12px',
            border: '1px solid var(--lk-border)'
          }}>
            <p style={{ margin: 0, fontSize: '14px', opacity: 0.8, lineHeight: '1.5' }}>
              <strong>Usage Instructions:</strong> These tokens allow participants to join your
              LiveKit room. Each token is valid for 1 hour.
            </p>
          </div>
        </div>
      )}

      {/* INPUT FORM */}
      <div className={styles.tabContainer}>
        <div className={styles.tabContent}>
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>🔑 Generate Room Tokens</h3>
            <p style={{ margin: 0, opacity: 0.8, lineHeight: '1.5' }}>
              Create access tokens manually or automatically.
            </p>
          </div>

          {/* ROOM INPUT */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="roomName" style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
              Room Name *
            </label>
            <input
              id="roomName"
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid var(--lk-border)",
                fontSize: "16px",
                backgroundColor: "var(--lk-bg)",
                color: "var(--lk-text)",
              }}
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              required
            />
          </div>

          {/* NAME INPUT */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="participantNames" style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
              Participant Names (comma separated)
            </label>
            <input
              id="participantNames"
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid var(--lk-border)",
                fontSize: "16px",
                backgroundColor: "var(--lk-bg)",
                color: "var(--lk-text)",
              }}
              placeholder="john, jane, user1"
              value={names}
              onChange={(e) => setNames(e.target.value)}
            />
          </div>

          {/* COUNT INPUT */}
          <div style={{ marginBottom: '2rem' }}>
            <label htmlFor="autoGenerateCount" style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
              Auto Generate Count
            </label>
            <input
              id="autoGenerateCount"
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid var(--lk-border)",
                fontSize: "16px",
                backgroundColor: "var(--lk-bg)",
                color: "var(--lk-text)",
              }}
              placeholder="0"
              type="number"
              min="0"
              value={count}
              onChange={(e) => setCount(e.target.value)}
            />
          </div>

          <button
            onClick={requestTokens}
            disabled={isLoading}
            className="lk-button"
            style={{
              width: "100%",
              padding: "14px 16px",
              fontSize: "16px",
              marginBottom: '1rem',
            }}
          >
            {isLoading ? "Generating Tokens..." : "Generate Tokens"}
          </button>
        </div>
      </div>

      <footer data-lk-theme="default" style={{ marginTop: '3rem' }}>
        LiveKit Token Generator • Built with{" "}
        <a href="https://github.com/livekit/components-js" rel="noopener">
          LiveKit Components
        </a>
      </footer>

      {/* GLOBAL SCROLL FIX */}
      <style jsx global>{`
        html, body {
          height: auto !important;
          overflow-y: auto !important;
        }
      `}</style>
    </div>
  );
}
