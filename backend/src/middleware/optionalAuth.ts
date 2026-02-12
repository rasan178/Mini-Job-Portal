import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";

interface JwtPayload {
  sub: string;
  email: string;
  role: "candidate" | "employer" | "admin";
}

export const optionalAuth = (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return next();
  }

  const token = header.replace("Bearer ", "").trim();
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return next();
    }

    const payload = jwt.verify(token, secret) as JwtPayload;
    req.user = {
      id: new Types.ObjectId(payload.sub),
      email: payload.email,
      role: payload.role,
    };
  } catch {
    // Ignore invalid tokens for optional auth paths.
  }

  return next();
};
