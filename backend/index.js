const express = require("express");
const cors = require("cors");
const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");

console.log("🟢 index.js started successfully");

const app = express();
const port = process.env.PORT || 5050;

app.use(cors());
app.use(express.json());

// AWS setup
AWS.config.update({ region: "us-east-2" });
const dynamo = new AWS.DynamoDB.DocumentClient();

// Log every request
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Health check
app.get("/ping", (req, res) => {
  console.log("Ping received");
  res.send("pong");
});

// POST: Log object detection
app.post("/log-detection", async (req, res) => {
  const { label, confidence, deviceId } = req.body;

  if (!deviceId) {
    console.log("Missing deviceId in request body");
    return res.status(400).json({ error: "Missing deviceId in request body" });
  }

  console.log("Received log request:", { label, confidence, deviceId });

  const params = {
    TableName: "ObjectDetections",
    Item: {
      id: uuidv4(),
      label,
      confidence,
      deviceId,
      timestamp: Date.now(),
    },
  };

  try {
    await dynamo.put(params).promise();
    console.log("DynamoDB Write Success");
    res.status(200).json({ message: "Logged successfully" });
  } catch (err) {
    console.error("DynamoDB Write Failed:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET: Fetch logs for a specific device
app.get("/logs", async (req, res) => {
  const deviceId = req.query.deviceId;

  if (!deviceId) {
    console.log("Missing deviceId in query params");
    return res.status(400).json({ error: "Missing deviceId in query" });
  }

  console.log("📄 Fetching logs for deviceId:", deviceId);

  const params = {
    TableName: "ObjectDetections",
    FilterExpression: "deviceId = :did",
    ExpressionAttributeValues: { ":did": deviceId },
    Limit: 50,
  };

  try {
    const data = await dynamo.scan(params).promise();
    console.log(`Retrieved ${data.Items.length} logs`);
    res.status(200).json(data.Items);
  } catch (err) {
    console.error("Failed to fetch logs:", err);
    res.status(500).json({ error: "Could not fetch logs" });
  }
});

// DELETE: Remove all logs
app.delete("/logs", async (req, res) => {
  const scanParams = {
    TableName: "ObjectDetections",
  };

  try {
    const data = await dynamo.scan(scanParams).promise();
    const items = data.Items;

    const deleteRequests = items.map((item) => ({
      DeleteRequest: {
        Key: { id: item.id },
      },
    }));

    const chunked = [];
    while (deleteRequests.length) {
      chunked.push(deleteRequests.splice(0, 25));
    }

    for (const batch of chunked) {
      const params = {
        RequestItems: {
          ObjectDetections: batch,
        },
      };
      await dynamo.batchWrite(params).promise();
    }

    console.log("🧹 All logs cleared");
    res.status(200).json({ message: "All logs deleted" });
  } catch (err) {
    console.error("❌ Failed to delete logs:", err);
    res.status(500).json({ error: "Failed to delete logs" });
  }
});

// Start server
app.listen(port, () => console.log(`🚀 Backend running on port ${port}`));
