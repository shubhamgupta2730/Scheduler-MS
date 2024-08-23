// src/services/emailService.ts
import nodemailer from 'nodemailer';
import Product from '../models/productModel';
import User from '../models/userModel';
import Category, { ICategory } from '../models/categoryModel';
import moment from 'moment';

// Define types for categories with discounts
interface CategoryWithDiscount {
  categoryId: string;
  discount: number;
}

interface CategoryDetails {
  name: string;
  discount: number;
}

// Function to get category details by IDs
const getCategoryDetails = async (
  categoryIds: string[]
): Promise<ICategory[]> => {
  try {
    const categories = await Category.find({ _id: { $in: categoryIds } })
      .select('_id name')
      .exec();
    return categories;
  } catch (error) {
    console.error('Error fetching category details:', error);
    return [];
  }
};

// Function to combine category details with discounts
// Function to find a single category by ID
const findCategoryById = async (categoryId: string): Promise<string> => {
  try {
    const category = await Category.findById(categoryId).select('name').exec();
    return category ? category.name : 'Unknown';
  } catch (error) {
    console.error(`Error fetching category with ID ${categoryId}:`, error);
    return 'Unknown';
  }
};

// Function to combine category details with discounts
const getCategoriesWithDiscounts = async (
  categories: CategoryWithDiscount[]
): Promise<CategoryDetails[]> => {
  // For each category, find the category name and combine it with the discount
  const categoryDetailsPromises = categories.map(async (cat) => {
    const categoryName = await findCategoryById(cat.categoryId);
    return {
      name: categoryName,
      discount: cat.discount,
    };
  });

  // Wait for all promises to resolve
  return Promise.all(categoryDetailsPromises);
};

// Function to get sellers by categories
const getSellersByCategories = async (
  categories: CategoryWithDiscount[]
): Promise<{ sellers: any[] }> => {
  console.log('Fetching sellers for categories:', categories);

  const categoryIds = categories.map((cat) => cat.categoryId);
  console.log('Category IDs:', categoryIds);

  try {
    // Find products by categories
    const products = await Product.find({
      categoryId: { $in: categoryIds },
      isDeleted: false,
      isBlocked: false,
    }).select('sellerId'); // Only select sellerId to minimize data

    console.log('Products:', products);

    // Extract seller IDs from the products
    const sellerIds = [
      ...new Set(products.map((product) => product.sellerId.toString())),
    ];
    console.log('Seller IDs:', sellerIds);

    if (sellerIds.length === 0) {
      return { sellers: [] };
    }

    // Find sellers by IDs
    const sellers = await User.find({
      _id: { $in: sellerIds },
      isActive: true,
      isBlocked: false,
      role: 'seller',
    }).select('_id email isActive isBlocked role');

    console.log('Sellers:', sellers);

    return { sellers };
  } catch (error) {
    console.error('Error fetching sellers:', error);
    return { sellers: [] };
  }
};

// Function to generate an email template
const generateEmailTemplate = async (
  saleName: string,
  startDate: Date,
  endDate: Date,
  categories: CategoryWithDiscount[]
): Promise<string> => {
  console.log('Generating email template for sale:', saleName);

  const formattedStartDate = moment(startDate).format(
    'dddd, MMMM D, YYYY h:mm A'
  );
  const formattedEndDate = moment(endDate).format('dddd, MMMM D, YYYY h:mm A');

  // Get categories with names and discounts
  const categoriesWithDiscounts = await getCategoriesWithDiscounts(categories);

  // Generate category details string with discounts
  const categoryDetails = categoriesWithDiscounts
    .map((cat) => `${cat.name} (Discount: ${cat.discount}%)`)
    .join(', ');

  console.log('Formatted start date:', formattedStartDate);
  console.log('Formatted end date:', formattedEndDate);
  console.log('Categories with discounts:', categoryDetails);

  return `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h2>New Sale: ${saleName}</h2>
      <p>We are excited to announce a new sale on our platform!</p>
      <p><strong>Sale Start Date:</strong> ${formattedStartDate}</p>
      <p><strong>Sale End Date:</strong> ${formattedEndDate}</p>
      <p><strong>Categories Included:</strong> ${categoryDetails}</p>
      <p>Don't miss out! Make sure to add your products to the sale to boost your visibility and sales.</p>
      <p>Visit our platform to manage your products and participate in the sale.</p>
      <p>Best regards,<br/>E-Commerce Platform</p>
    </div>
  `;
};

// Function to send email notifications
export const sendEmailNotifications = async (
  saleName: string,
  startDate: Date,
  endDate: Date,
  categories: CategoryWithDiscount[]
) => {
  console.log('Sending email notifications for sale:', saleName);

  // Retrieve sellers associated with the categories
  const { sellers } = await getSellersByCategories(categories);
  console.log('Sellers to notify:', sellers);

  if (sellers.length === 0) {
    console.warn('No sellers found to notify.');
    return;
  }

  // Create and configure the Nodemailer transporter
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Generate the email template
  const emailTemplate = await generateEmailTemplate(
    saleName,
    startDate,
    endDate,
    categories
  );
  console.log('Generated email template:', emailTemplate);

  for (const seller of sellers) {
    if (seller.isActive && !seller.isBlocked && seller.role === 'seller') {
      console.log(`Sending email to seller: ${seller.email}`);

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: seller.email,
        subject: `New Sale: ${saleName} - Don't Miss Out!`,
        html: emailTemplate,
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log(`Email successfully sent to ${seller.email}`);
      } catch (error) {
        console.error(`Failed to send email to ${seller.email}:`, error);
      }
    } else {
      console.log(
        `Skipping seller: ${seller.email} (Active: ${seller.isActive}, Blocked: ${seller.isBlocked}, Role: ${seller.role})`
      );
    }
  }
};
