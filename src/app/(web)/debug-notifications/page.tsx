"use client";

import { useState } from "react";

interface TokenEntry {
  _id: string;
  token: string;
  createdAt: string;
}

export default function DebugNotificationsPage() {
  const [tokens, setTokens] = useState<TokenEntry[]>([]);
  const [loadStatus, setLoadStatus] = useState<string>("");
  const [sendStatus, setSendStatus] = useState<string>("");
  const [selectedToken, setSelectedToken] = useState<string>("");

  async function fetchTokens() {
    setLoadStatus("Loading…");
    try {
      const res = await fetch("/api/v1/debug-notifications");
      const json = await res.json();
      setTokens(json.data?.tokens ?? []);
      setLoadStatus(`Found ${json.data?.count ?? 0} token(s)`);
    } catch (e) {
      setLoadStatus(`Error: ${e}`);
    }
  }

  async function sendNotification() {
    if (!selectedToken) {
      setSendStatus("Select a token first.");
      return;
    }
    setSendStatus("Sending…");
    try {
      const res = await fetch("/api/v1/debug-notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: selectedToken }),
      });
      const json = await res.json();
      if (json.data?.success) {
        setSendStatus(`SUCCESS — messageId: ${json.data.messageId}`);
      } else {
        setSendStatus(`FAILED — ${json.error ?? JSON.stringify(json)}`);
      }
    } catch (e) {
      setSendStatus(`Error: ${e}`);
    }
  }

  return (
    <div style={{ fontFamily: "monospace", padding: 32, maxWidth: 800 }}>
      <h1 style={{ fontSize: 20, fontWeight: "bold", marginBottom: 24 }}>
        🔔 Notification Debug Page
      </h1>

      {/* Fetch tokens */}
      <section style={{ marginBottom: 32 }}>
        <button
          onClick={fetchTokens}
          style={btnStyle}
        >
          Fetch tokens from DB
        </button>
        {loadStatus && <p style={{ marginTop: 8, color: "#555" }}>{loadStatus}</p>}

        {tokens.length > 0 && (
          <table style={{ marginTop: 16, borderCollapse: "collapse", width: "100%" }}>
            <thead>
              <tr>
                {["#", "Token (truncated)", "Created at", "Select"].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tokens.map((t, i) => (
                <tr key={t._id} style={{ background: i % 2 === 0 ? "#f9f9f9" : "#fff" }}>
                  <td style={tdStyle}>{i + 1}</td>
                  <td style={{ ...tdStyle, fontSize: 11, wordBreak: "break-all" }}>
                    {t.token.slice(0, 40)}…
                  </td>
                  <td style={tdStyle}>{new Date(t.createdAt).toLocaleString()}</td>
                  <td style={tdStyle}>
                    <input
                      type="radio"
                      name="token"
                      value={t.token}
                      onChange={() => setSelectedToken(t.token)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Send notification */}
      <section>
        <p style={{ marginBottom: 8, color: selectedToken ? "#333" : "#b45309" }}>
          {selectedToken
            ? `Selected: ${selectedToken.slice(0, 40)}…`
            : "Select a token from the table above first."}
        </p>
        <button onClick={sendNotification} style={{ ...btnStyle, background: "#16a34a" }}>
          Send test notification
        </button>
        {selectedToken && (
          <button
            onClick={() => setSelectedToken("")}
            style={{ ...btnStyle, background: "#6b7280", marginLeft: 8 }}
          >
            Clear selection
          </button>
        )}
        {sendStatus && <p style={{ marginTop: 8, color: "#555" }}>{sendStatus}</p>}
      </section>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  padding: "8px 16px",
  background: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: 14,
};

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "6px 10px",
  borderBottom: "2px solid #ddd",
  fontSize: 12,
};

const tdStyle: React.CSSProperties = {
  padding: "6px 10px",
  borderBottom: "1px solid #eee",
  fontSize: 13,
};
