"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NOTIFICATION_TYPES = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
exports.NOTIFICATION_TYPES = [
    'review_assigned',
    'report_approved',
    'changes_requested',
    'report_published',
    'role_changed',
];
const NotificationSchema = new mongoose_1.default.Schema({
    userId: { type: String, required: true, index: true }, // recipient
    orgId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true,
    },
    type: { type: String, enum: exports.NOTIFICATION_TYPES, required: true },
    message: { type: String, required: true },
    link: { type: String, required: true }, // frontend route, e.g. /report/<id>
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
});
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.virtual('id').get(function () {
    return this._id?.toString();
});
NotificationSchema.set('toJSON', {
    virtuals: true,
    transform: (_doc, ret) => {
        const plain = ret;
        delete plain._id;
        return plain;
    },
});
NotificationSchema.set('toObject', {
    virtuals: true,
    transform: (_doc, ret) => {
        const plain = ret;
        delete plain._id;
        return plain;
    },
});
exports.default = mongoose_1.default.model('Notification', NotificationSchema);
