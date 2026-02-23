import { registar as _registar, login as _login } from '../services/auth.service';

const registar = async (req, res) => {
  try {
    const resultado = await _registar(req.body);
    res.status(201).json(resultado);
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
};

const login = async (req, res) => {
  try {
    const resultado = await _login(req.body);
    res.json(resultado);
  } catch (err) {
    res.status(401).json({ erro: err.message });
  }
};

export default { registar, login };