"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = require("../config/multer");
const UserController_1 = require("../controllers/UserController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
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
router.post('/signup', UserController_1.createUser);
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
router.post('/login', UserController_1.loginUser);
router.post('/updateInfo', auth_1.authMiddleware, multer_1.upload.fields([
    { name: 'userCoverImage', maxCount: 1 },
    { name: 'userProfileImage', maxCount: 1 },
]), UserController_1.updateUserInfo);
router.get('/getProfile/:id', UserController_1.getUserProfile);
router.post('/google-auth', UserController_1.googleAuth);
router.get('/org-members', auth_1.authMiddleware, UserController_1.getOrgMembers);
router.get('/org-members/all', auth_1.authMiddleware, (0, auth_1.requireRole)('admin'), UserController_1.getAllOrgMembers);
router.patch('/:id/role', auth_1.authMiddleware, (0, auth_1.requireRole)('admin'), UserController_1.changeUserRole);
exports.default = router;
