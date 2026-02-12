import { Router } from "express";
import { uploadCv, getCv, deleteCv } from "../controllers/uploadController";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/role";
import { uploadPdf } from "../middleware/upload";

const router = Router();

router.post("/cv", requireAuth, requireRole("candidate"), uploadPdf.single("cv"), uploadCv);
router.get("/cv", requireAuth, requireRole("candidate"), getCv);
router.delete("/cv/:cvId", requireAuth, requireRole("candidate"), deleteCv);

export default router;
