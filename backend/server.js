// server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import whisperRoutes from "./routes/whisperRoutes.js";
import friendRoutes from "./routes/friendRoutes.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use("/api/users", userRoutes);
app.use("/api/whispers", whisperRoutes);
app.use("/api/friends", friendRoutes);

// Connect to MongoDB
connectDB();

// Basic route
app.get("/", (req, res) => {
  res.send("Welcome to Whisp API!");
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
