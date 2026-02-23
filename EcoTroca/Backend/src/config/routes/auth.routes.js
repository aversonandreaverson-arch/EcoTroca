const router = require('express').Router();
import { registar, login } from '../controllers/auth.controller';

router.post('/registar', registar);
router.post('/login', login);

export default router;