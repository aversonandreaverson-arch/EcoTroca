import React, { useState, useEffect } from "react";
import { getPerfil, actualizarPerfil } from "../../api.js";

export default function Editar() {
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

  // Carrega os dados atuais do perfil ao entrar na página
  useEffect(() => {
    const carregar = async () => {
      try {
        const perfil = await getPerfil(); // GET /api/usuarios/perfil
        setForm({
          nome: perfil.nome || "",
          data_nascimento: perfil.data_nascimento
            ? perfil.data_nascimento.split("T")[0] // formata para "YYYY-MM-DD"
            : "",
          provincia: perfil.provincia || "",
          municipio: perfil.municipio || "",
          bairro: perfil.bairro || "",
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
    try {
      setErro("");
      setSucesso(false);
      setGuardando(true);

      // Envia para o backend — PUT /api/usuarios/perfil
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

  if (carregando) {
    return (
      <div className="p-6 text-center text-gray-500">A carregar perfil...</div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-xl shadow-md max-w-2xl mx-auto">

      <h2 className="text-2xl font-bold mb-6 text-green-700">Editar Perfil</h2>

      {/* Nome */}
      <input
        type="text"
        placeholder="Nome"
        value={form.nome}
        onChange={atualizar("nome")}
        className="w-full border p-2 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-green-500"
      />

      {/* Data de Nascimento */}
      <input
        type="date"
        value={form.data_nascimento}
        onChange={atualizar("data_nascimento")}
        className="w-full border p-2 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-green-500"
      />

      {/* Província */}
      <input
        type="text"
        placeholder="Província"
        value={form.provincia}
        onChange={atualizar("provincia")}
        className="w-full border p-2 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-green-500"
      />

      {/* Município */}
      <input
        type="text"
        placeholder="Município"
        value={form.municipio}
        onChange={atualizar("municipio")}
        className="w-full border p-2 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-green-500"
      />

      {/* Bairro */}
      <input
        type="text"
        placeholder="Bairro"
        value={form.bairro}
        onChange={atualizar("bairro")}
        className="w-full border p-2 rounded mb-6 focus:outline-none focus:ring-2 focus:ring-green-500"
      />

      {/* Mensagens de feedback */}
      {erro && (
        <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          {erro}
        </p>
      )}
      {sucesso && (
        <p className="text-green-700 text-sm bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
          ✅ Perfil atualizado com sucesso!
        </p>
      )}

      {/* Botão */}
      <button
        onClick={guardarPerfil}
        disabled={guardando}
        className="bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white px-4 py-2 rounded transition"
      >
        {guardando ? "A guardar..." : "Guardar Alterações"}
      </button>
    </div>
  );
}