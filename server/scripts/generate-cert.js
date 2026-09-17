import forge from 'node-forge';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const certsDir = join(__dirname, '..', 'certs');
if (!existsSync(certsDir)) mkdirSync(certsDir, { recursive: true });

console.log('Generating self-signed certificate for localhost...');

const pki = forge.pki;
const keys = pki.rsa.generateKeyPair(2048);
const cert = pki.createCertificate();

cert.publicKey = keys.publicKey;
cert.serialNumber = '01';
cert.validity.notBefore = new Date();
cert.validity.notAfter = new Date();
cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

const attrs = [
  { name: 'commonName', value: 'localhost' },
  { name: 'countryName', value: 'RU' },
  { name: 'organizationName', value: 'Video Chat Room Dev' },
];
cert.setSubject(attrs);
cert.setIssuer(attrs);

cert.setExtensions([
  { name: 'basicConstraints', cA: true },
  {
    name: 'keyUsage',
    keyCertSign: true,
    digitalSignature: true,
    keyEncipherment: true,
  },
  { name: 'extKeyUsage', serverAuth: true },
  {
    name: 'subjectAltName',
    altNames: [
      { type: 2, value: 'localhost' },
      { type: 7, ip: '127.0.0.1' },
    ],
  },
]);

cert.sign(keys.privateKey, forge.md.sha256.create());

const certPem = pki.certificateToPem(cert);
const keyPem = pki.privateKeyToPem(keys.privateKey);

writeFileSync(join(certsDir, 'cert.pem'), certPem);
writeFileSync(join(certsDir, 'key.pem'), keyPem);

console.log(`✓ cert.pem created at ${join(certsDir, 'cert.pem')}`);
console.log(`✓ key.pem created at ${join(certsDir, 'key.pem')}`);
console.log('');
console.log('NOTE: Browser will warn about self-signed certificate.');
console.log('Click "Advanced" → "Proceed" when accessing https://localhost:3000');