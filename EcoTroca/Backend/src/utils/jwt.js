import { sign, verify } from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env';

const gerarToken = (payload) => {
  return sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

const verificarToken = (token) => {
  return verify(token, JWT_SECRET);
};

export default { gerarToken, verificarToken };