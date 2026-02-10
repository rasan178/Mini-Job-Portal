import { Router } from "express";
import {
  getEmployerProfile,
  upsertEmployerProfile,
} from "../controllers/employerController";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/role";

const router = Router();

router.use(requireAuth, requireRole("employer"));

router.get("/profile", getEmployerProfile);
router.put("/profile", upsertEmployerProfile);

export default router;
