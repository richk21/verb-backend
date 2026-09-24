"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUnsplashImages = void 0;
const axios_1 = __importDefault(require("axios"));
const getUnsplashImages = async (req, res) => {
    try {
        const { count = 6, queryStrings } = req.query;
        const rawQuery = queryStrings?.toString() || '';
        const cleanedQuery = rawQuery
            .toLowerCase()
            .replace(/[^a-z0-9\s]/gi, '')
            .replace(/\s+/g, ' ')
            .trim();
        const finalQuery = cleanedQuery.length > 0 ? cleanedQuery : '';
        const response = await axios_1.default.get('https://api.unsplash.com/photos/random', {
            params: {
                count,
                query: finalQuery,
            },
            headers: {
                Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`,
            },
        });
        const images = response.data.map((img) => ({
            id: img.id,
            description: img.alt_description,
            thumb: img.urls.small,
            regular: img.urls.regular,
            author: img.user.name,
        }));
        res.json({ images: images });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to fetch images', err });
    }
};
exports.getUnsplashImages = getUnsplashImages;
