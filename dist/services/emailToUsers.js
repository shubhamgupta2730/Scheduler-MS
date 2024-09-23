"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSaleNotificationToUsers = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const userModel_1 = __importDefault(require("../models/userModel"));
const categoryModel_1 = __importDefault(require("../models/categoryModel"));
const moment_1 = __importDefault(require("moment"));
// Function to find category name by ID
const findCategoryById = (categoryId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const category = yield categoryModel_1.default.findById(categoryId).select('name').exec();
        return (category === null || category === void 0 ? void 0 : category.name) || 'Unknown';
    }
    catch (error) {
        console.error('Error fetching category name:', error);
        return 'Unknown';
    }
});
// Function to combine category details with discounts
const getCategoriesWithDiscounts = (categories) => __awaiter(void 0, void 0, void 0, function* () {
    // For each category, find the category name and combine it with the discount
    const categoryDetailsPromises = categories.map((cat) => __awaiter(void 0, void 0, void 0, function* () {
        const categoryName = yield findCategoryById(cat.categoryId);
        return {
            name: categoryName,
            discount: cat.discount,
        };
    }));
    // Wait for all promises to resolve
    return Promise.all(categoryDetailsPromises);
});
// Function to get all active users
const getAllActiveUsers = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield userModel_1.default.find({
            isActive: true,
            isBlocked: false,
        }).select('email');
        return users;
    }
    catch (error) {
        console.error('Error fetching users:', error);
        return [];
    }
});
// Function to generate an email template for all users
const generateUserEmailTemplate = (saleName, startDate, endDate, categories) => {
    const formattedStartDate = (0, moment_1.default)(startDate).format('dddd, MMMM D, YYYY h:mm A');
    const formattedEndDate = (0, moment_1.default)(endDate).format('dddd, MMMM D, YYYY h:mm A');
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
const sendSaleNotificationToUsers = (saleName, startDate, endDate, categories) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Sending sale notification to all users:', saleName);
    // Retrieve all active users
    const users = yield getAllActiveUsers();
    console.log('Users to notify:', users);
    if (users.length === 0) {
        console.warn('No users found to notify.');
        return;
    }
    // Get categories with names and discounts
    const categoriesWithDiscounts = yield getCategoriesWithDiscounts(categories);
    // Create and configure the Nodemailer transporter
    const transporter = nodemailer_1.default.createTransport({
        service: 'Gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });
    // Generate the email template
    const emailTemplate = generateUserEmailTemplate(saleName, startDate, endDate, categoriesWithDiscounts);
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
            yield transporter.sendMail(mailOptions);
            console.log(`Email successfully sent to ${user.email}`);
        }
        catch (error) {
            console.error(`Failed to send email to ${user.email}:`, error);
        }
    }
});
exports.sendSaleNotificationToUsers = sendSaleNotificationToUsers;
