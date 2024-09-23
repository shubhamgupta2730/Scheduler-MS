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
exports.sendEmailNotifications = void 0;
// src/services/emailService.ts
const nodemailer_1 = __importDefault(require("nodemailer"));
const productModel_1 = __importDefault(require("../models/productModel"));
const userModel_1 = __importDefault(require("../models/userModel"));
const categoryModel_1 = __importDefault(require("../models/categoryModel"));
const moment_1 = __importDefault(require("moment"));
// Function to get category details by IDs
const getCategoryDetails = (categoryIds) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const categories = yield categoryModel_1.default.find({ _id: { $in: categoryIds } })
            .select('_id name')
            .exec();
        return categories;
    }
    catch (error) {
        console.error('Error fetching category details:', error);
        return [];
    }
});
// Function to combine category details with discounts
// Function to find a single category by ID
const findCategoryById = (categoryId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const category = yield categoryModel_1.default.findById(categoryId).select('name').exec();
        return category ? category.name : 'Unknown';
    }
    catch (error) {
        console.error(`Error fetching category with ID ${categoryId}:`, error);
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
// Function to get sellers by categories
const getSellersByCategories = (categories) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Fetching sellers for categories:', categories);
    const categoryIds = categories.map((cat) => cat.categoryId);
    console.log('Category IDs:', categoryIds);
    try {
        // Find products by categories
        const products = yield productModel_1.default.find({
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
        const sellers = yield userModel_1.default.find({
            _id: { $in: sellerIds },
            isActive: true,
            isBlocked: false,
            role: 'seller',
        }).select('_id email isActive isBlocked role');
        console.log('Sellers:', sellers);
        return { sellers };
    }
    catch (error) {
        console.error('Error fetching sellers:', error);
        return { sellers: [] };
    }
});
// Function to generate an email template
const generateEmailTemplate = (saleName, startDate, endDate, categories) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Generating email template for sale:', saleName);
    const formattedStartDate = (0, moment_1.default)(startDate).format('dddd, MMMM D, YYYY h:mm A');
    const formattedEndDate = (0, moment_1.default)(endDate).format('dddd, MMMM D, YYYY h:mm A');
    // Get categories with names and discounts
    const categoriesWithDiscounts = yield getCategoriesWithDiscounts(categories);
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
});
// Function to send email notifications
const sendEmailNotifications = (saleName, startDate, endDate, categories) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Sending email notifications for sale:', saleName);
    // Retrieve sellers associated with the categories
    const { sellers } = yield getSellersByCategories(categories);
    console.log('Sellers to notify:', sellers);
    if (sellers.length === 0) {
        console.warn('No sellers found to notify.');
        return;
    }
    // Create and configure the Nodemailer transporter
    const transporter = nodemailer_1.default.createTransport({
        service: 'Gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });
    // Generate the email template
    const emailTemplate = yield generateEmailTemplate(saleName, startDate, endDate, categories);
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
                yield transporter.sendMail(mailOptions);
                console.log(`Email successfully sent to ${seller.email}`);
            }
            catch (error) {
                console.error(`Failed to send email to ${seller.email}:`, error);
            }
        }
        else {
            console.log(`Skipping seller: ${seller.email} (Active: ${seller.isActive}, Blocked: ${seller.isBlocked}, Role: ${seller.role})`);
        }
    }
});
exports.sendEmailNotifications = sendEmailNotifications;
