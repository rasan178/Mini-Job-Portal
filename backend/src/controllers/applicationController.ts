import { Request, Response } from "express";
import { Application } from "../models/Application";
import { Job } from "../models/Job";
import { CandidateProfile } from "../models/CandidateProfile";

export const applyToJob = async (req: Request, res: Response) => {
  const job = await Job.findById(req.params.id);
  if (!job) {
    return res.status(404).json({ message: "Job not found" });
  }

  const existing = await Application.findOne({
    jobId: job.id,
    candidateId: req.user?.id,
  });
  if (existing) {
    return res.status(409).json({ message: "Already applied to this job" });
  }

  const { message } = req.body as { message?: string };
  let cvUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

  if (!cvUrl) {
    const profile = await CandidateProfile.findOne({ userId: req.user?.id });
    cvUrl = profile?.cvUrl;
  }

  if (!cvUrl) {
    return res.status(400).json({ message: "CV is required to apply" });
  }

  const application = await Application.create({
    jobId: job.id,
    candidateId: req.user?.id,
    message,
    cvUrl,
  });

  return res.status(201).json({ application });
};

export const listMyApplications = async (req: Request, res: Response) => {
  const applications = await Application.find({ candidateId: req.user?.id })
    .populate("jobId", "title location jobType")
    .sort({ createdAt: -1 });

  return res.json({ applications });
};

export const listApplicantsForJob = async (req: Request, res: Response) => {
  const job = await Job.findById(req.params.id);
  if (!job) {
    return res.status(404).json({ message: "Job not found" });
  }

  if (job.employerId.toString() !== req.user?.id.toString()) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const applications = await Application.find({ jobId: job.id })
    .populate("candidateId", "name email")
    .sort({ createdAt: -1 });

  return res.json({ applications });
};

export const updateApplicationStatus = async (req: Request, res: Response) => {
  const { status } = req.body as {
    status?: "Pending" | "Shortlisted" | "Rejected";
  };

  if (!status || !["Pending", "Shortlisted", "Rejected"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const application = await Application.findById(req.params.id);
  if (!application) {
    return res.status(404).json({ message: "Application not found" });
  }

  const job = await Job.findById(application.jobId);
  if (!job) {
    return res.status(404).json({ message: "Job not found" });
  }

  if (job.employerId.toString() !== req.user?.id.toString()) {
    return res.status(403).json({ message: "Forbidden" });
  }

  application.status = status;
  await application.save();

  return res.json({ application });
};
