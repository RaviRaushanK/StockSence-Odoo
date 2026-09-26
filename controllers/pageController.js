/**
 * Entry point for `/`. The dashboard route is already protected, so an
 * anonymous visitor is forwarded to the login page by `requireAuth`.
 */
const home = (req, res) => res.redirect('/dashboard');

module.exports = { home };