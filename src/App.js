// src/App.js
import React from "react";
import WebcamFeed from "./components/WebcamFeed";
import Dashboard from "./components/Dashboard";
import "./styles.css";

function App() {
  return (
    <div className="app-container" style={{ backgroundColor: "#121212", minHeight: "100vh", color: "#fff", padding: "2rem" }}>
      <h1 className="app-title" style={{ textAlign: "center", marginBottom: "2rem" }}>VisionScan AI</h1>
      <div className="main-content"
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "flex-start",
          gap: "1rem",
        }}
      >
        <div className="video-section" style={{ flex: "1 1 640px", minWidth: "320px" }}>
          <WebcamFeed />
        </div>
        <div className="dashboard-section" style={{ flex: "1 1 600px", minWidth: "320px", marginLeft: "-40px" }}>
          <Dashboard />
        </div>
      </div>
    </div>
  );
}

export default App;
