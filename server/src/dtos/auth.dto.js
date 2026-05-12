/**
 * DTOs de Auth
 * Validan y normalizan los datos de entrada para register y login.
 */

/**
 * @typedef {Object} RegisterDTO
 * @property {string} email         - Email del usuario
 * @property {string} password      - Contraseña (mín 6 letras, mín 2 números, 8 caracteres totales)
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
  const { email, password, birthDate, username, authProvider = 'email' } = body;

  if (!email)     errors.push('email is required');
  if (!password)  errors.push('password is required (min 6 letters, min 2 numbers, 8 characters total)');
  else {
    const letterCount = (password.match(/[a-zA-Z]/g) || []).length;
    const numberCount = (password.match(/[0-9]/g) || []).length;
    
    if (letterCount < 6) errors.push('password must contain at least 6 letters');
    if (numberCount < 2) errors.push('password must contain at least 2 numbers');
    if (password.length < 8) errors.push('password must be at least 8 characters');
  }
  if (!birthDate) errors.push('birthDate is required (YYYY-MM-DD)');
  else if (isNaN(new Date(birthDate).getTime())) errors.push('birthDate is not a valid date');

  if (!['email', 'google'].includes(authProvider))
    errors.push("authProvider must be 'email' or 'google'");

  if (errors.length) return { data: null, errors };

  return {
    data: { email: email.trim().toLowerCase(), password, birthDate, username: username?.trim(), authProvider },
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
