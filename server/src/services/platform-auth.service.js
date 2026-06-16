const jwt  = require('jsonwebtoken');
const axios = require('axios');

const JWT_SECRET  = () => process.env.JWT_SECRET  || 'lynkon-dev-secret-key-2026';
const SERVER_URL  = () => process.env.SERVER_URL   || 'http://localhost:3000';
const APP_SCHEME  = () => process.env.APP_SCHEME   || 'lynkon';

// ── State token ───────────────────────────────────────────────────────────────

const createStateToken = (uid, redirectUri) =>
  jwt.sign({ uid, nonce: Math.random().toString(36).slice(2), redirectUri }, JWT_SECRET(), { expiresIn: '10m' });

const verifyStateToken = (state) => {
  if (!state) throw Object.assign(new Error('Missing auth state'), { status: 400 });
  try {
    return jwt.verify(state, JWT_SECRET());
  } catch {
    throw Object.assign(new Error('Invalid or expired auth state'), { status: 400 });
  }
};

// ── Deep link ─────────────────────────────────────────────────────────────────

const buildDeepLink = (redirectUri, platform, success, error) => {
  const base = `${redirectUri}?platform=${platform}`;
  if (success) return `${base}&success=true`;
  return `${base}&success=false&error=${encodeURIComponent(error || 'Unknown error')}`;
};

// ── Steam OpenID 2.0 ──────────────────────────────────────────────────────────

const getSteamAuthUrl = (uid, redirectUri) => {
  const state    = createStateToken(uid, redirectUri);
  const returnTo = `${SERVER_URL()}/api/platforms/auth/steam/callback?state=${encodeURIComponent(state)}`;
  const params   = new URLSearchParams({
    'openid.ns':         'http://specs.openid.net/auth/2.0',
    'openid.mode':       'checkid_setup',
    'openid.return_to':  returnTo,
    'openid.realm':      SERVER_URL(),
    'openid.identity':   'http://specs.openid.net/auth/2.0/identifier_select',
    'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
  });
  return `https://steamcommunity.com/openid/login?${params.toString()}`;
};

const verifySteamCallback = async (query) => {
  const claimedId = query['openid.claimed_id'] || '';
  const match     = claimedId.match(/\/openid\/id\/(\d{17})$/);
  if (!match) throw Object.assign(new Error('Invalid Steam OpenID response'), { status: 400 });
  const steamId = match[1];

  // Whitelist de parámetros OpenID — evita inyección de campos arbitrarios del query del usuario
  const OPENID_FIELDS = [
    'openid.ns', 'openid.op_endpoint', 'openid.claimed_id', 'openid.identity',
    'openid.return_to', 'openid.response_nonce', 'openid.assoc_handle',
    'openid.signed', 'openid.sig',
  ];
  const verifyParams = { 'openid.mode': 'check_authentication' };
  for (const field of OPENID_FIELDS) {
    if (query[field] !== undefined) verifyParams[field] = query[field];
  }

  const verifyRes = await axios.post(
    'https://steamcommunity.com/openid/login',
    new URLSearchParams(verifyParams).toString(),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  if (!verifyRes.data.includes('is_valid:true')) {
    throw Object.assign(new Error('Steam signature verification failed'), { status: 401 });
  }

  return steamId;
};

// ── Xbox Microsoft OAuth 2.0 ──────────────────────────────────────────────────

const MS_AUTH_BASE = 'https://login.microsoftonline.com/consumers/oauth2/v2.0';
const XBL_URL      = 'https://user.auth.xboxlive.com/user/authenticate';
const XSTS_URL     = 'https://xsts.auth.xboxlive.com/xsts/authorize';

const getXboxAuthUrl = (uid, redirectUri) => {
  const state          = createStateToken(uid, redirectUri);
  const callbackUri    = `${SERVER_URL()}/api/platforms/auth/xbox/callback`;
  const params         = new URLSearchParams({
    client_id:     process.env.MICROSOFT_CLIENT_ID,
    response_type: 'code',
    redirect_uri:  callbackUri,
    scope:         'XboxLive.signin XboxLive.offline_access',
    state,
  });
  return `${MS_AUTH_BASE}/authorize?${params.toString()}`;
};
const verifyXboxCallback = async (code) => {
  const redirectUri = `${SERVER_URL()}/api/platforms/auth/xbox/callback`;

  const tokenRes = await axios.post(
    `${MS_AUTH_BASE}/token`,
    new URLSearchParams({
      client_id:     process.env.MICROSOFT_CLIENT_ID,
      //client_secret: process.env.MICROSOFT_CLIENT_SECRET, Generaba error al momento de obetener el token.
      code,
      grant_type:    'authorization_code',
      redirect_uri:  redirectUri,
    }).toString(),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  const msAccessToken = tokenRes.data.access_token;

  const xblRes = await axios.post(XBL_URL, {
    Properties: {
      AuthMethod: 'RPS',
      SiteName:   'user.auth.xboxlive.com',
      RpsTicket:  `d=${msAccessToken}`,
    },
    RelyingParty: 'http://auth.xboxlive.com',
    TokenType:    'JWT',
  }, { headers: { 'Content-Type': 'application/json', Accept: 'application/json' } });

  const xblToken = xblRes.data.Token;

  const xstsRes = await axios.post(XSTS_URL, {
    Properties: {
      SandboxId:  'RETAIL',
      UserTokens: [xblToken],
    },
    RelyingParty: 'http://xboxlive.com',
    TokenType:    'JWT',
  }, { headers: { 'Content-Type': 'application/json', Accept: 'application/json' } });

  const xuid = xstsRes.data?.DisplayClaims?.xui?.[0]?.xid;
  if (!xuid) throw Object.assign(new Error('No se pudo obtener el XUID desde Xbox'), { status: 502 });

  return xuid;
};

module.exports = {
  getSteamAuthUrl,
  verifySteamCallback,
  getXboxAuthUrl,
  verifyXboxCallback,
  verifyStateToken,
  buildDeepLink,
};
