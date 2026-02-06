import axios from "axios";
import { Request, Response } from "express";

export const getUnsplashImages = async (req: Request, res: Response) => {
  try {
    const { count = 6, queryStrings } = req.query;
    console.log("Received queryString:", queryStrings);

    const response = await axios.get("https://api.unsplash.com/photos/random", {
      params: { count, query: queryStrings?.toString().split(' ') || [] },
      headers: {
        Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`,
      },
    });

    const images = response.data.map((img: any) => ({
      id: img.id,
      description: img.alt_description,
      thumb: img.urls.small,
      regular: img.urls.regular,
      author: img.user.name,
    }));

    res.json({images: images});
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch images" });
  }
};
