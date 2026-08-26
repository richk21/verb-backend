import { NextFunction, Request, Response } from 'express';
import { scanPayloadForSecrets } from '../utils/secretScanner';

export const complianceScanner = (req: Request, res: Response, next: NextFunction) => {
  const matches = scanPayloadForSecrets(req.body || {});

  if (matches.length > 0) {
    const labels = matches.map((m) => m.label);

    console.warn(
      `[compliance-scanner] Blocked submission from user=${req.user?.id ?? 'unknown'}` +
        `org=${req.user?.orgId ?? 'unknown'} — detected: ${labels.join(', ')}`
    );

    return res.status(400).json({
      message:
        'Submission blocked: it appears to contain sensitive data (e.g. credentials, connection strings, or internal IPs). Please remove it and try again.',
      detectedPatterns: labels,
    });
  }
  next();
};
