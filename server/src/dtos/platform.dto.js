const SUPPORTED_PLATFORMS = ['steam', 'psn', 'xbox'];

const PLATFORM_CREDENTIAL_FIELD = {
  steam: 'steamId',
  xbox:  'xuid',
  psn:   'npssoToken',
};

const parseLinkPlatformDTO = (body) => {
  const errors = [];
  const { platform, platformUserId } = body;

  if (!platform)
    errors.push('platform is required');
  else if (!SUPPORTED_PLATFORMS.includes(platform))
    errors.push(`platform must be one of: ${SUPPORTED_PLATFORMS.join(', ')}`);

  if (!platformUserId) {
    const hint = platform ? ` (for ${platform} this is your ${PLATFORM_CREDENTIAL_FIELD[platform]})` : '';
    errors.push(`platformUserId is required${hint}`);
  }

  if (errors.length) return { data: null, errors };
  return { data: { platform, platformUserId }, errors: [] };
};

const serializeLinkedPlatform = ({ platform, platformUserId, linkedAt }) => ({
  platform,
  platformUserId: platform === 'psn' ? '[LINKED]' : platformUserId,
  linkedAt,
});

module.exports = {
  parseLinkPlatformDTO,
  serializeLinkedPlatform,
  SUPPORTED_PLATFORMS,
  PLATFORM_CREDENTIAL_FIELD,
};
