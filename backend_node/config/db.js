import mongoose from "mongoose";

const connectDB = async () => {
  try {

    console.log("Trying to connect MongoDB...");

    // Check Mongo URI
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI missing in .env");
    }

    // Use same database on localhost and Render (default: test — where local users are stored)
    const dbName = process.env.MONGO_DB_NAME || "test";

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      dbName,
      serverSelectionTimeoutMS: 5000,
    });

    console.log("=================================");
    console.log(" MongoDB Connected Successfully ");
    console.log(` Host: ${conn.connection.host}`);
    console.log(` Database: ${conn.connection.db?.databaseName || dbName}`);
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