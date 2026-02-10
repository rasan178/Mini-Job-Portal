import { Schema, model, Types } from "mongoose";

export type JobType = "Internship" | "Full-time";

export interface IJob {
  employerId: Types.ObjectId;
  title: string;
  description: string;
  location: string;
  jobType: JobType;
  salaryRange?: string;
  createdAt: Date;
  updatedAt: Date;
}

const jobSchema = new Schema<IJob>(
  {
    employerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    jobType: { type: String, enum: ["Internship", "Full-time"], required: true },
    salaryRange: { type: String, trim: true },
  },
  { timestamps: true }
);

export const Job = model<IJob>("Job", jobSchema);
