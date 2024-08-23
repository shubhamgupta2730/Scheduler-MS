import cron from 'node-cron';
import { applyDiscounts, removeDiscounts } from '../services/discountService';
import { startSale, endSale } from '../services/saleService';

export const startCronJobsSale = () => {
  cron.schedule('* * * * * *', async () => {
    try {
      // Start sale
      await startSale();
      // End sale
      await endSale();
    } catch (error) {
      console.error('Error occurred in cron job:', error);
    }
  });
};

export const startCronJobsDiscount = () => {
  cron.schedule('* * * * * *', async () => {
    try {
      // Apply discounts
      await applyDiscounts();
      // Remove discounts
      await removeDiscounts();
    } catch (error) {
      console.error('Error occurred in cron job:', error);
    }
  });
};
