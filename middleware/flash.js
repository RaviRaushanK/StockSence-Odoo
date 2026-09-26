const FLASH_COOKIE = 'ss_flash';
const FLASH_MAX_AGE = 60 * 1000;

const serialize = (flash) => Buffer.from(JSON.stringify(flash), 'utf8').toString('base64url');

const parse = (raw) => {
  try {
    const parsed = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'));
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
};

const setFlash = (res, type, message) => {
  res.cookie(FLASH_COOKIE, serialize({ type, message }), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: FLASH_MAX_AGE,
  });
};

const flash = (res, type, message) => setFlash(res, type, message);

const flashSuccess = (res, message) => setFlash(res, 'success', message);

const flashError = (res, message) => setFlash(res, 'danger', message);

/** Reads and immediately clears the one-shot flash message, if present. */
const consumeFlash = (req, res) => {
  const raw = req.cookies?.[FLASH_COOKIE];
  const message = raw ? parse(raw) : null;

  if (message) {
    res.clearCookie(FLASH_COOKIE, { httpOnly: true, sameSite: 'lax', path: '/' });
  }

  return message;
};

module.exports = { consumeFlash, flash, flashError, flashSuccess };