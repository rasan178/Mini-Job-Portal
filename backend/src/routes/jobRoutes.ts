import { Router } from "express";
import {
  createJob,
  deleteJob,
  getJob,
  listJobs,
  listJobsPublic,
  updateJob,
} from "../controllers/jobController";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/role";
import { optionalAuth } from "../middleware/optionalAuth";

const router = Router();

router.get("/", optionalAuth, listJobsPublic);
router.get("/mine", requireAuth, requireRole("employer"), listJobs);
router.get("/:id", getJob);

router.post("/", requireAuth, requireRole("employer"), createJob);
router.put("/:id", requireAuth, requireRole("employer"), updateJob);
router.delete("/:id", requireAuth, requireRole("employer"), deleteJob);

export default router;
