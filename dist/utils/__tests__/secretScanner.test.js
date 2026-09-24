"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const secretScanner_1 = require("../secretScanner");
describe('scanTextForSecrets', () => {
    it('returns no matches for ordinary text', () => {
        const result = (0, secretScanner_1.scanTextForSecrets)('At 14:02 we observed a CPU spike, and the node failed over automatically at 14:05.');
        expect(result).toHaveLength(0);
    });
    it('detects an AWS access key id', () => {
        const result = (0, secretScanner_1.scanTextForSecrets)('key: AKIAABCDEFGHIJKLMNOP');
        expect(result.map((m) => m.label)).toContain('AWS Access Key ID');
    });
    it('detects an AWS secret access key assignment', () => {
        const result = (0, secretScanner_1.scanTextForSecrets)('aws_secret_access_key = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"');
        expect(result.map((m) => m.label)).toContain('AWS Secret Access Key (heuristic)');
    });
    it('detects a PEM private key block', () => {
        const result = (0, secretScanner_1.scanTextForSecrets)('-----BEGIN RSA PRIVATE KEY-----\nMIIEow...\n-----END RSA PRIVATE KEY-----');
        expect(result.map((m) => m.label)).toContain('Private key block');
    });
    it('detects a MongoDB connection string with embedded credentials', () => {
        const result = (0, secretScanner_1.scanTextForSecrets)('connection: mongodb+srv://admin:sup3rSecret@cluster0.mongodb.net/verb');
        expect(result.map((m) => m.label)).toContain('Generic database connection string');
    });
    it('detects a generic api key assignment', () => {
        const result = (0, secretScanner_1.scanTextForSecrets)('api_key: "sk_live_51H8yZ2eZvKYlo2C0"');
        expect(result.map((m) => m.label)).toContain('Generic API key/token assignment');
    });
    it('detects an internal 10.x IP address', () => {
        const result = (0, secretScanner_1.scanTextForSecrets)('The failover target was 10.2.4.17');
        expect(result.map((m) => m.label)).toContain('Internal / private IP address');
    });
    it('detects a 172.16-31.x private IP but not 172.32.x (out of range)', () => {
        const inRange = (0, secretScanner_1.scanTextForSecrets)('Node at 172.20.0.5 restarted');
        const outOfRange = (0, secretScanner_1.scanTextForSecrets)('Node at 172.32.0.5 restarted');
        expect(inRange.map((m) => m.label)).toContain('Internal / private IP address');
        expect(outOfRange.map((m) => m.label)).not.toContain('Internal / private IP address');
    });
    it('does NOT flag a public IP address', () => {
        const result = (0, secretScanner_1.scanTextForSecrets)('Our status page is at 8.8.8.8');
        expect(result.map((m) => m.label)).not.toContain('Internal / private IP address');
    });
    it('detects a JWT-shaped token', () => {
        const fakeJwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dGhpc2lzbm90YXJlYWxzaWduYXR1cmU';
        const result = (0, secretScanner_1.scanTextForSecrets)(`Bearer ${fakeJwt}`);
        expect(result.map((m) => m.label)).toContain('JWT-shaped token');
    });
    it('returns multiple matches when multiple secret types are present', () => {
        const text = 'key: AKIAABCDEFGHIJKLMNOP and internal host at 192.168.1.10';
        const result = (0, secretScanner_1.scanTextForSecrets)(text);
        const labels = result.map((m) => m.label);
        expect(labels).toContain('AWS Access Key ID');
        expect(labels).toContain('Internal / private IP address');
    });
    it('handles empty/undefined input gracefully', () => {
        expect((0, secretScanner_1.scanTextForSecrets)('')).toHaveLength(0);
    });
});
describe('scanPayloadForSecrets', () => {
    it('scans every string field, not just one', () => {
        const payload = {
            title: 'Payment API outage',
            content: 'Root cause unrelated to secrets.',
            hashtags: ['outage', 'AKIAABCDEFGHIJKLMNOP'], // secret hidden in an array field
        };
        const result = (0, secretScanner_1.scanPayloadForSecrets)(payload);
        expect(result.map((m) => m.label)).toContain('AWS Access Key ID');
    });
    it('ignores non-string fields instead of throwing', () => {
        const payload = { title: 'Fine', createdAt: new Date(), count: 42, isDraft: true };
        expect(() => (0, secretScanner_1.scanPayloadForSecrets)(payload)).not.toThrow();
        expect((0, secretScanner_1.scanPayloadForSecrets)(payload)).toHaveLength(0);
    });
    it('deduplicates repeated pattern types across fields', () => {
        const payload = {
            title: '10.0.0.1 down again',
            content: 'Also saw 10.0.0.5 misbehaving.',
        };
        const result = (0, secretScanner_1.scanPayloadForSecrets)(payload);
        const ipMatches = result.filter((m) => m.label === 'Internal / private IP address');
        expect(ipMatches).toHaveLength(1); // not one per occurrence
    });
});
