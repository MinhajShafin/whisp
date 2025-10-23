import mongoose from "mongoose";

const whisperSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  content: { type: String, required: true, maxLength: 280 },
  createdAt: { type: Date, default: Date.now },
});

const Whisper = mongoose.model("Whisper", whisperSchema);
export default Whisper;
