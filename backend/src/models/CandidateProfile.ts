import { Schema, model, Types } from "mongoose";

export interface ICandidateProfile {
  userId: Types.ObjectId;
  phone?: string;
  location?: string;
  skills: string[];
  bio?: string;
  cvUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const candidateProfileSchema = new Schema<ICandidateProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    phone: { type: String, trim: true },
    location: { type: String, trim: true },
    skills: { type: [String], default: [] },
    bio: { type: String, trim: true },
    cvUrl: { type: String, trim: true },
  },
  { timestamps: true }
);

export const CandidateProfile = model<ICandidateProfile>(
  "CandidateProfile",
  candidateProfileSchema
);
