import { Schema, model, Types } from "mongoose";

export interface ICV {
  _id?: Types.ObjectId;
  url: string;
  fileName?: string;
  uploadedAt: Date;
}

export interface ICandidateProfile {
  userId: Types.ObjectId;
  phone?: string;
  location?: string;
  skills: string[];
  bio?: string;
  cvs: ICV[];
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
    cvs: [
      {
        url: { type: String, required: true },
        fileName: { type: String, trim: true },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export const CandidateProfile = model<ICandidateProfile>(
  "CandidateProfile",
  candidateProfileSchema
);
