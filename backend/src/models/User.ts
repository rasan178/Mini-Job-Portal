import { Schema, model } from "mongoose";

export type UserRole = "candidate" | "employer" | "admin";

export interface IUser {
  email: string;
  passwordHash: string;
  role: UserRole;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["candidate", "employer", "admin"], required: true },
    name: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

export const User = model<IUser>("User", userSchema);
