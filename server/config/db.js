import mongoose from "mongoose";

const connectDB = async () => {
  // It's better to set up event listeners before trying to connect.
  mongoose.connection.on("connected", () => {
    console.log("Database connected successfully.");
  });

  mongoose.connection.on("error", (err) => {
    console.error(`Database connection error: ${err.message}`);
  });

  mongoose.connection.on("disconnected", () => {
    console.log("Database disconnected.");
  });

  try {
    await mongoose.connect(process.env.MONGODB_URI);
  } catch (error) {
    console.error(`Initial database connection failed: ${error.message}`);
    // Exit process with failure
    process.exit(1);
  }
};

export default connectDB;
