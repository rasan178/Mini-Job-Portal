import { Request, Response } from "express";
import { Application } from "../models/Application";
import { Job } from "../models/Job";
import { CandidateProfile } from "../models/CandidateProfile";
import { uploadPdfToFirebase } from "../utils/firebaseUpload";

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

  const { message, selectedCvId } = req.body as { message?: string; selectedCvId?: string };
  let cvUrl: string | undefined;
  if (req.file) {
    const userId = req.user?.id.toString();
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    cvUrl = await uploadPdfToFirebase(req.file, `applications/${userId}`);
  }

  if (!cvUrl) {
    const profile = await CandidateProfile.findOne({ userId: req.user?.id });
    if (profile?.cvs?.length) {
      if (selectedCvId) {
        const selectedCv = profile.cvs.find((cv) => cv._id?.toString() === selectedCvId);
        if (!selectedCv) {
          return res.status(400).json({ message: "Selected CV not found" });
        }
        cvUrl = selectedCv.url;
      } else {
        cvUrl = profile.cvs[profile.cvs.length - 1]?.url;
      }
    }
  }

  if (!cvUrl) {
    return res.status(400).json({ message: "CV is required to apply. Upload one or select an existing CV." });
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

export const deleteMyApplication = async (req: Request, res: Response) => {
  const application = await Application.findById(req.params.id);
  if (!application) {
    return res.status(404).json({ message: "Application not found" });
  }

  if (application.candidateId.toString() !== req.user?.id.toString()) {
    return res.status(403).json({ message: "Forbidden" });
  }

  await application.deleteOne();
  return res.json({ message: "Application deleted" });
};
