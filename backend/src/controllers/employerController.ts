import { Request, Response } from "express";
import { EmployerProfile } from "../models/EmployerProfile";

export const getEmployerProfile = async (req: Request, res: Response) => {
  const profile = await EmployerProfile.findOne({ userId: req.user?.id });
  return res.json({ profile });
};

export const upsertEmployerProfile = async (req: Request, res: Response) => {
  const { companyName, description, website } = req.body as {
    companyName?: string;
    description?: string;
    website?: string;
  };

  if (!companyName) {
    return res.status(400).json({ message: "Company name is required" });
  }

  const profile = await EmployerProfile.findOneAndUpdate(
    { userId: req.user?.id },
    { companyName, description, website },
    { new: true, upsert: true }
  );

  return res.json({ profile });
};
