const authService = require('../services/authService');
const tokenService = require('../services/tokenService');
const asyncHandler = require('../utils/asyncHandler');
const { flashError, flashSuccess } = require('../middleware/flash');

const trim = (value) => (typeof value === 'string' ? value.trim() : '');

const withQuery = (path, params) => {
  const search = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value),
  ).toString();

  return search ? `${path}?${search}` : path;
};

/**
 * Shared shape for the authentication POST handlers: re-render the form when
 * validation fails, bounce back with a flash message on a handled failure
 * (bad credentials, duplicate email, unavailable service) and defer anything
 * unexpected to the central error handler.
 */
const formAction = ({ view, title, readValues, run, redirectTo, onSuccess }) =>
  asyncHandler(async (req, res, next) => {
    const values = readValues(req);

    try {
      await run(req);
    } catch (error) {
      if (error.statusCode === 422) {
        return res.status(422).render(view, {
          layout: 'layouts/auth',
          title,
          errors: error.details || {},
          values,
        });
      }

      if ([401, 403, 409, 503].includes(error.statusCode)) {
        flashError(res, error.message);
        return res.redirect(redirectTo(values));
      }

      return next(error);
    }

    return onSuccess(res, values);
  });

const showLogin = (req, res) =>
  res.render('auth/login', {
    layout: 'layouts/auth',
    title: 'Welcome back',
    errors: {},
    values: { email: trim(req.query.email) },
  });

const login = asyncHandler(async (req, res, next) => {
  const values = { email: trim(req.body.email) };

  try {
    const { user, token } = await authService.login({
      email: req.body.email,
      password: req.body.password,
    });

    tokenService.setAuthCookie(res, token, { persistent: Boolean(req.body.rememberMe) });
    flashSuccess(res, `Welcome back, ${user.fullName.split(' ')[0]}.`);

    return res.redirect(trim(req.query.next) || '/dashboard');
  } catch (error) {
    if (error.statusCode === 422) {
      return res.status(422).render('auth/login', {
        layout: 'layouts/auth',
        title: 'Welcome back',
        errors: error.details || {},
        values,
      });
    }

    if (error.statusCode === 401 || error.statusCode === 403) {
      flashError(res, error.message);
      return res.redirect(withQuery('/login', { email: values.email }));
    }

    return next(error);
  }
});

const logout = asyncHandler(async (req, res) => {
  tokenService.clearAuthCookie(res);
  flashSuccess(res, 'You have been signed out.');
  return res.redirect('/login');
});

/** GET /register */
const showRegister = (req, res) =>
  res.render('auth/register', {
    layout: 'layouts/auth',
    title: 'Create your account',
    errors: {},
    values: {},
  });

const register = formAction({
  view: 'auth/register',
  title: 'Create your account',
  readValues: (req) => ({ fullName: trim(req.body.fullName), email: trim(req.body.email) }),
  run: (req) =>
    authService.register({
      fullName: req.body.fullName,
      email: req.body.email,
      password: req.body.password,
      role: req.body.role,
    }),
  redirectTo: () => '/register',
  onSuccess: (res) => {
    flashSuccess(res, 'Account created successfully. Please sign in.');
    return res.redirect('/login');
  },
});

const showForgotPassword = (req, res) =>
  res.render('auth/forgot-password', {
    layout: 'layouts/auth',
    title: 'Forgot password',
    errors: {},
    values: {},
  });

const forgotPassword = formAction({
  view: 'auth/forgot-password',
  title: 'Forgot password',
  readValues: (req) => ({ email: trim(req.body.email) }),
  run: (req) => authService.requestPasswordReset({ email: req.body.email }),
  redirectTo: () => '/forgot-password',
  onSuccess: (res, values) => {
    flashSuccess(res, 'If an account exists, an OTP has been sent.');
    return res.redirect(withQuery('/verify-otp', { email: values.email }));
  },
});

const showVerifyOtp = (req, res) =>
  res.render('auth/verify-otp', {
    layout: 'layouts/auth',
    title: 'Verify your email',
    errors: {},
    values: { email: trim(req.query.email) },
  });

const verifyOtp = formAction({
  view: 'auth/verify-otp',
  title: 'Verify your email',
  readValues: (req) => ({ email: trim(req.body.email), otp: trim(req.body.otp) }),
  run: (req) => authService.verifyOtp({ email: req.body.email, otp: req.body.otp }),
  redirectTo: (values) => withQuery('/verify-otp', { email: values.email }),
  onSuccess: (res, values) =>
    res.redirect(withQuery('/reset-password', { email: values.email, otp: values.otp })),
});

const showResetPassword = (req, res) =>
  res.render('auth/reset-password', {
    layout: 'layouts/auth',
    title: 'Reset password',
    errors: {},
    values: { email: trim(req.query.email), otp: trim(req.query.otp) },
  });

const resetPassword = formAction({
  view: 'auth/reset-password',
  title: 'Reset password',
  readValues: (req) => ({ email: trim(req.body.email), otp: trim(req.body.otp) }),
  run: (req) =>
    authService.resetPassword({
      email: req.body.email,
      otp: req.body.otp,
      password: req.body.password,
    }),
  redirectTo: (values) => withQuery('/reset-password', values),
  onSuccess: (res) => {
    flashSuccess(res, 'Your password has been reset. Please sign in.');
    return res.redirect('/login');
  },
});

module.exports = {
  forgotPassword,
  login,
  logout,
  register,
  resetPassword,
  showForgotPassword,
  showLogin,
  showRegister,
  showResetPassword,
  showVerifyOtp,
  verifyOtp,
};