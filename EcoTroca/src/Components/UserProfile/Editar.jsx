//  Fluxo:
//    1. Carrega dados actuais via GET /api/usuarios/perfil
//    2. Utilizador edita os campos
//    3. Submete via PUT /api/usuarios/perfil
//    4. Mostra mensagem de sucesso ou erro

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, MapPin, Calendar, CheckCircle } from "lucide-react";
import { getPerfil, actualizarPerfil } from "../../api.js";
import Header from "./Header";

const PROVINCIAS_MUNICIPIOS = {
  "Luanda": ["Luanda", "Viana", "Cacuaco", "Cazenga", "Belas", "Icolo e Bengo", "Quilamba Quiaxi"],
  "Icolo e Bengo": ["Catete", "Calumbo", "Cassoneca", "Mucari", "Ngangula"],
};

export default function Editar() {
  const navigate = useNavigate();

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
            ? perfil.data_nascimento.split("T")[0] : "",
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

  const atualizar = (campo) => (e) => {
    const valor = e.target.value;
    setForm(prev => {
      const novo = { ...prev, [campo]: valor };
      if (campo === "provincia") novo.municipio = "";
      return novo;
    });
  };

  const municipiosDisponiveis = PROVINCIAS_MUNICIPIOS[form.provincia] || [];

  const guardarPerfil = async () => {
    if (!form.nome.trim()) { setErro("O nome e obrigatorio."); return; }
    try {
      setErro("");
      setSucesso(false);
      setGuardando(true);
      await actualizarPerfil(form);
      setSucesso(true);
      setTimeout(() => { setSucesso(false); navigate("/Perfil"); }, 2000);
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

        <div className="bg-white border border-green-100 rounded-2xl shadow-sm p-6">

          <h2 className="text-xl font-bold text-green-800 mb-6 flex items-center gap-2">
            <User size={20} /> Editar Perfil
          </h2>

          <div className="space-y-4">

            {/* Nome */}
            <div>
              <label className="text-gray-600 text-sm font-medium block mb-1">
                Nome completo <span className="text-red-500">*</span>
              </label>
              <input type="text" value={form.nome} onChange={atualizar("nome")}
                placeholder="O teu nome completo"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
            </div>

            {/* Data de nascimento */}
            <div>
              <label className="text-gray-600 text-sm font-medium block mb-1 flex items-center gap-1">
                <Calendar size={13} /> Data de Nascimento
              </label>
              <input type="date" value={form.data_nascimento}
                onChange={atualizar("data_nascimento")}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
            </div>

            {/* Provincia */}
            <div>
              <label className="text-gray-600 text-sm font-medium block mb-1 flex items-center gap-1">
                <MapPin size={13} /> Provincia
              </label>
              <select value={form.provincia} onChange={atualizar("provincia")}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white">
                <option value="">Seleccionar provincia...</option>
                {Object.keys(PROVINCIAS_MUNICIPIOS).map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Municipio */}
            <div>
              <label className="text-gray-600 text-sm font-medium block mb-1">Municipio</label>
              <select value={form.municipio} onChange={atualizar("municipio")}
                disabled={!form.provincia}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white disabled:bg-gray-50 disabled:text-gray-400">
                <option value="">
                  {form.provincia ? "Seleccionar municipio..." : "Primeiro selecciona a provincia"}
                </option>
                {municipiosDisponiveis.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {/* Bairro */}
            <div>
              <label className="text-gray-600 text-sm font-medium block mb-1">Bairro</label>
              <input type="text" value={form.bairro} onChange={atualizar("bairro")}
                placeholder="Ex: Maianga"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
            </div>

          </div>

          {/* Erro */}
          {erro && (
            <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-xl p-3 mt-4">
              {erro}
            </p>
          )}

          {/* Sucesso */}
          {sucesso && (
            <div className="flex items-center gap-2 text-green-700 text-sm bg-green-50 border border-green-200 rounded-xl p-3 mt-4">
              <CheckCircle size={16} /> Perfil actualizado com sucesso!
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button onClick={() => navigate(-1)}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl text-sm font-medium transition">
              Cancelar
            </button>
            <button onClick={guardarPerfil} disabled={guardando}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white py-3 rounded-xl text-sm font-medium transition">
              {guardando ? "A guardar..." : "Guardar Alteracoes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}