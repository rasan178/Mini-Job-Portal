import { Router } from "express";
import {
  createJob,
  deleteJob,
  getJob,
  listJobs,
  updateJob,
} from "../controllers/jobController";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/role";

const router = Router();

router.get("/", listJobs);
router.get("/:id", getJob);

router.post("/", requireAuth, requireRole("employer"), createJob);
router.put("/:id", requireAuth, requireRole("employer"), updateJob);
router.delete("/:id", requireAuth, requireRole("employer"), deleteJob);

export default router;
