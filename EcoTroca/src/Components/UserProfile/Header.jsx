import { Link } from "react-router-dom";

const Header = () => {
  return (
    <header className="bg-green-900 text-white px-6 py-4 flex justify-between items-center">
      <div className="flex items-center gap-2">
        <span className="text-2xl">♻️</span>
        <h1 className="font-bold text-lg">EcoTroca</h1>
      </div>

      <nav className="hidden md:flex gap-6 text-sm">
        <Link to="/dashboard">Início</Link>
        <Link to="/trocas">Minhas trocas</Link>
        <Link to="/postar">Postar item</Link>
        <Link to="/mensagens">Mensagens</Link>
        <Link to="/configuracoes">Configurações</Link>
        <Link to="/login" className="text-red-300">Sair</Link>
      </nav>
    </header>
  );
};

export default Header;
