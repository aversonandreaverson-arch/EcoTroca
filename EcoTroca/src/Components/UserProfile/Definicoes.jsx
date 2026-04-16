import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, Lock, User, Bell, CheckCircle } from "lucide-react";
import { getPerfil, actualizarPerfil } from "../../api.js";
import Header from "./Header";

export default function Definicoes() {
  const navigate = useNavigate();

  const [carregando,      setCarregando]      = useState(true);
  const [guardando,       setGuardando]       = useState(false);
  const [erro,            setErro]            = useState("");
  const [sucesso,         setSucesso]         = useState(false);
  const [verSenhaAtual,   setVerSenhaAtual]   = useState(false);
  const [verNovaSenha,    setVerNovaSenha]    = useState(false);
  const [notificacoes,    setNotificacoes]    = useState(true);

  const [form, setForm] = useState({ nome: "", email: "", telefone: "" });
  const [senhaAtual,     setSenhaAtual]     = useState("");
  const [novaSenha,      setNovaSenha]      = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  useEffect(() => {
    const carregar = async () => {
      try {
        const perfil = await getPerfil();
        setForm({ nome: perfil.nome || "", email: perfil.email || "", telefone: perfil.telefone || "" });
      } catch (err) {
        setErro("Erro ao carregar perfil: " + err.message);
      } finally {
        setCarregando(false);
      }
    };
    carregar();
  }, []);

  const atualizar = (campo) => (e) =>
    setForm(prev => ({ ...prev, [campo]: e.target.value }));

  const guardar = async () => {
    if (!form.nome.trim()) { setErro("O nome e obrigatorio."); return; }
    if (novaSenha || senhaAtual) {
      if (!senhaAtual) { setErro("Introduz a senha actual para poder altera-la."); return; }
      if (novaSenha.length < 8) { setErro("A nova senha deve ter pelo menos 8 caracteres."); return; }
      if (novaSenha !== confirmarSenha) { setErro("A nova senha e a confirmacao nao coincidem."); return; }
    }
    try {
      setErro(""); setSucesso(false); setGuardando(true);
      const dados = { ...form };
      if (senhaAtual && novaSenha) { dados.senha_atual = senhaAtual; dados.nova_senha = novaSenha; }
      await actualizarPerfil(dados);
      setSucesso(true);
      setSenhaAtual(""); setNovaSenha(""); setConfirmarSenha("");
      setTimeout(() => setSucesso(false), 3000);
    } catch (err) {
      setErro(err.message);
    } finally {
      setGuardando(false);
    }
  };

  if (carregando) return (
    <div className="min-h-screen bg-green-100 pt-24 flex items-center justify-center">
      <Header />
      <p className="text-green-700">A carregar...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-green-100 pt-24 pb-12">
      <Header />

      <div className="max-w-lg mx-auto px-4">

        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-green-700 hover:text-green-900 text-sm mb-5 transition">
          <ArrowLeft size={16} /> Voltar
        </button>

        {/* Dados da conta */}
        <div className="bg-white border border-green-100 rounded-2xl shadow-sm p-6 mb-4">
          <h2 className="text-lg font-bold text-green-800 mb-5 flex items-center gap-2">
            <User size={18} /> Dados da Conta
          </h2>
          <div className="space-y-4">
            <div>
              <label className="text-gray-600 text-sm font-medium block mb-1">
                Nome <span className="text-red-500">*</span>
              </label>
              <input type="text" value={form.nome} onChange={atualizar("nome")}
                placeholder="O teu nome completo"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
            </div>
            <div>
              <label className="text-gray-600 text-sm font-medium block mb-1">Email</label>
              <input type="email" value={form.email} onChange={atualizar("email")}
                placeholder="exemplo@email.com"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
            </div>
            <div>
              <label className="text-gray-600 text-sm font-medium block mb-1">Telefone</label>
              <input type="text" value={form.telefone} onChange={atualizar("telefone")}
                placeholder="Ex: 944000000"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
            </div>
          </div>
        </div>

        {/* Alterar senha */}
        <div className="bg-white border border-green-100 rounded-2xl shadow-sm p-6 mb-4">
          <h2 className="text-lg font-bold text-green-800 mb-1 flex items-center gap-2">
            <Lock size={18} /> Alterar Senha
          </h2>
          <p className="text-gray-400 text-xs mb-5">Deixa em branco se nao quiseres alterar a senha.</p>
          <div className="space-y-4">
            <div>
              <label className="text-gray-600 text-sm font-medium block mb-1">Senha Actual</label>
              <div className="relative">
                <input type={verSenhaAtual ? "text" : "password"} value={senhaAtual}
                  onChange={e => setSenhaAtual(e.target.value)}
                  placeholder="A tua senha actual"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
                <button type="button" onClick={() => setVerSenhaAtual(!verSenhaAtual)}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600">
                  {verSenhaAtual ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-gray-600 text-sm font-medium block mb-1">Nova Senha</label>
              <div className="relative">
                <input type={verNovaSenha ? "text" : "password"} value={novaSenha}
                  onChange={e => setNovaSenha(e.target.value)}
                  placeholder="Minimo 8 caracteres"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
                <button type="button" onClick={() => setVerNovaSenha(!verNovaSenha)}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600">
                  {verNovaSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-gray-600 text-sm font-medium block mb-1">Confirmar Nova Senha</label>
              <input type="password" value={confirmarSenha}
                onChange={e => setConfirmarSenha(e.target.value)}
                placeholder="Repete a nova senha"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
            </div>
          </div>
        </div>

        {/* Preferencias */}
        <div className="bg-white border border-green-100 rounded-2xl shadow-sm p-6 mb-4">
          <h2 className="text-lg font-bold text-green-800 mb-4 flex items-center gap-2">
            <Bell size={18} /> Preferencias
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Notificacoes na plataforma</p>
              <p className="text-xs text-gray-400">Recebe alertas de propostas e actualizacoes</p>
            </div>
            <button onClick={() => setNotificacoes(!notificacoes)}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                notificacoes ? 'bg-green-600' : 'bg-gray-300'
              }`}>
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                notificacoes ? 'translate-x-5' : 'translate-x-0.5'
              }`} />
            </button>
          </div>
        </div>

        {/* Erro */}
        {erro && (
          <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-xl p-3 mb-4">{erro}</p>
        )}

        {/* Sucesso */}
        {sucesso && (
          <div className="flex items-center gap-2 text-green-700 text-sm bg-green-50 border border-green-200 rounded-xl p-3 mb-4">
            <CheckCircle size={16} /> Definicoes guardadas com sucesso!
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={() => navigate(-1)}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl text-sm font-medium transition">
            Cancelar
          </button>
          <button onClick={guardar} disabled={guardando}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white py-3 rounded-xl text-sm font-medium transition">
            {guardando ? "A guardar..." : "Guardar Alteracoes"}
          </button>
        </div>
      </div>
    </div>
  );
}