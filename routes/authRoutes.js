const express = require('express');

const authController = require('../controllers/authController');
const { redirectIfAuthenticated } = require('../middleware/authenticate');
const { authLimiter } = require('../middleware/rateLimiters');
const { validateBody } = require('../middleware/validation');
const { validators } = require('../utils/validators');

const router = express.Router();

const loginForm = { view: 'auth/login', title: 'Welcome back' };
const registerForm = { view: 'auth/register', title: 'Create your account' };
const forgotForm = { view: 'auth/forgot-password', title: 'Forgot password' };
const otpForm = { view: 'auth/verify-otp', title: 'Verify your email' };
const resetForm = { view: 'auth/reset-password', title: 'Reset password' };

router.get('/login', redirectIfAuthenticated, authController.showLogin);
router.post('/login', authLimiter, validateBody({
  email: validators.email,
  password: validators.currentPassword,
}, loginForm), authController.login);

router.get('/register', redirectIfAuthenticated, authController.showRegister);
router.post('/register', authLimiter, validateBody({
  fullName: validators.fullName,
  email: validators.email,
  password: validators.password,
  role: validators.role,
}, registerForm), authController.register);

router.post('/logout', authController.logout);

router.get('/forgot-password', redirectIfAuthenticated, authController.showForgotPassword);
router.post('/forgot-password', authLimiter, validateBody({ email: validators.email }, forgotForm), authController.forgotPassword);

router.get('/verify-otp', redirectIfAuthenticated, authController.showVerifyOtp);
router.post('/verify-otp', authLimiter, validateBody({
  email: validators.email,
  otp: validators.otp,
}, otpForm), authController.verifyOtp);

router.get('/reset-password', redirectIfAuthenticated, authController.showResetPassword);
router.post('/reset-password', authLimiter, validateBody({
  email: validators.email,
  otp: validators.otp,
  password: validators.password,
}, resetForm), authController.resetPassword);

module.exports = router;