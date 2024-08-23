import nodemailer from 'nodemailer';
import User from '../models/userModel';
import Category from '../models/categoryModel';
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

// Function to find category name by ID
const findCategoryById = async (categoryId: string): Promise<string> => {
  try {
    const category = await Category.findById(categoryId).select('name').exec();
    return category?.name || 'Unknown';
  } catch (error) {
    console.error('Error fetching category name:', error);
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

// Function to get all active users
const getAllActiveUsers = async () => {
  try {
    const users = await User.find({
      isActive: true,
      isBlocked: false,
    }).select('email');
    return users;
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

// Function to generate an email template for all users
const generateUserEmailTemplate = (
  saleName: string,
  startDate: Date,
  endDate: Date,
  categories: CategoryDetails[]
): string => {
  const formattedStartDate = moment(startDate).format(
    'dddd, MMMM D, YYYY h:mm A'
  );
  const formattedEndDate = moment(endDate).format('dddd, MMMM D, YYYY h:mm A');

  // Generate category details string with names and discounts
  const categoryDetails = categories
    .map((cat) => `${cat.name} (Discount: ${cat.discount}%)`)
    .join(', ');

  return `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h2>Exciting New Sale: ${saleName}</h2>
      <p>We are thrilled to announce a new sale on our platform!</p>
      <p><strong>Sale Start Date:</strong> ${formattedStartDate}</p>
      <p><strong>Sale End Date:</strong> ${formattedEndDate}</p>
      <p><strong>Categories Included:</strong> ${categoryDetails}</p>
      <p>Don't miss out on great discounts across various categories. Visit our platform to explore the sale and make the most of these offers.</p>
      <p>Best regards,<br/>E-Commerce Platform Team</p>
    </div>
  `;
};

// Function to send email notifications to all users
export const sendSaleNotificationToUsers = async (
  saleName: string,
  startDate: Date,
  endDate: Date,
  categories: CategoryWithDiscount[]
) => {
  console.log('Sending sale notification to all users:', saleName);

  // Retrieve all active users
  const users = await getAllActiveUsers();
  console.log('Users to notify:', users);

  if (users.length === 0) {
    console.warn('No users found to notify.');
    return;
  }

  // Get categories with names and discounts
  const categoriesWithDiscounts = await getCategoriesWithDiscounts(categories);

  // Create and configure the Nodemailer transporter
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Generate the email template
  const emailTemplate = generateUserEmailTemplate(
    saleName,
    startDate,
    endDate,
    categoriesWithDiscounts
  );
  console.log('Generated email template:', emailTemplate);

  for (const user of users) {
    console.log(`Sending email to user: ${user.email}`);

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: `Exciting New Sale: ${saleName} - Don't Miss Out!`,
      html: emailTemplate,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`Email successfully sent to ${user.email}`);
    } catch (error) {
      console.error(`Failed to send email to ${user.email}:`, error);
    }
  }
};
