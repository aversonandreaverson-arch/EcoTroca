import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env.js';

const gerarToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

const verificarToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

export { gerarToken, verificarToken };