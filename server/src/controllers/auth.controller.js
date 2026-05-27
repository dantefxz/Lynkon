const { parseRegisterDTO, parseLoginDTO } = require('../dtos/auth.dto');
const authService = require('../services/auth.service');

const register = async (req, res, next) => {
  try {
    const { data, errors } = parseRegisterDTO(req.body);
    if (errors.length) return res.status(400).json({ errors });

    const result = await authService.register(data);
    return res.status(201).json({ message: 'User registered successfully', ...result });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ errors: ['email and password are required'] });

    const result = await authService.login(email, password);
    return res.status(200).json({ message: 'Login successful', ...result });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
};


const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ errors: ['email is required'] });

    const result = await authService.forgotPassword(email);
    return res.status(200).json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { oobCode, newPassword } = req.body;
    const result = await authService.resetPassword(oobCode, newPassword);
    return res.status(200).json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
};

module.exports = { register, login, forgotPassword, resetPassword };
