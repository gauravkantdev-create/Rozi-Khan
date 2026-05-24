import mongoose from "mongoose";

const connectDB = async () => {
  try {

    console.log("Trying to connect MongoDB...");

    // Check Mongo URI
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI missing in .env");
    }

    // MongoDB Connection
    const conn = await mongoose.connect(process.env.MONGO_URI, {

      serverSelectionTimeoutMS: 5000, // 5 sec timeout

    });

    console.log("=================================");
    console.log(" MongoDB Connected Successfully ");
    console.log(` Host: ${conn.connection.host}`);
    console.log("=================================");

  } catch (error) {

    console.log("=================================");
    console.log(" MongoDB Connection Failed ");
    console.log(` Error: ${error.message}`);
    console.log("=================================");
    throw error;

  }
};

export default connectDB;