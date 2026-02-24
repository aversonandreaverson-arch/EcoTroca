import { registar as registarService, login as loginService } from '../services/auth.service.js';

const registar = async (req, res) => {
  try {
    const resultado = await registarService(req.body);
    res.status(201).json(resultado);
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
};

const login = async (req, res) => {
  try {
    const resultado = await loginService(req.body);
    res.json(resultado);
  } catch (err) {
    res.status(401).json({ erro: err.message });
  }
};

export { registar, login };