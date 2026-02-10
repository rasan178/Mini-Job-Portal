import { Router } from "express";
import {
  getCandidateProfile,
  upsertCandidateProfile,
  uploadCandidateCv,
} from "../controllers/candidateController";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/role";
import { uploadPdf } from "../middleware/upload";

const router = Router();

router.use(requireAuth, requireRole("candidate"));

router.get("/profile", getCandidateProfile);
router.put("/profile", upsertCandidateProfile);
router.post("/profile/cv", uploadPdf.single("cv"), uploadCandidateCv);

export default router;
