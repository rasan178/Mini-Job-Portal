import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User";

const signToken = (userId: string, email: string, role: "candidate" | "employer" | "admin") => {
  const secret = process.env.JWT_SECRET || "";
  return jwt.sign({ sub: userId, email, role }, secret, { expiresIn: "7d" });
};

export const register = async (req: Request, res: Response) => {
  const { email, password, role, name } = req.body as {
    email: string;
    password: string;
    role: string;
    name: string;
  };

  if (!email || !password || !name) {
    return res.status(400).json({ message: "Name, email, and password are required" });
  }

  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
  const desiredRole = adminEmail && email.toLowerCase() === adminEmail ? "admin" : role;
  if (!desiredRole || !["candidate", "employer", "admin"].includes(desiredRole)) {
    return res.status(400).json({ message: "Role must be candidate or employer" });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(400).json({ message: "Email already registered" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    email: email.toLowerCase(),
    passwordHash,
    role: desiredRole,
    name,
  });

  return res.status(201).json({

    user: { id: user.id, email: user.email, role: user.role, name: user.name },
  });
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = signToken(user.id, user.email, user.role);
  return res.json({
    token,
    user: { id: user.id, email: user.email, role: user.role, name: user.name },
  });
};

export const me = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = await User.findById(req.user.id).select("email role name");
  return res.json({ user });
};
