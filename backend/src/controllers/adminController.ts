import { Request, Response } from "express";
import { Job } from "../models/Job";

export const listAllJobs = async (_req: Request, res: Response) => {
  const jobs = await Job.find().sort({ createdAt: -1 });
  return res.json({ jobs });
};

export const adminDeleteJob = async (req: Request, res: Response) => {
  const job = await Job.findById(req.params.id);
  if (!job) {
    return res.status(404).json({ message: "Job not found" });
  }

  await job.deleteOne();
  return res.json({ message: "Job deleted by admin" });
};
