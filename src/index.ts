import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db';
import logger from './logger';
import { startCronJobsSale, startCronJobsDiscount } from './cron/cronJob';
import { sendEmailNotifications } from './services/emailService';
import { sendSaleNotificationToUsers } from './services/emailToUsers';
import bodyParser from 'body-parser';
import schedule from 'node-schedule';
import Order from './models/orderModel'; // Import your Order model

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3005;

// Connect to database
connectDB();

// Middleware
app.use(express.json());
app.use(bodyParser.json());

// Endpoint to schedule email notifications
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

// Endpoint to schedule order delivery status update
app.post('/schedule-delivery', async (req, res) => {
  const { orderId } = req.body;

  if (!orderId) {
    return res.status(400).json({ message: 'Order ID is required' });
  }

  try {
    // Schedule the status update to "delivered" after 5 minutes
    const deliveryTime = new Date(Date.now() + 5 * 60 * 1000);

    schedule.scheduleJob(deliveryTime, async () => {
      try {
        const order = await Order.findById(orderId);

        if (order && order.status === 'processing') {
          order.status = 'delivered';
          order.paymentStatus = 'paid';
          await order.save();
          console.log(`Order ${orderId} status updated to delivered`);
        }
      } catch (error) {
        console.error(
          `Failed to update status for Order ID: ${orderId}`,
          error
        );
      }
    });

    res.status(200).json({
      message: `Scheduled status update to delivered for order ${orderId} after 5 minutes`,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Error scheduling delivery status update', error });
  }
});

app.listen(PORT, () => {
  logger.info(`Server is running on http://localhost:${PORT}`);
  startCronJobsSale();
  startCronJobsDiscount();
});
