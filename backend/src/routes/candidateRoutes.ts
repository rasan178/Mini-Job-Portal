import { Router } from "express";
import {
  getCandidateProfile,
  upsertCandidateProfile,
} from "../controllers/candidateController";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/role";

const router = Router();

router.use(requireAuth, requireRole("candidate"));

router.get("/profile", getCandidateProfile);
router.put("/profile", upsertCandidateProfile);

export default router;
