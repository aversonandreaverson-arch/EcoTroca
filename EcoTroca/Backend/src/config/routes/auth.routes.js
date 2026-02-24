import { Router } from 'express';
import { registar, login } from '../controllers/auth.controller.js';

const router = Router();

router.post('/registar', registar);
router.post('/login', login);

export default router;