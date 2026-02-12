import { Router } from "express";
import {
  applyToJob,
  deleteMyApplication,
  listApplicantsForJob,
  listMyApplications,
  updateApplicationStatus,
} from "../controllers/applicationController";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/role";
import { uploadPdf } from "../middleware/upload";

const router = Router();

router.post(
  "/jobs/:id/apply",
  requireAuth,
  requireRole("candidate"),
  uploadPdf.single("cv"),
  applyToJob
);

router.get(
  "/applications/my",
  requireAuth,
  requireRole("candidate"),
  listMyApplications
);

router.get(
  "/jobs/:id/applications",
  requireAuth,
  requireRole("employer"),
  listApplicantsForJob
);

router.patch(
  "/applications/:id/status",
  requireAuth,
  requireRole("employer"),
  updateApplicationStatus
);

router.delete(
  "/applications/:id",
  requireAuth,
  requireRole("candidate"),
  deleteMyApplication
);

export default router;
