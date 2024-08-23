import mongoose from 'mongoose';
import Sale from '../models/saleModel';
import Category from '../models/categoryModel';

export const startSale = async () => {
  const now = new Date();

  try {
    // Find all sales that are starting now but are not yet active
    const salesToStart = await Sale.find({
      startDate: { $lte: now },
      endDate: { $gt: now },
      isActive: false,
      isDeleted: false,
    });

    for (const sale of salesToStart) {
      // Set isActive to true
      sale.isActive = true;
      sale.updatedAt = new Date();
      await sale.save();
    }

    if (salesToStart.length > 0) {
      console.log(`${salesToStart.length} sales started.`);
    }
  } catch (error) {
    console.error('Error starting sales:', error);
  }
};

export const endSale = async () => {
  const now = new Date();

  try {
    // Find all sales that are ending now and are currently active
    const salesToEnd = await Sale.find({
      endDate: { $lte: now },
      isActive: true,
      isDeleted: false,
    });

    for (const sale of salesToEnd) {
      // Set isActive to false
      sale.isActive = false;
      sale.updatedAt = new Date();
      await sale.save();
    }

    if (salesToEnd.length > 0) {
      console.log(`${salesToEnd.length} sales ended.`);
    }
  } catch (error) {
    console.error('Error ending sales:', error);
  }
};
