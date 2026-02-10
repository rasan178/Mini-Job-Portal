import { Schema, model, Types } from "mongoose";

export interface IEmployerProfile {
  userId: Types.ObjectId;
  companyName: string;
  description?: string;
  website?: string;
  createdAt: Date;
  updatedAt: Date;
}

const employerProfileSchema = new Schema<IEmployerProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    companyName: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    website: { type: String, trim: true },
  },
  { timestamps: true }
);

export const EmployerProfile = model<IEmployerProfile>(
  "EmployerProfile",
  employerProfileSchema
);
