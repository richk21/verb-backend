import { Router } from "express";
import { verifyEmail } from "../controllers/VerificationController";

const router = Router();

router.get("/verify-email/:token", verifyEmail);
