"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const VerificationController_1 = require("../controllers/VerificationController");
const router = (0, express_1.Router)();
router.get('/verify-email/:token', VerificationController_1.verifyEmail);
exports.default = router;
