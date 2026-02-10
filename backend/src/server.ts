import dotenv from "dotenv";
import app from "./app";
import { connectDb } from "./config/db";

dotenv.config();

const port = Number(process.env.PORT) || 8080;

const start = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || "";
    await connectDb(mongoUri);
    app.listen(port, () => {
      console.log(`API listening on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
};

start();
