// server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

console.log("MONGO_URI:", process.env.MONGO_URI);

// Connect to MongoDB
connectDB();

// Basic route
app.get("/", (req, res) => {
  res.send("Welcome to Whisp API!");
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
