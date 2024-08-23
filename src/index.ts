import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db';
import logger from './logger';
import { startCronJobsSale, startCronJobsDiscount } from './cron/cronJob';
import { sendEmailNotifications } from './services/emailService';
import { sendSaleNotificationToUsers } from './services/emailToUsers';
import bodyParser from 'body-parser';
import schedule from 'node-schedule';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3005;

// Connect to database
connectDB();

// Middleware
app.use(express.json());
app.use(bodyParser.json());

app.post('/schedule-tasks', async (req, res) => {
  const { saleId, saleName, startDate, endDate, categories } = req.body;

  // Schedule email notifications to sellers to be sent 1 minute from now
  const notificationTime = new Date(Date.now() + 1 * 60 * 1000);

  schedule.scheduleJob(notificationTime, async () => {
    try {
      await sendEmailNotifications(saleName, startDate, endDate, categories);
      await sendSaleNotificationToUsers(
        saleName,
        startDate,
        endDate,
        categories
      );
      console.log(`Emails scheduled and sent for Sale ID: ${saleId}`);
    } catch (error) {
      console.error(`Failed to send emails for Sale ID: ${saleId}`, error);
    }
  });

  res
    .status(200)
    .json({ message: 'Email notifications scheduled successfully' });
});

app.listen(PORT, () => {
  logger.info(`Server is running on http://localhost:${PORT}`);
  startCronJobsSale();
  startCronJobsDiscount();
});
