const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

// ---- STATE ----
let trade = {
  entry: null,
  stopLoss: null,
  price: 100,
  score: 100
};

// ---- SOCKET ----
io.on("connection", (socket) => {
  console.log("User connected");

  // Init trade
  socket.on("startTrade", ({ entry, stopLoss }) => {
    trade.entry = entry;
    trade.stopLoss = stopLoss;
    trade.score = 100;

    console.log("Trade started:", trade);
  });

  // Move SL
  socket.on("moveSL", (newSL) => {
    if (trade.entry && newSL < trade.stopLoss && newSL < trade.entry) {
      trade.score -= 20;

      socket.emit("warning", {
        text: "You moved stop-loss further away (Loss Aversion)"
      });
    }

    trade.stopLoss = newSL;
  });
});

// ---- PRICE SIMULATION ----
setInterval(() => {
  const change = (Math.random() - 0.5) * 2;
  trade.price += change;

  io.emit("priceUpdate", trade.price);
}, 1000);

// ---- START SERVER ----
server.listen(5000, () => {
  console.log("Server running on port 5000");
});