import { Router } from "express";
import { getUnsplashImages } from "../controllers/UnsplashController";

const router = Router();

router.get('/getCoverImages', getUnsplashImages);
export default router;