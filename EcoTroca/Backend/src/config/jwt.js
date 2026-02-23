// Importa o jsonwebtoken
import { sign } from 'jsonwebtoken';

// Gera token JWT
export function generateToken(usuario) {
  return sign(
    {
      id: usuario.id_usuario,           // ID do usuário
      tipo: usuario.tipo_usuario        // tipo de usuário
    },
    process.env.JWT_SECRET,             // chave secreta
    { expiresIn: '24h' }                // validade do token
  );
}