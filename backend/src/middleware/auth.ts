import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";

interface JwtPayload {
  sub: string;
  email: string;
  role: "candidate" | "employer" | "admin";
}

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing Authorization header" });
  }

  const token = header.replace("Bearer ", "").trim();
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ message: "JWT secret not configured" });
    }

    const payload = jwt.verify(token, secret) as JwtPayload;
    req.user = {
      id: new Types.ObjectId(payload.sub),
      email: payload.email,
      role: payload.role,
    };

    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
