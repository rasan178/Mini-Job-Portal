import { Types } from "mongoose";

export type UserRole = "candidate" | "employer" | "admin";

export interface AuthUser {
  id: Types.ObjectId;
  email: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};
