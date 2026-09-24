"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotification = void 0;
const Notification_1 = __importDefault(require("../models/Notification"));
/**
 * Same fire-and-forget-but-logged pattern as logAction — a notification
 * failure should never block the operation that triggered it.
 */
const createNotification = async (params) => {
    try {
        await Notification_1.default.create(params);
    }
    catch (err) {
        console.error('[notifications] Failed to create notification:', err);
    }
};
exports.createNotification = createNotification;
