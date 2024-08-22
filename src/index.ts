import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db';
import logger from './logger';
import { startCronJobs } from './cron/cronJob';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3005;

// Connect to database
connectDB();

// Middleware
app.use(express.json());

// Routes

app.listen(PORT, () => {

  logger.info(`Server is running on http://localhost:${PORT}`);
  startCronJobs(); 
});
