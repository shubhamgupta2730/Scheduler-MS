import Sale from '../models/saleModel';
import Product from '../models/productModel';
import Bundle from '../models/bundleModel';

// Helper function to round prices to the nearest whole number
const roundToWhole = (value: number): number => {
  return Math.round(value);
};

export const applyDiscounts = async () => {
  const now = new Date();

  //  5-second window for matching the startDate
  const startWindow = new Date(now.getTime() - 5000); // 5 seconds before now
  const endWindow = new Date(now.getTime() + 5000); // 5 seconds after now

  // Find all sales that are starting right now within the 5-second window
  const sales = await Sale.find({
    startDate: { $gte: startWindow, $lte: endWindow },
    endDate: { $gt: now },
    isDeleted: false,
    discountApplied: false,
  });

  for (const sale of sales) {
    // Apply discounts to bundles based on the max discount of products within the bundle
    for (const saleBundle of sale.bundles) {
      const bundle = await Bundle.findById(saleBundle.bundleId);
      if (bundle) {
        let maxDiscount = 0;
        let totalSellingPrice = 0;

        for (const bundleProduct of bundle.products) {
          const product = await Product.findById(bundleProduct.productId);
          if (product) {
            // Find the discount for the product's category
            const saleCategory = sale.categories.find((cat) =>
              product.categoryId?.equals(cat.categoryId)
            );
            const discount = saleCategory ? saleCategory.discount : 0;

            // Track the maximum discount found among the products
            if (discount > maxDiscount) {
              maxDiscount = discount;
            }

            // Sum the selling prices of the products
            totalSellingPrice += product.sellingPrice;
          }
        }

        // Apply the maximum discount found to the bundle's selling price
        const discountedBundlePrice =
          totalSellingPrice * (1 - maxDiscount / 100);
        const roundedDiscountedBundlePrice = roundToWhole(
          discountedBundlePrice
        );

        // Save the discounted selling price and update adminDiscount for the bundle
        bundle.sellingPrice = roundedDiscountedBundlePrice;
        bundle.adminDiscount = maxDiscount;
        await bundle.save();
      }
    }
    // Apply discounts to products
    for (const saleProduct of sale.products) {
      const product = await Product.findById(saleProduct.productId);
      if (product) {
        // Find the discount for the product's category
        const saleCategory = sale.categories.find((cat) =>
          product.categoryId?.equals(cat.categoryId)
        );
        const discount = saleCategory ? saleCategory.discount : 0;

        // Apply discount to the sellingPrice
        const discountedPrice = product.sellingPrice * (1 - discount / 100);
        const roundedDiscountedPrice = roundToWhole(discountedPrice);
        console.log(
          `Applying discount: New price for product ${product._id} is ${roundedDiscountedPrice}`
        );

        product.sellingPrice = roundedDiscountedPrice;
        product.adminDiscount = discount;
        await product.save();
      }
    }

    // Mark the sale as having discounts applied
    sale.discountApplied = true;
    await sale.save();
  }
};

export const removeDiscounts = async () => {
  const now = new Date();

  // Find all sales that are ending now or in the past
  const sales = await Sale.find({
    endDate: { $lte: now },
    isDeleted: false,
  });

  for (const sale of sales) {
    // Remove discounts from bundles
    for (const saleBundle of sale.bundles) {
      const bundle = await Bundle.findById(saleBundle.bundleId);
      if (bundle) {
        let totalSellingPrice = 0;

        // Calculate the total selling price of products in the bundle
        for (const bundleProduct of bundle.products) {
          const product = await Product.findById(bundleProduct.productId);
          if (product) {
            // Sum the selling prices of the products
            totalSellingPrice += product.sellingPrice;
          }
        }

        // Restore the original bundle price by removing the discount
        const originalBundlePrice =
          totalSellingPrice / (1 - (bundle.adminDiscount || 0) / 100);
        const roundedOriginalBundlePrice = roundToWhole(originalBundlePrice);

        // Update the bundle price and set adminDiscount to null
        bundle.sellingPrice = roundedOriginalBundlePrice;
        bundle.adminDiscount = undefined;
        await bundle.save();
      }
    }

    // Remove discounts from products
    for (const saleProduct of sale.products) {
      const product = await Product.findById(saleProduct.productId);
      if (product) {
        // Restore the original price by removing the discount
        const originalPrice =
          product.sellingPrice / (1 - (product.adminDiscount || 0) / 100);
        const roundedOriginalPrice = roundToWhole(originalPrice);

        // Update the product price and set adminDiscount to null
        product.sellingPrice = roundedOriginalPrice;
        product.adminDiscount = null;
        await product.save();
      }
    }

    // Mark the sale as not having discounts applied
    sale.discountApplied = false;
    await sale.save();
  }
};
