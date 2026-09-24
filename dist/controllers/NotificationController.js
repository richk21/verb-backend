"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markAllAsRead = exports.markAsRead = exports.getUnreadCount = exports.getNotifications = void 0;
const Notification_1 = __importDefault(require("../models/Notification"));
const getNotifications = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const notifications = await Notification_1.default.find({ userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        const total = await Notification_1.default.countDocuments({ userId });
        const unreadCount = await Notification_1.default.countDocuments({ userId, read: false });
        res.json({ notifications, total, unreadCount });
    }
    catch (err) {
        console.error('Error fetching notifications:', err);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
};
exports.getNotifications = getNotifications;
const getUnreadCount = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const unreadCount = await Notification_1.default.countDocuments({ userId, read: false });
        res.json({ unreadCount });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch unread count' });
    }
};
exports.getUnreadCount = getUnreadCount;
const markAsRead = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const notification = await Notification_1.default.findById(req.params.id);
        if (!notification || notification.userId !== userId) {
            return res.status(404).json({ message: 'Notification not found' });
        }
        notification.read = true;
        await notification.save();
        res.json(notification);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to mark notification as read' + err });
    }
};
exports.markAsRead = markAsRead;
const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        await Notification_1.default.updateMany({ userId, read: false }, { $set: { read: true } });
        res.json({ success: true });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to mark all as read' });
    }
};
exports.markAllAsRead = markAllAsRead;
