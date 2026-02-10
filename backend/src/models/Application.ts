import { Schema, model, Types } from "mongoose";

export type ApplicationStatus = "Pending" | "Shortlisted" | "Rejected";

export interface IApplication {
  jobId: Types.ObjectId;
  candidateId: Types.ObjectId;
  message?: string;
  cvUrl?: string;
  status: ApplicationStatus;
  createdAt: Date;
  updatedAt: Date;
}

const applicationSchema = new Schema<IApplication>(
  {
    jobId: { type: Schema.Types.ObjectId, ref: "Job", required: true },
    candidateId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, trim: true },
    cvUrl: { type: String, trim: true },
    status: {
      type: String,
      enum: ["Pending", "Shortlisted", "Rejected"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

applicationSchema.index({ jobId: 1, candidateId: 1 }, { unique: true });

export const Application = model<IApplication>("Application", applicationSchema);
