"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_1 = require("./config/swagger");
const auditLogRoutes_1 = __importDefault(require("./routes/auditLogRoutes"));
const notificationRoutes_1 = __importDefault(require("./routes/notificationRoutes"));
const reportRoutes_1 = __importDefault(require("./routes/reportRoutes"));
const unsplashRoutes_1 = __importDefault(require("./routes/unsplashRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const verificationRoute_1 = __importDefault(require("./routes/verificationRoute"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL,
    credentials: true,
}));
app.use(express_1.default.json());
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.swaggerSpec));
app.use('/api/users', userRoutes_1.default);
app.use('/api/reports', reportRoutes_1.default);
app.use('/api/unsplash', unsplashRoutes_1.default);
app.use('/api/audit-logs', auditLogRoutes_1.default);
app.use('/api/notifications', notificationRoutes_1.default);
app.use('/api', verificationRoute_1.default);
const PORT = process.env.PORT;
app.get('/', (_req, res) => {
    res.send('🚀 Server is running and MongoDB is connected!');
});
mongoose_1.default
    .connect(process.env.MONGO_URI || '')
    .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => {
        console.log(`🌐 Server running on http://localhost:${PORT}`);
    });
})
    .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
});
