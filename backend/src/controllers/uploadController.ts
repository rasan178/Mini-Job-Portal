import { Request, Response } from "express";
import { uploadPdfToFirebase } from "../utils/firebaseUpload";
import { CandidateProfile } from "../models/CandidateProfile";
import { Types } from "mongoose";

const deriveFileNameFromUrl = (url: string) => {
  try {
    const pathname = new URL(url).pathname;
    const lastSegment = pathname.split("/").pop() || "";
    return decodeURIComponent(lastSegment).replace(/\?.*$/, "") || "CV.pdf";
  } catch {
    return "CV.pdf";
  }
};

export const uploadCv = async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ message: "CV PDF is required" });
  }

  const userId = req.user?.id.toString();
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const cvUrl = await uploadPdfToFirebase(req.file, `cvs/${userId}`);
  
  // Add new CV to array
  const profile = await CandidateProfile.findOneAndUpdate(
    { userId },
    {
      $push: {
        cvs: {
          url: cvUrl,
          fileName: req.file.originalname,
          uploadedAt: new Date(),
        },
      },
    },
    { new: true, upsert: true }
  );
  
  return res.status(201).json({ profile });
};

export const getCv = async (req: Request, res: Response) => {
  const userId = req.user?.id.toString();
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const profile = await CandidateProfile.findOne({ userId });
  if (!profile || profile.cvs.length === 0) {
    return res.status(404).json({ message: "No CVs found" });
  }

  const cvs = profile.cvs.map((cv) => ({
    _id: cv._id,
    url: cv.url,
    fileName: cv.fileName || deriveFileNameFromUrl(cv.url),
    uploadedAt: cv.uploadedAt,
  }));

  return res.json({ cvs });
};

export const deleteCv = async (req: Request, res: Response) => {
  const userId = req.user?.id.toString();
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { cvId } = req.params;
  if (!cvId) {
    return res.status(400).json({ message: "CV ID is required" });
  }

  const profile = await CandidateProfile.findOneAndUpdate(
    { userId },
    { $pull: { cvs: { _id: new Types.ObjectId(cvId) } } },
    { new: true }
  );

  if (!profile) {
    return res.status(404).json({ message: "Profile not found" });
  }

  return res.json({ message: "CV deleted successfully" });
};
