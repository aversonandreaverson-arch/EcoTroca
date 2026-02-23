// Importa as variáveis de ambiente
import './src/config/env.js';

// Importa a aplicação
import app from './src/app.js';

// Porta do servidor
const PORT = process.env.PORT || 3000;
console.log(process.env.DB_NAME);
// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor ECOTROCA rodando na porta ${PORT}`);
});