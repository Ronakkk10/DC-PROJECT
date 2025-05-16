const amqp = require("amqplib");
const mongoose = require("mongoose");
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");

// Load proto for gRPC
const packageDef = protoLoader.loadSync("log.proto", {});
const grpcObject = grpc.loadPackageDefinition(packageDef);
const logPackage = grpcObject.logger; // <-- lowercase to match `package logger`

// MongoDB connection for logsdb (same connection used in server.js)
const logsConnection = mongoose.createConnection(
  "mongodb://mongo:27017/logsdb",
  { useNewUrlParser: true, useUnifiedTopology: true }
);

logsConnection.on("connected", () => {
  console.log("MongoDB LOGS Connected");
});
logsConnection.on("error", (err) => {
  console.log("MongoDB LOGS Connection Error:", err);
});

// EventLog model using logsConnection
const EventLog = logsConnection.model(
  "EventLog",
  new mongoose.Schema({
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    eventType: { type: String, required: true },
    details: { type: Object, default: {} },
    timestamp: { type: Date, default: Date.now },
  })
);

function logEvent(call, callback) {
  console.log("Received log data:", call.request); // Log the incoming request

  const { userId, eventType, timestamp, details } = call.request;

  // Save the log data to MongoDB
  try {
    const log = new EventLog({
      userId,
      eventType,
      timestamp,
      details, // Store details directly as it is already an object
    });

    log
      .save()
      .then(() => {
        console.log("Log saved to MongoDB");
        callback(null, { message: "Log saved via gRPC" });
      })
      .catch((err) => {
        console.error("Error saving log to MongoDB:", err);
        callback(err);
      });
  } catch (err) {
    console.error("Error parsing details:", err);
    callback({
      code: grpc.status.INVALID_ARGUMENT,
      details: "Invalid JSON in details field",
    });
  }
}

// gRPC server setup
const grpcServer = new grpc.Server();
grpcServer.addService(logPackage.LogService.service, { LogEvent: logEvent }); // <-- Added the logEvent function here
grpcServer.bindAsync(
  "0.0.0.0:50051",
  grpc.ServerCredentials.createInsecure(),
  () => {
    console.log("gRPC server running on port 50051");
  }
);

// RabbitMQ consumer
async function startConsumer() {
  const connection = await amqp.connect("amqp://rabbitmq:5672");
  const channel = await connection.createChannel();
  await channel.assertQueue("event_logs");

  channel.consume("event_logs", async (msg) => {
    const raw = msg.content.toString();
    console.log("Raw message:", raw);

    const logData = JSON.parse(raw);
    console.log("Parsed log data:", logData);

    if (msg !== null) {
      const client = new logPackage.LogService(
        "log-worker:50051",
        grpc.credentials.createInsecure()
      );

      client.LogEvent(
        {
          userId: logData.userId,
          eventType: logData.eventType,
          timestamp: logData.timestamp,
          details: logData.details, // Send details directly as an object (no stringification needed)
        },
        (err, response) => {
          if (err) console.error("gRPC log error:", err.message);
          else console.log(response.message); // Log the gRPC response message
        }
      );

      channel.ack(msg); // Acknowledge that the message has been processed
    }
  });
}

startConsumer();
console.log("RabbitMQ consumer started");
