/**
 * DTOs de Auth
 * Validan y normalizan los datos de entrada para register y login.
 */

/**
 * @typedef {Object} RegisterDTO
 * @property {string} uid           - UID generado por Firebase Auth en el cliente
 * @property {string} email
 * @property {string} birthDate     - ISO 8601: "YYYY-MM-DD"
 * @property {string} [username]    - Opcional; se genera automáticamente si no se provee
 * @property {'email'|'google'} [authProvider]
 */

/**
 * Valida y construye un RegisterDTO a partir del body del request.
 * @param {Object} body
 * @returns {{ data: RegisterDTO|null, errors: string[] }}
 */
const parseRegisterDTO = (body) => {
  const errors = [];
  const { uid, email, birthDate, username, authProvider = 'email' } = body;

  if (!uid)       errors.push('uid is required');
  if (!email)     errors.push('email is required');
  if (!birthDate) errors.push('birthDate is required (YYYY-MM-DD)');
  else if (isNaN(new Date(birthDate).getTime())) errors.push('birthDate is not a valid date');

  if (!['email', 'google'].includes(authProvider))
    errors.push("authProvider must be 'email' or 'google'");

  if (errors.length) return { data: null, errors };

  return {
    data: { uid, email: email.trim().toLowerCase(), birthDate, username: username?.trim(), authProvider },
    errors: [],
  };
};

/**
 * @typedef {Object} LoginDTO
 * @property {string} idToken - Firebase ID Token generado por el cliente
 */

/**
 * @param {Object} body
 * @returns {{ data: LoginDTO|null, errors: string[] }}
 */
const parseLoginDTO = (body) => {
  const errors = [];
  const { idToken } = body;

  if (!idToken) errors.push('idToken is required');

  if (errors.length) return { data: null, errors };
  return { data: { idToken }, errors: [] };
};

module.exports = { parseRegisterDTO, parseLoginDTO };
