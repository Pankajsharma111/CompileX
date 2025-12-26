import express, { json } from "express";
import connectDB from "./config/db.js";
import "dotenv/config";
import cors from "cors";
import userRouter from "./routes/userRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";

const app = express();
const PORT = process.env.SERVER_URL || 8080;

await connectDB();

//middleware
app.use(cors());
app.use(express.json());

//Routes
app.get("/", (req, res) => {
  console.log("Server is running successfully!");
  res.send("Server is live.");
});

app.use("/api/user", userRouter);

app.use("/api/uploads", uploadRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  res.status(500).json({ success: false, message: "Internal Server Error" });
});

app.get("/cse", (req, res) => {
  console.log("Accepted req on root('/cse')");
  res.send("This is the root directory");
});

app.listen(PORT, () => {
  console.log("Server is listening on PORT: ", PORT);
});
