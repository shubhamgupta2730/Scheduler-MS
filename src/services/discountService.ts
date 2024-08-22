import Sale from '../models/saleModel';
import Product from '../models/productModel';
import Bundle from '../models/bundleModel';

export const applyDiscounts = async () => {
  const now = new Date();

  // Find all sales that are starting now
  const sales = await Sale.find({
    startDate: { $lte: now },
    endDate: { $gt: now },
    isDeleted: false,
  }).populate('categories.categoryId');

  for (const sale of sales) {
    // Apply discounts to products
    for (const saleProduct of sale.products) {
      const product = await Product.findById(saleProduct.productId);
      if (product) {
        const saleCategory = sale.categories.find((cat) =>
          product.categoryId?.equals(cat.categoryId._id)
        );
        const discount = saleCategory ? saleCategory.discount : 0;

        // Apply discount to the sellingPrice
        const discountedPrice = product.sellingPrice * (1 - discount / 100);

        // Save the discounted selling price
        product.sellingPrice = discountedPrice;
        await product.save();
      }
    }

    // // Apply discounts to bundles
    // for (const saleBundle of sale.bundles) {
    //   const bundle = await Bundle.findById(saleBundle.bundleId);
    //   if (bundle) {
    //     // Calculate the total selling price of all products in the bundle
    //     let totalSellingPrice = 0;
    //     for (const bundleProduct of bundle.products) {
    //       const product = await Product.findById(bundleProduct.productId);
    //       if (product) {
    //         totalSellingPrice += product.sellingPrice;
    //       }
    //     }

    //     // Apply the bundle's discount directly to its selling price
    //     const bundleDiscount = sale.discount || 0;
    //     const discountedBundlePrice =
    //       totalSellingPrice * (1 - bundleDiscount / 100);

    //     // Save the discounted selling price
    //     bundle.sellingPrice = discountedBundlePrice;
    //     await bundle.save();
    //   }
    // }
  }
};

export const removeDiscounts = async () => {
  const now = new Date();

  // Find all sales that are ending now
  const sales = await Sale.find({
    endDate: { $lte: now },
    isDeleted: false,
  });

  for (const sale of sales) {
    // Remove discounts from products
    for (const saleProduct of sale.products) {
      const product = await Product.findById(saleProduct.productId);
      if (product) {
        const saleCategory = sale.categories.find((cat) =>
          product.categoryId?.equals(cat.categoryId._id)
        );
        const discount = saleCategory ? saleCategory.discount : 0;

        // Remove the discount to get the original selling price
        const originalPrice = product.sellingPrice / (1 - discount / 100);

        // Restore the original selling price
        product.sellingPrice = originalPrice;
        await product.save();
      }
    }

    // // Remove discounts from bundles
    // for (const saleBundle of sale.bundles) {
    //   const bundle = await Bundle.findById(saleBundle.bundleId);
    //   if (bundle) {
    //     // Calculate the total discounted selling price of all products in the bundle
    //     let totalSellingPrice = 0;
    //     for (const bundleProduct of bundle.products) {
    //       const product = await Product.findById(bundleProduct.productId);
    //       if (product) {
    //         totalSellingPrice += product.sellingPrice;
    //       }
    //     }

    //     // Remove the discount to get the original selling price
    //     const bundleDiscount = sale.discount || 0; 
    //     const originalBundlePrice =
    //       totalSellingPrice / (1 - bundleDiscount / 100);

    //     // Restore the original selling price
    //     bundle.sellingPrice = originalBundlePrice;
    //     await bundle.save();
    //   }
    // }
  }
};
