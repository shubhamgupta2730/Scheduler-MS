import cron from 'node-cron';
import { applyDiscounts, removeDiscounts } from '../services/discountService';
import { startSale, endSale } from '../services/saleService';

export const startCronJobs = () => {
  cron.schedule('* * * * * *', async () => {
    await startSale();
    await applyDiscounts();
    await removeDiscounts();
    await endSale();
  });
};
