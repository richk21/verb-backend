"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.complianceScanner = void 0;
const secretScanner_1 = require("../utils/secretScanner");
const complianceScanner = (req, res, next) => {
    const matches = (0, secretScanner_1.scanPayloadForSecrets)(req.body || {});
    if (matches.length > 0) {
        const labels = matches.map((m) => m.label);
        console.warn(`[compliance-scanner] Blocked submission from user=${req.user?.id ?? 'unknown'}` +
            `org=${req.user?.orgId ?? 'unknown'} — detected: ${labels.join(', ')}`);
        return res.status(400).json({
            message: 'Submission blocked: it appears to contain sensitive data (e.g. credentials, connection strings, or internal IPs). Please remove it and try again.',
            detectedPatterns: labels,
        });
    }
    next();
};
exports.complianceScanner = complianceScanner;
