// Central site config — single place for contact details and base URL.
// Values can be overridden with environment variables (see .env.example).
module.exports = {
  // Digits only, with country code, no "+" or spaces (used in wa.me links).
  whatsappNumber: process.env.WHATSAPP_NUMBER || '923477531179',
  // Public contact email shown on the contact page.
  contactEmail: process.env.CONTACT_EMAIL || 'hello@contomatix.com',
  // Canonical base URL, no trailing slash (used for Open Graph / canonical tags).
  baseUrl: process.env.SITE_URL || 'https://contomatix.com'
};
