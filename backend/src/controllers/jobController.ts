import { Request, Response } from "express";
import { Job } from "../models/Job";

export const listJobs = async (req: Request, res: Response) => {
  const { keyword, location, jobType } = req.query as {
    keyword?: string;
    location?: string;
    jobType?: string;
  };

  const filter: Record<string, unknown> = {};
  if (keyword) {
    filter.$or = [
      { title: { $regex: keyword, $options: "i" } },
      { description: { $regex: keyword, $options: "i" } },
    ];
  }
  if (location) {
    filter.location = { $regex: location, $options: "i" };
  }
  if (jobType) {
    filter.jobType = jobType;
  }

  const jobs = await Job.find(filter).sort({ createdAt: -1 });
  return res.json({ jobs });
};

export const getJob = async (req: Request, res: Response) => {
  const job = await Job.findById(req.params.id);
  if (!job) {
    return res.status(404).json({ message: "Job not found" });
  }

  return res.json({ job });
};

export const createJob = async (req: Request, res: Response) => {
  const { title, description, location, jobType, salaryRange } = req.body as {
    title?: string;
    description?: string;
    location?: string;
    jobType?: "Internship" | "Full-time";
    salaryRange?: string;
  };

  if (!title || !description || !location || !jobType) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const job = await Job.create({
    employerId: req.user?.id,
    title,
    description,
    location,
    jobType,
    salaryRange,
  });

  return res.status(201).json({ job });
};

export const updateJob = async (req: Request, res: Response) => {
  const job = await Job.findById(req.params.id);
  if (!job) {
    return res.status(404).json({ message: "Job not found" });
  }

  if (job.employerId.toString() !== req.user?.id.toString()) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const { title, description, location, jobType, salaryRange } = req.body as {
    title?: string;
    description?: string;
    location?: string;
    jobType?: "Internship" | "Full-time";
    salaryRange?: string;
  };

  job.title = title ?? job.title;
  job.description = description ?? job.description;
  job.location = location ?? job.location;
  job.jobType = jobType ?? job.jobType;
  job.salaryRange = salaryRange ?? job.salaryRange;

  await job.save();
  return res.json({ job });
};

export const deleteJob = async (req: Request, res: Response) => {
  const job = await Job.findById(req.params.id);
  if (!job) {
    return res.status(404).json({ message: "Job not found" });
  }

  if (job.employerId.toString() !== req.user?.id.toString()) {
    return res.status(403).json({ message: "Forbidden" });
  }

  await job.deleteOne();
  return res.json({ message: "Job deleted" });
};
