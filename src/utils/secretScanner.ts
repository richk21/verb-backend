/**
 * Detects accidentally-pasted secrets (cloud keys, connection strings,
 * private key blocks, internal IPs) in free-text submissions before they
 * are persisted. Lightweight regex-based first line of defense — NOT a
 * replacement for a real tool like Gitleaks/GitGuardian (those add entropy
 * analysis on top of pattern matching).
 */

export interface SecretMatch {
  label: string; // never the raw matched text — logs/responses must never leak the secret
}

interface SecretPattern {
  label: string;
  regex: RegExp;
}

const SECRET_PATTERNS: SecretPattern[] = [
  {
    label: 'AWS Access Key ID',
    regex: /AKIA[0-9A-Z]{16}/,
  },
  {
    label: 'AWS Secret Access Key (heuristic)',
    regex: /(?:aws_secret_access_key|secret[_-]?key)\s*[:=]\s*['"]?[A-Za-z0-9/+=]{40}['"]?/i,
  },
  {
    label: 'Private key block',
    regex: /-----BEGIN\s+(RSA|EC|OPENSSH|PGP|DSA)?\s?PRIVATE KEY-----/,
  },
  {
    label: 'Generic database connection string',
    regex: /(mongodb(?:\+srv)?|postgres(?:ql)?|mysql|redis):\/\/[^\s'"]+:[^\s'"]+@[^\s'"]+/i,
  },
  {
    label: 'Generic API key/token assignment',
    regex: /(api[_-]?key|access[_-]?token|secret)\s*[:=]\s*['"]?[A-Za-z0-9_\-]{20,}['"]?/i,
  },
  {
    label: 'Internal / private IP address',
    regex:
      /\b(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3})\b/,
  },
  {
    label: 'JWT-shaped token',
    regex: /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/,
  },
];

export const scanTextForSecrets = (text: string): SecretMatch[] => {
  if (!text) return [];
  const matches: SecretMatch[] = [];
  for (const pattern of SECRET_PATTERNS) {
    if (pattern.regex.test(text)) {
      matches.push({ label: pattern.label });
    }
  }
  return matches;
};

export const scanPayloadForSecrets = (payload: Record<string, unknown>): SecretMatch[] => {
  const allMatches: SecretMatch[] = [];
  const seenLabels = new Set<string>();

  const scanValue = (value: unknown) => {
    if (typeof value === 'string') {
      for (const match of scanTextForSecrets(value)) {
        if (!seenLabels.has(match.label)) {
          seenLabels.add(match.label);
          allMatches.push(match);
        }
      }
    } else if (Array.isArray(value)) {
      value.forEach(scanValue);
    }
  };

  Object.values(payload).forEach(scanValue);
  return allMatches;
};
