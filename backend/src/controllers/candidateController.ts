import { Request, Response } from "express";
import { CandidateProfile } from "../models/CandidateProfile";

export const getCandidateProfile = async (req: Request, res: Response) => {
  const profile = await CandidateProfile.findOne({ userId: req.user?.id });
  return res.json({ profile });
};

export const upsertCandidateProfile = async (req: Request, res: Response) => {
  const { phone, location, skills, bio } = req.body as {
    phone?: string;
    location?: string;
    skills?: string[] | string;
    bio?: string;
  };

  const normalizedSkills = Array.isArray(skills)
    ? skills
    : typeof skills === "string" && skills.trim().length
    ? skills.split(",").map((skill) => skill.trim()).filter(Boolean)
    : [];

  const update = {
    phone,
    location,
    skills: normalizedSkills,
    bio,
  };

  const profile = await CandidateProfile.findOneAndUpdate(
    { userId: req.user?.id },
    update,
    { new: true, upsert: true }
  );

  return res.json({ profile });
};

export const uploadCandidateCv = async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ message: "CV PDF is required" });
  }

  const cvUrl = `/uploads/${req.file.filename}`;
  const profile = await CandidateProfile.findOneAndUpdate(
    { userId: req.user?.id },
    { cvUrl },
    { new: true, upsert: true }
  );

  return res.json({ profile });
};
