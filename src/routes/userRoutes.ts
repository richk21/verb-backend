import { Router } from "express";
import {
  createUser,
  getUserProfile,
  googleAuth,
  loginUser,
  updateUserInfo,
} from "../controllers/UserController";
import { upload } from "../config/multer";
import { authMiddleware } from "../middleware/auth";

const router = Router();

/**
 * @swagger
 * /api/users/signup:
 *   post:
 *     summary: Create a new user
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userName:
 *                 type: string
 *               userEmail:
 *                 type: string
 *               userPassword:
 *                 type: string
 *     responses:
 *       201:
 *         description: Created user successfully
 */
router.post("/signup", createUser);

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: Login a user
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userEmail:
 *                 type: string
 *               userPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: User Logged in successfully
 */
router.post("/login", loginUser);

router.post(
  "/updateInfo",
  authMiddleware,
  upload.fields([
    { name: "userCoverImage", maxCount: 1 },
    { name: "userProfileImage", maxCount: 1 },
  ]),
  updateUserInfo,
);

router.get("/getProfile/:id", getUserProfile);

router.post("/google-auth", googleAuth);

export default router;
