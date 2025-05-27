// src/components/Dashboard.jsx
import React, { useEffect, useState } from "react";
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Dashboard = () => {
  const [logs, setLogs] = useState([]);
  const [showModal, setShowModal] = useState(false); // modal toggle

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/logs`);
        const data = await response.json();
        setLogs(data);
      } catch (error) {
        console.error("Failed to fetch logs:", error);
      }
    };

    fetchLogs(); // initial load
    const interval = setInterval(fetchLogs, 5000); // auto-refresh every 5s
    return () => clearInterval(interval); // cleanup
  }, []);

  const downloadCSV = () => {
    if (logs.length === 0) {
      alert("No data to download.");
      return;
    }

    const headers = ["Object", "Confidence", "Time"];
    const rows = logs.map((log) => [
      log.label,
      (log.confidence * 100).toFixed(1) + "%",
      new Date(log.timestamp).toLocaleString()
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "detection_logs.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ padding: "1rem", width: "100%" }}>
      {/* Header + Buttons */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
          width: "90%",
        }}
      >
        <button
          onClick={() => setShowModal(true)}
          style={{
            background: "#ff5555",
            color: "white",
            padding: "0.4rem 0.8rem",
            fontSize: "0.9rem",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          🧹 Clear All Logs
        </button>

        <h2 style={{ margin: 0, textAlign: "center", color: "#fff" }}>
          📊 Recent Detections
        </h2>

        <button
          onClick={downloadCSV}
          style={{
            background: "#00bcd4",
            color: "white",
            padding: "0.4rem 0.8rem",
            fontSize: "0.9rem",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          📥 Download CSV
        </button>
      </div>

      {/* Table */}
      <table
        border="1"
        cellPadding="8"
        style={{
          width: "90%",
          background: "#222",
          color: "#fff",
          borderCollapse: "collapse",
          textAlign: "center",
        }}
      >
        <thead>
          <tr>
            <th>Object</th>
            <th>Confidence</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {logs
            .sort((a, b) => b.timestamp - a.timestamp)
            .map((log) => (
              <tr key={log.id}>
                <td>{log.label}</td>
                <td>{(log.confidence * 100).toFixed(1)}%</td>
                <td>{new Date(log.timestamp).toLocaleTimeString()}</td>
              </tr>
            ))}
        </tbody>
      </table>

      {/* Modal */}
      {showModal && (
        <div style={{
          position: "fixed",
          top: 0, left: 0,
          width: "100vw", height: "100vh",
          backgroundColor: "rgba(0,0,0,0.6)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000
        }}>
          <div style={{
            background: "#1e1e1e",
            color: "#fff",
            padding: "2rem",
            borderRadius: "10px",
            boxShadow: "0 0 20px rgba(0,0,0,0.5)",
            textAlign: "center",
            width: "300px"
          }}>
            <h3>🧹 Clear All Logs?</h3>
            <p>This action cannot be undone.</p>
            <div style={{ marginTop: "1rem", display: "flex", justifyContent: "space-around" }}>
              <button
                onClick={() => {
                  fetch(`${BACKEND_URL}/logs`, { method: "DELETE" })
                    .catch(err => alert("Failed to delete logs."))
                    .finally(() => setShowModal(false));
                }}
                style={{
                  background: "#ff5555",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  padding: "0.4rem 0.8rem",
                  cursor: "pointer"
                }}
              >
                Confirm
              </button>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: "#444",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  padding: "0.4rem 0.8rem",
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
