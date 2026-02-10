import { NextFunction, Request, Response } from "express";

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
  const isAdmin = req.user.role === "admin";
  const matchesEmail = adminEmail ? req.user.email.toLowerCase() === adminEmail : false;

  if (!isAdmin && !matchesEmail) {
    return res.status(401).json({ message: "Admin access required" });
  }

  return next();
};
