import { Router } from "express";
import { adminDeleteJob, listAllJobs } from "../controllers/adminController";
import { requireAuth } from "../middleware/auth";
import { requireAdmin } from "../middleware/admin";

const router = Router();

router.use(requireAuth, requireAdmin);

router.get("/jobs", listAllJobs);
router.delete("/jobs/:id", adminDeleteJob);

export default router;
