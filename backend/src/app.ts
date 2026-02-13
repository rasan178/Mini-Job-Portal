import "express-async-errors";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import authRoutes from "./routes/authRoutes";
import candidateRoutes from "./routes/candidateRoutes";
import employerRoutes from "./routes/employerRoutes";
import jobRoutes from "./routes/jobRoutes";
import applicationRoutes from "./routes/applicationRoutes";
import adminRoutes from "./routes/adminRoutes";
import uploadRoutes from "./routes/uploadRoutes";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const corsOrigin = process.env.CORS_ORIGIN || "*";
const normalizeOrigin = (origin: string) => origin.trim().replace(/\/+$/, "");
const allowedOrigins = corsOrigin
  .split(",")
  .map(normalizeOrigin)
  .filter(Boolean);
const allowAnyOrigin = allowedOrigins.includes("*");

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser and same-origin requests (no Origin header present).
      if (!origin || allowAnyOrigin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(normalizeOrigin(origin))) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(morgan("dev"));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/candidate", candidateRoutes);
app.use("/api/employer", employerRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api", applicationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/uploads", uploadRoutes);

app.use((_req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use(errorHandler);

export default app;
