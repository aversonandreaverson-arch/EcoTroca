
//  Fluxo:
//    1. Carrega dados actuais via GET /api/usuarios/perfil
//    2. Utilizador edita os campos desejados
//    3. Submete via PUT /api/usuarios/perfil
//    4. Se preencheu nova senha, valida e envia também

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { getPerfil, actualizarPerfil } from "../../api.js";
import Header from "./Header";

export default function Definicoes() {
  const navigate = useNavigate();

  // Estado de carregamento inicial
  const [carregando, setCarregando] = useState(true);

  // Estado durante o envio
  const [guardando, setGuardando] = useState(false);

  // Mensagens de feedback
  const [erro,    setErro]    = useState("");
  const [sucesso, setSucesso] = useState(false);

  // Controla visibilidade das senhas
  const [verSenhaAtual, setVerSenhaAtual] = useState(false);
  const [verNovaSenha,  setVerNovaSenha]  = useState(false);

  // Dados da conta
  const [form, setForm] = useState({
    nome:      "",
    email:     "",
    telefone:  "",
  });

  // Campos de senha separados — só enviados se preenchidos
  const [senhaAtual,    setSenhaAtual]    = useState("");
  const [novaSenha,     setNovaSenha]     = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  // Notificações na plataforma
  const [notificacoes, setNotificacoes] = useState(true);

  // Carrego os dados actuais do perfil ao abrir a página
  useEffect(() => {
    const carregar = async () => {
      try {
        const perfil = await getPerfil(); // GET /api/usuarios/perfil
        setForm({
          nome:     perfil.nome     || "",
          email:    perfil.email    || "",
          telefone: perfil.telefone || "",
        });
      } catch (err) {
        setErro("Erro ao carregar perfil: " + err.message);
      } finally {
        setCarregando(false);
      }
    };
    carregar();
  }, []);

  // Função auxiliar para actualizar campos do formulário
  const atualizar = (campo) => (e) =>
    setForm((prev) => ({ ...prev, [campo]: e.target.value }));

  // Submete as alterações ao backend
  const guardar = async () => {
    // Validação do nome
    if (!form.nome.trim()) {
      setErro("O nome é obrigatório.");
      return;
    }

    // Validação da senha — só verifica se o utilizador quer mudar
    if (novaSenha || senhaAtual) {
      if (!senhaAtual) {
        setErro("Introduz a senha actual para poder alterá-la.");
        return;
      }
      if (novaSenha.length < 6) {
        setErro("A nova senha deve ter pelo menos 6 caracteres.");
        return;
      }
      if (novaSenha !== confirmarSenha) {
        setErro("A nova senha e a confirmação não coincidem.");
        return;
      }
    }

    try {
      setErro("");
      setSucesso(false);
      setGuardando(true);

      // Construo o objecto com os dados a actualizar
      const dados = { ...form };

      // Só incluo os campos de senha se o utilizador os preencheu
      if (senhaAtual && novaSenha) {
        dados.senha_atual = senhaAtual;
        dados.nova_senha  = novaSenha;
      }

      // PUT /api/usuarios/perfil — envia os dados actualizados
      await actualizarPerfil(dados);

      setSucesso(true);
      // Limpo os campos de senha após sucesso
      setSenhaAtual("");
      setNovaSenha("");
      setConfirmarSenha("");
      setTimeout(() => setSucesso(false), 3000);
    } catch (err) {
      setErro(err.message);
    } finally {
      setGuardando(false);
    }
  };

  // Ecrã de carregamento
  if (carregando) return (
    <div className="min-h-screen bg-green-100 pt-24 flex items-center justify-center">
      <Header />
      <p className="text-green-700">A carregar definições...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-green-100 pt-24 pb-12">
      <Header />

      <div className="max-w-lg mx-auto px-4">

        {/* Botão voltar */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-green-700 hover:text-green-800 text-sm mb-5 transition"
        >
          <ArrowLeft size={16} /> Voltar
        </button>

        {/* ── Secção: Dados da conta ── */}
        <div className="bg-white border border-green-100 rounded-2xl shadow-sm p-6 mb-4">

          <h2 className="text-lg font-bold text-green-800 mb-5">Dados da Conta</h2>

          <div className="space-y-4">

            {/* Campo: Nome */}
            <div>
              <label className="text-gray-600 text-sm block mb-1">
                Nome <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="O teu nome completo"
                value={form.nome}
                onChange={atualizar("nome")}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>

            {/* Campo: Email */}
            <div>
              <label className="text-gray-600 text-sm block mb-1">Email</label>
              <input
                type="email"
                placeholder="exemplo@email.com"
                value={form.email}
                onChange={atualizar("email")}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>

            {/* Campo: Telefone */}
            <div>
              <label className="text-gray-600 text-sm block mb-1">Telefone</label>
              <input
                type="text"
                placeholder="Ex: 944000000"
                value={form.telefone}
                onChange={atualizar("telefone")}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>

          </div>
        </div>

        {/* ── Secção: Alterar senha ── */}
        <div className="bg-white border border-green-100 rounded-2xl shadow-sm p-6 mb-4">

          <h2 className="text-lg font-bold text-green-800 mb-1">Alterar Senha</h2>
          <p className="text-gray-400 text-xs mb-5">Deixa em branco se não quiseres alterar a senha.</p>

          <div className="space-y-4">

            {/* Campo: Senha actual */}
            <div>
              <label className="text-gray-600 text-sm block mb-1">Senha Actual</label>
              <div className="relative">
                <input
                  type={verSenhaAtual ? "text" : "password"}
                  placeholder="A tua senha actual"
                  value={senhaAtual}
                  onChange={(e) => setSenhaAtual(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                />
                {/* Botão para mostrar/esconder senha */}
                <button
                  type="button"
                  onClick={() => setVerSenhaAtual(!verSenhaAtual)}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                >
                  {verSenhaAtual ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Campo: Nova senha */}
            <div>
              <label className="text-gray-600 text-sm block mb-1">Nova Senha</label>
              <div className="relative">
                <input
                  type={verNovaSenha ? "text" : "password"}
                  placeholder="Mínimo 6 caracteres"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                />
                <button
                  type="button"
                  onClick={() => setVerNovaSenha(!verNovaSenha)}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                >
                  {verNovaSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Campo: Confirmar nova senha */}
            <div>
              <label className="text-gray-600 text-sm block mb-1">Confirmar Nova Senha</label>
              <input
                type="password"
                placeholder="Repete a nova senha"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>

          </div>
        </div>

        {/* ── Secção: Preferências ── */}
        <div className="bg-white border border-green-100 rounded-2xl shadow-sm p-6 mb-4">

          <h2 className="text-lg font-bold text-green-800 mb-4">Preferências</h2>

          {/* Toggle de notificações */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Notificações na plataforma</p>
              <p className="text-xs text-gray-400">Recebe alertas de propostas e actualizações</p>
            </div>
            {/* Switch visual — alterna entre activo e inactivo */}
            <button
              onClick={() => setNotificacoes(!notificacoes)}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                notificacoes ? 'bg-green-600' : 'bg-gray-300'
              }`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                notificacoes ? 'translate-x-5' : 'translate-x-0.5'
              }`} />
            </button>
          </div>

        </div>

        {/* Mensagem de erro */}
        {erro && (
          <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
            {erro}
          </p>
        )}

        {/* Mensagem de sucesso */}
        {sucesso && (
          <p className="text-green-700 text-sm bg-green-50 border border-green-200 rounded-xl p-3 mb-4">
            ✅ Definições guardadas com sucesso!
          </p>
        )}

        {/* Botões de acção */}
        <div className="flex gap-3">

          {/* Cancelar — volta sem guardar */}
          <button
            onClick={() => navigate(-1)}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl text-sm font-medium transition"
          >
            Cancelar
          </button>

          {/* Guardar — envia as alterações ao backend */}
          <button
            onClick={guardar}
            disabled={guardando}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white py-3 rounded-xl text-sm font-medium transition"
          >
            {guardando ? "A guardar..." : "Guardar Alterações"}
          </button>

        </div>
      </div>
    </div>
  );
}