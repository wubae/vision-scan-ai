const express = require("express");
const cors = require("cors");
const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");

console.log("🟢 index.js started successfully");

const app = express(); // define app first
const port = 5050;

app.use(cors());       // use after initialization
app.use(express.json());

AWS.config.update({ region: "us-east-2" });

const dynamo = new AWS.DynamoDB.DocumentClient();

// Log incoming traffic
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.get("/ping", (req, res) => {
  console.log("Ping received");
  res.send("pong");
});

app.post("/log-detection", async (req, res) => {
  const { label, confidence } = req.body;
  console.log("Received log request:", { label, confidence });

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
    console.log("DynamoDB Write Success:", params);
    res.status(200).json({ message: "Logged successfully" });
  } catch (err) {
    console.error("DynamoDB Write Failed:", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => console.log(`Backend running on port ${port}`));

app.get("/logs", async (req, res) => {
  const params = {
    TableName: "ObjectDetections",
    FilterExpression: "deviceId = :did",
    ExpressionAttributeValues: { ":did": deviceId },
    Limit: 50,
  };

  try {
    const data = await dynamo.scan(params).promise();
    res.status(200).json(data.Items);
  } catch (err) {
    console.error("Failed to fetch logs:", err);
    res.status(500).json({ error: "Could not fetch logs" });
  }
});

app.delete("/logs", async (req, res) => {
  const scanParams = {
    TableName: "ObjectDetections",
  };

  try {
    const data = await dynamo.scan(scanParams).promise();
    const items = data.Items;

    const deleteRequests = items.map((item) => ({
      DeleteRequest: {
        Key: { id: item.id }
      }
    }));

    // Split into chunks of 25 (DynamoDB batchWrite limit)
    const chunked = [];
    while (deleteRequests.length) {
      chunked.push(deleteRequests.splice(0, 25));
    }

    // Execute all batches
    for (const batch of chunked) {
      const params = {
        RequestItems: {
          ObjectDetections: batch
        }
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
