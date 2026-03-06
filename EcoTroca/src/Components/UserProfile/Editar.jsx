
//  Fluxo:
//    1. Carrega dados actuais via GET /api/usuarios/perfil
//    2. Utilizador edita os campos
//    3. Submete via PUT /api/usuarios/perfil
//    4. Mostra mensagem de sucesso ou erro

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { getPerfil, actualizarPerfil } from "../../api.js";
import Header from "./Header";

export default function Editar() {
  const navigate = useNavigate();

  // Estado de carregamento inicial dos dados do perfil
  const [carregando, setCarregando] = useState(true);

  // Estado durante o envio do formulário
  const [guardando, setGuardando] = useState(false);

  // Mensagens de feedback para o utilizador
  const [erro,    setErro]    = useState("");
  const [sucesso, setSucesso] = useState(false);

  // Dados do formulário — preenchidos com os dados actuais do perfil
  const [form, setForm] = useState({
    nome:            "",
    data_nascimento: "",
    provincia:       "",
    municipio:       "",
    bairro:          "",
  });

  // Carrego os dados actuais do perfil ao abrir a página
  useEffect(() => {
    const carregar = async () => {
      try {
        const perfil = await getPerfil(); // GET /api/usuarios/perfil
        setForm({
          nome:            perfil.nome            || "",
          // Converto a data para formato "YYYY-MM-DD" que o input type=date exige
          data_nascimento: perfil.data_nascimento
            ? perfil.data_nascimento.split("T")[0]
            : "",
          provincia: perfil.provincia || "",
          municipio: perfil.municipio || "",
          bairro:    perfil.bairro    || "",
        });
      } catch (err) {
        setErro("Erro ao carregar perfil: " + err.message);
      } finally {
        setCarregando(false);
      }
    };
    carregar();
  }, []);

  // Função auxiliar para actualizar um campo do formulário
  // Uso currying para evitar repetir onChange em cada input
  const atualizar = (campo) => (e) =>
    setForm((prev) => ({ ...prev, [campo]: e.target.value }));

  // Submete as alterações ao backend
  const guardarPerfil = async () => {
    // Validação básica — nome é obrigatório
    if (!form.nome.trim()) {
      setErro("O nome é obrigatório.");
      return;
    }
    try {
      setErro("");
      setSucesso(false);
      setGuardando(true);

      // PUT /api/usuarios/perfil — envia os dados actualizados
      await actualizarPerfil(form);

      setSucesso(true);
      // Remove a mensagem de sucesso após 3 segundos
      setTimeout(() => setSucesso(false), 3000);
    } catch (err) {
      setErro(err.message);
    } finally {
      setGuardando(false);
    }
  };

  // Ecrã de carregamento enquanto os dados chegam do backend
  if (carregando) return (
    <div className="min-h-screen bg-green-100 pt-24 flex items-center justify-center">
      <Header />
      <p className="text-green-700">A carregar perfil...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-green-100 pt-24 pb-12">
      <Header />

      <div className="max-w-lg mx-auto px-4">

        {/* Botão voltar à página anterior */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-green-700 hover:text-green-800 text-sm mb-5 transition"
        >
          <ArrowLeft size={16} /> Voltar
        </button>

        <div className="bg-white border border-green-100 rounded-2xl shadow-sm p-6">

          <h2 className="text-xl font-bold text-green-800 mb-6">Editar Perfil</h2>

          <div className="space-y-4">

            {/* Campo: Nome completo */}
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

            {/* Campo: Data de nascimento */}
            <div>
              <label className="text-gray-600 text-sm block mb-1">Data de Nascimento</label>
              <input
                type="date"
                value={form.data_nascimento}
                onChange={atualizar("data_nascimento")}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>

            {/* Campo: Província */}
            <div>
              <label className="text-gray-600 text-sm block mb-1">Província</label>
              <input
                type="text"
                placeholder="Ex: Luanda"
                value={form.provincia}
                onChange={atualizar("provincia")}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>

            {/* Campo: Município */}
            <div>
              <label className="text-gray-600 text-sm block mb-1">Município</label>
              <input
                type="text"
                placeholder="Ex: Ingombota"
                value={form.municipio}
                onChange={atualizar("municipio")}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>

            {/* Campo: Bairro */}
            <div>
              <label className="text-gray-600 text-sm block mb-1">Bairro</label>
              <input
                type="text"
                placeholder="Ex: Maianga"
                value={form.bairro}
                onChange={atualizar("bairro")}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>

          </div>

          {/* Mensagem de erro */}
          {erro && (
            <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-xl p-3 mt-4">
              {erro}
            </p>
          )}

          {/* Mensagem de sucesso */}
          {sucesso && (
            <p className="text-green-700 text-sm bg-green-50 border border-green-200 rounded-xl p-3 mt-4">
              ✅ Perfil actualizado com sucesso!
            </p>
          )}

          {/* Botões de acção */}
          <div className="flex gap-3 mt-6">

            {/* Cancelar — volta sem guardar */}
            <button
              onClick={() => navigate(-1)}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl text-sm font-medium transition"
            >
              Cancelar
            </button>

            {/* Guardar — envia as alterações ao backend */}
            <button
              onClick={guardarPerfil}
              disabled={guardando}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white py-3 rounded-xl text-sm font-medium transition"
            >
              {guardando ? "A guardar..." : "Guardar Alterações"}
            </button>

          </div>

        </div>
      </div>
    </div>
  );
}