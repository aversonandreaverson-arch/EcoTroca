import React, { useState, useEffect } from "react";
import Header from "./Header";
import { getPerfil, actualizarPerfil } from "../../api.js";

export default function EditarColetador() {
  const [carregando, setCarregando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);

  const [form, setForm] = useState({
    nome: "",
    data_nascimento: "",
    provincia: "",
    municipio: "",
    bairro: "",
  });

  useEffect(() => {
    getPerfil()
      .then((perfil) => {
        setForm({
          nome: perfil.nome || "",
          data_nascimento: perfil.data_nascimento?.split("T")[0] || "",
          provincia: perfil.provincia || "",
          municipio: perfil.municipio || "",
          bairro: perfil.bairro || "",
        });
      })
      .catch((err) => setErro(err.message))
      .finally(() => setCarregando(false));
  }, []);

  const atualizar = (campo) => (e) =>
    setForm((prev) => ({ ...prev, [campo]: e.target.value }));

  const guardar = async () => {
    try {
      setErro("");
      setSucesso(false);
      setGuardando(true);
      await actualizarPerfil(form); // PUT /api/usuarios/perfil
      setSucesso(true);
      setTimeout(() => setSucesso(false), 3000);
    } catch (err) {
      setErro(err.message);
    } finally {
      setGuardando(false);
    }
  };

  if (carregando) return (
    <div className="min-h-screen bg-green-700 pt-24 flex items-center justify-center">
      <Header />
      <p className="text-white">A carregar...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-green-700 pt-24 p-6">
      <Header />

      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6 text-green-700">Editar Perfil</h2>

        <div className="space-y-4">
          {[
            { label: "Nome completo", campo: "nome", type: "text" },
            { label: "Data de nascimento", campo: "data_nascimento", type: "date" },
            { label: "Província", campo: "provincia", type: "text" },
            { label: "Município", campo: "municipio", type: "text" },
            { label: "Bairro", campo: "bairro", type: "text" },
          ].map(({ label, campo, type }) => (
            <div key={campo}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input
                type={type}
                value={form[campo]}
                onChange={atualizar(campo)}
                className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          ))}
        </div>

        {erro && (
          <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3 mt-4">{erro}</p>
        )}
        {sucesso && (
          <p className="text-green-700 text-sm bg-green-50 border border-green-200 rounded-lg p-3 mt-4">
            ✅ Perfil atualizado com sucesso!
          </p>
        )}

        <button
          onClick={guardar}
          disabled={guardando}
          className="w-full mt-6 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white py-3 rounded-xl font-semibold transition"
        >
          {guardando ? "A guardar..." : "Guardar Alterações"}
        </button>
      </div>
    </div>
  );
}