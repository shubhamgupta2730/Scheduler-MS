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
exports.endSale = exports.startSale = void 0;
const saleModel_1 = __importDefault(require("../models/saleModel"));
const startSale = () => __awaiter(void 0, void 0, void 0, function* () {
    const now = new Date();
    try {
        // Find all sales that are starting now but are not yet active
        const salesToStart = yield saleModel_1.default.find({
            startDate: { $lte: now },
            endDate: { $gt: now },
            isActive: false,
            isDeleted: false,
        });
        for (const sale of salesToStart) {
            // Set isActive to true
            sale.isActive = true;
            sale.updatedAt = new Date();
            yield sale.save();
        }
        if (salesToStart.length > 0) {
            console.log(`${salesToStart.length} sales started.`);
        }
    }
    catch (error) {
        console.error('Error starting sales:', error);
    }
});
exports.startSale = startSale;
const endSale = () => __awaiter(void 0, void 0, void 0, function* () {
    const now = new Date();
    try {
        // Find all sales that are ending now and are currently active
        const salesToEnd = yield saleModel_1.default.find({
            endDate: { $lte: now },
            isActive: true,
            isDeleted: false,
        });
        for (const sale of salesToEnd) {
            // Set isActive to false
            sale.isActive = false;
            sale.updatedAt = new Date();
            yield sale.save();
        }
        if (salesToEnd.length > 0) {
            console.log(`${salesToEnd.length} sales ended.`);
        }
    }
    catch (error) {
        console.error('Error ending sales:', error);
    }
});
exports.endSale = endSale;
