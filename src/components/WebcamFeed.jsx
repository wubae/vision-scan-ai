// src/components/WebcamFeed.jsx
import React, { useEffect, useRef, useState } from "react";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const WebcamFeed = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  let lastLogTime = 0;

  useEffect(() => {
    const startWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoRef.current.srcObject = stream;
      } catch (err) {
        console.error("Error accessing webcam:", err);
      }
    };

    const runObjectDetection = async () => {
      const model = await cocoSsd.load();
      console.log("COCO-SSD model loaded");

      const detectFrame = async () => {
        if (videoRef.current && model) {
          const predictions = await model.detect(videoRef.current);

          const ctx = canvasRef.current.getContext("2d");
          ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

          predictions.forEach((prediction) => {
            const [x, y, width, height] = prediction.bbox;
            ctx.strokeStyle = "#00FFFF";
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, width, height);
            ctx.font = "bold 16px Arial";
            ctx.fillStyle = prediction.score > 0.8 ? "#00FF00" : "#FFA500";
            ctx.fillText(
              `${prediction.class} (${(prediction.score * 100).toFixed(1)}%)`,
              x,
              y > 10 ? y - 5 : 10
            );
          });

          const now = Date.now();
          if (predictions.length > 0 && now - lastLogTime > 1000) {
            const top = predictions[0];

            if (top.class.toLowerCase() !== "person") {
              lastLogTime = now;

              fetch(`${BACKEND_URL}/log-detection`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  label: top.class,
                  confidence: top.score,
                }),
              }).catch((err) => {
                console.error("Logging error:", err.message);
              });
            }
          }
        }

        requestAnimationFrame(detectFrame);
      };

      detectFrame();
    };

    startWebcam().then(runObjectDetection);
  }, []);

  return (
    <div className="video-container" style={{ position: "relative" }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        width="640"
        height="480"
        style={{ position: "absolute", top: 0, left: 0 }}
      />
      <canvas
        ref={canvasRef}
        width="640"
        height="480"
        style={{ position: "absolute", top: 0, left: 0 }}
      />
    </div>
  );
};

export default WebcamFeed;
