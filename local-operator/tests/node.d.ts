// Node's built-in WebCrypto is used only to verify browser SHA256 behavior in tests.
declare module 'node:crypto' {export const webcrypto:Crypto;}
