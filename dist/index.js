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
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = __importDefault(require("./config/db"));
const logger_1 = __importDefault(require("./logger"));
const cronJob_1 = require("./cron/cronJob");
const emailService_1 = require("./services/emailService");
const emailToUsers_1 = require("./services/emailToUsers");
const body_parser_1 = __importDefault(require("body-parser"));
const node_schedule_1 = __importDefault(require("node-schedule"));
const orderModel_1 = __importDefault(require("./models/orderModel")); // Import your Order model
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3005;
// Connect to database
(0, db_1.default)();
// Middleware
app.use(express_1.default.json());
app.use(body_parser_1.default.json());
// Endpoint to schedule email notifications
app.post('/schedule-tasks', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { saleId, saleName, startDate, endDate, categories } = req.body;
    // Schedule email notifications to sellers to be sent 1 minute from now
    const notificationTime = new Date(Date.now() + 1 * 60 * 1000);
    node_schedule_1.default.scheduleJob(notificationTime, () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            yield (0, emailService_1.sendEmailNotifications)(saleName, startDate, endDate, categories);
            yield (0, emailToUsers_1.sendSaleNotificationToUsers)(saleName, startDate, endDate, categories);
            console.log(`Emails scheduled and sent for Sale ID: ${saleId}`);
        }
        catch (error) {
            console.error(`Failed to send emails for Sale ID: ${saleId}`, error);
        }
    }));
    res
        .status(200)
        .json({ message: 'Email notifications scheduled successfully' });
}));
// Endpoint to schedule order delivery status update
app.post('/schedule-delivery', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { orderId } = req.body;
    if (!orderId) {
        return res.status(400).json({ message: 'Order ID is required' });
    }
    try {
        // Schedule the status update to "delivered" after 5 minutes
        const deliveryTime = new Date(Date.now() + 5 * 60 * 1000);
        node_schedule_1.default.scheduleJob(deliveryTime, () => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const order = yield orderModel_1.default.findById(orderId);
                if (order && order.status === 'processing') {
                    order.status = 'delivered';
                    order.paymentStatus = 'paid';
                    yield order.save();
                    console.log(`Order ${orderId} status updated to delivered`);
                }
            }
            catch (error) {
                console.error(`Failed to update status for Order ID: ${orderId}`, error);
            }
        }));
        res.status(200).json({
            message: `Scheduled status update to delivered for order ${orderId} after 5 minutes`,
        });
    }
    catch (error) {
        res
            .status(500)
            .json({ message: 'Error scheduling delivery status update', error });
    }
}));
app.listen(PORT, () => {
    logger_1.default.info(`Server is running on http://localhost:${PORT}`);
    (0, cronJob_1.startCronJobsSale)();
    (0, cronJob_1.startCronJobsDiscount)();
});
