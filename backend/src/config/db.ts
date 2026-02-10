import mongoose from "mongoose";

export const connectDb = async (mongoUri: string) => {
  if (!mongoUri) {
    throw new Error("MONGO_URI is required");
  }

  await mongoose.connect(mongoUri);
  console.log("MongoDB connected");
};
