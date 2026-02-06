import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from './config/swagger';
import userRoutes from './routes/userRoutes';
import blogRoutes from './routes/blogRoutes';
import unsplashRoutes from './routes/unsplashRoutes';
import cors from 'cors';

dotenv.config();

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}))

app.use(express.json());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api/users", userRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/unsplash", unsplashRoutes);

const PORT = process.env.PORT;

app.get('/', (_req, res) => {
  res.send('🚀 Server is running and MongoDB is connected!');
});

mongoose.connect(process.env.MONGO_URI || '')
  .then(() => {
    console.log('✅ MongoDB connected');

    app.listen(PORT, () => {
      console.log(`🌐 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
  });
