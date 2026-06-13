const { db } = require('../config/firebase');
const {
  getSteamAuthUrl,
  verifySteamCallback,
  getXboxAuthUrl,
  verifyXboxCallback,
  verifyStateToken,
  buildDeepLink,
} = require('../services/platform-auth.service');

const APP_SCHEME = () => process.env.APP_SCHEME || 'lynkon';

const buildCallbackPage = (url) => `<!DOCTYPE html>
<html><head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Lynkon</title>
  <script>window.location='${url}';</script>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:-apple-system,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;background:#0f0f0f;color:#fff;padding:24px;text-align:center}
    a{display:inline-block;margin-top:24px;padding:14px 32px;background:#7C3AED;color:#fff;border-radius:12px;font-size:16px;font-weight:700;text-decoration:none}
  </style>
</head><body>
  <p style="font-size:18px;font-weight:700">Cuenta vinculada</p>
  <p style="margin-top:8px;color:#888;font-size:14px">Volvé a Lynkon para continuar</p>
  <a href="${url}">Abrir Lynkon</a>
</body></html>`;
/*
const linkIfNotLinked = async (uid, platform, platformUserId) => {
  const ref      = db.collection('users').doc(uid);
  const snap     = await ref.get();
  if (!snap.exists) throw Object.assign(new Error('User not found'), { status: 404 });
  const platforms = snap.data().platforms || [];
  if (platforms.find((p) => p.platform === platform)) return;
  await ref.update({
    platforms: [...platforms, { platform, platformUserId, linkedAt: new Date().toISOString() }],
  });
};
*/
const linkIfNotLinked = async (uid, platform, platformUserId) => {
  const ref = db.collection('users').doc(uid);
  const snap = await ref.get();

  if (!snap.exists) {
    throw Object.assign(new Error('User not found'), {
      status: 404,
    });
  }

  const platforms = snap.data().platforms || [];

  console.log('===== LINK PLATFORM =====');
  console.log('UID:', uid);
  console.log('PLATFORM:', platform);
  console.log('PLATFORM USER ID:', platformUserId);
  console.log('CURRENT PLATFORMS:', JSON.stringify(platforms, null, 2));

  const existing = platforms.find(
    (p) => p.platform === platform
  );

  if (existing) {
    console.log('PLATFORM ALREADY LINKED');
    return;
  }

  await ref.update({
    platforms: [
      ...platforms,
      {
        platform,
        platformUserId,
        linkedAt: new Date().toISOString(),
      },
    ],
  });

  console.log('PLATFORM SAVED');
};
// ── Steam ─────────────────────────────────────────────────────────────────────

const steamInit = (req, res) => {
  try {
    const { redirectUri } = req.body;
    const authUrl = getSteamAuthUrl(req.user.uid, redirectUri);
    return res.json({ authUrl });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const steamCallback = async (req, res) => {
  let uid, redirectUri;
  try {
    ({ uid, redirectUri } = verifyStateToken(req.query.state));
    const steamId = await verifySteamCallback(req.query);
    await linkIfNotLinked(uid, 'steam', steamId);
    const fallback = `${APP_SCHEME()}://platform-linked`;
    return res.send(buildCallbackPage(buildDeepLink(redirectUri || fallback, 'steam', true)));
  } catch (err) {
    const fallback = `${APP_SCHEME()}://platform-linked`;
    return res.send(buildCallbackPage(buildDeepLink(redirectUri || fallback, 'steam', false, err.message)));
  }
};

// ── Xbox ──────────────────────────────────────────────────────────────────────

const xboxInit = (req, res) => {
  try {
    if (!process.env.MICROSOFT_CLIENT_ID) {
      return res.status(503).json({ error: 'Xbox OAuth no configurado (falta MICROSOFT_CLIENT_ID)' });
    }
    const { redirectUri } = req.body;
    const authUrl = getXboxAuthUrl(req.user.uid, redirectUri);
    return res.json({ authUrl });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const xboxCallback = async (req, res) => {
  let uid, redirectUri;
  try {
    const { code, state, error: oauthError, error_description } = req.query;
    if (oauthError) throw new Error(error_description || oauthError);
    ({ uid, redirectUri } = verifyStateToken(state));
    const xuid = await verifyXboxCallback(code);
    await linkIfNotLinked(uid, 'xbox', xuid);
    const fallback = `${APP_SCHEME()}://platform-linked`;
    return res.send(buildCallbackPage(buildDeepLink(redirectUri || fallback, 'xbox', true)));
  } catch (err) {
    const fallback = `${APP_SCHEME()}://platform-linked`;
    return res.send(buildCallbackPage(buildDeepLink(redirectUri || fallback, 'xbox', false, err.message)));
  }
};

module.exports = { steamInit, steamCallback, xboxInit, xboxCallback };
