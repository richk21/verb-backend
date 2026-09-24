"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const UnsplashController_1 = require("../controllers/UnsplashController");
const router = (0, express_1.Router)();
router.get('/getCoverImages', UnsplashController_1.getUnsplashImages);
exports.default = router;
