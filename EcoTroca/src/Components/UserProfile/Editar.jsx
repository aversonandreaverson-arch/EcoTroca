import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { getPerfil, actualizarPerfil } from "../../api.js";
import Header from "./Header";

export default function Editar() {
  const navigate    = useNavigate();
  const [carregando, setCarregando] = useState(true);
  const [guardando,  setGuardando]  = useState(false);
  const [erro,       setErro]       = useState("");
  const [sucesso,    setSucesso]    = useState(false);

  const [form, setForm] = useState({
    nome:            "",
    data_nascimento: "",
    provincia:       "",
    municipio:       "",
    bairro:          "",
  });

  useEffect(() => {
    const carregar = async () => {
      try {
        const perfil = await getPerfil();
        setForm({
          nome:            perfil.nome            || "",
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

  const atualizar = (campo) => (e) =>
    setForm((prev) => ({ ...prev, [campo]: e.target.value }));

  const guardarPerfil = async () => {
    if (!form.nome.trim()) {
      setErro("O nome é obrigatório.");
      return;
    }
    try {
      setErro("");
      setSucesso(false);
      setGuardando(true);
      await actualizarPerfil(form);
      setSucesso(true);
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
      <p className="text-green-700">A carregar perfil...</p>
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

        <div className="bg-white border border-green-100 rounded-2xl shadow-sm p-6">

          <h2 className="text-xl font-bold text-green-800 mb-6">Editar Perfil</h2>

          <div className="space-y-4">

            <div>
              <label className="text-gray-600 text-sm block mb-1">Nome <span className="text-red-500">*</span></label>
              <input
                type="text"
                placeholder="O teu nome completo"
                value={form.nome}
                onChange={atualizar("nome")}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>

            <div>
              <label className="text-gray-600 text-sm block mb-1">Data de Nascimento</label>
              <input
                type="date"
                value={form.data_nascimento}
                onChange={atualizar("data_nascimento")}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>

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

          {erro && (
            <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-xl p-3 mt-4">{erro}</p>
          )}
          {sucesso && (
            <p className="text-green-700 text-sm bg-green-50 border border-green-200 rounded-xl p-3 mt-4">
              ✅ Perfil actualizado com sucesso!
            </p>
          )}

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => navigate(-1)}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl text-sm font-medium transition"
            >
              Cancelar
            </button>
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