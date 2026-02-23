// Importa as variáveis de ambiente
import './src/config/env.js';

// Importa a aplicação
import app from './src/app.js';

// Porta do servidor
const PORT = process.env.PORT || 3000;

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor ECOTROCA rodando na porta ${PORT}`);
});