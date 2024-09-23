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
exports.startCronJobsDiscount = exports.startCronJobsSale = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const discountService_1 = require("../services/discountService");
const saleService_1 = require("../services/saleService");
const startCronJobsSale = () => {
    node_cron_1.default.schedule('* * * * * *', () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            // Start sale
            yield (0, saleService_1.startSale)();
            // End sale
            yield (0, saleService_1.endSale)();
        }
        catch (error) {
            console.error('Error occurred in cron job:', error);
        }
    }));
};
exports.startCronJobsSale = startCronJobsSale;
const startCronJobsDiscount = () => {
    node_cron_1.default.schedule('* * * * * *', () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            // Apply discounts
            yield (0, discountService_1.applyDiscounts)();
            // Remove discounts
            yield (0, discountService_1.removeDiscounts)();
        }
        catch (error) {
            console.error('Error occurred in cron job:', error);
        }
    }));
};
exports.startCronJobsDiscount = startCronJobsDiscount;
