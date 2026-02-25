import React, { useState } from "react";
import { User, Truck, Building2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { registar } from "../api.js"; // importa função de registo

// Card clicável para escolher o tipo de utilizador
const Tipo = ({ ativo, onClick, icon: Icon, label }) => (
  <div
    onClick={onClick}
    className={`cursor-pointer border rounded-xl p-4 flex flex-col items-center
      ${ativo ? "bg-green-800 text-white" : "bg-gray-100 text-gray-800"}
    `}
  >
    <Icon className="mb-2 w-6 h-6 sm:w-8 sm:h-8" />
    <span className="text-sm sm:text-base font-medium">{label}</span>
  </div>
);

// Campo de formulário reutilizável
const Campo = ({ label, obrigatório, type = "text", hint, value, onChange }) => (
  <div className="flex flex-col">
    <label className="text-green-700 mb-1 text-sm sm:text-base">
      {label} {obrigatório && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      placeholder={hint || ""}
      value={value}
      onChange={onChange}
      className="border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm sm:text-base w-full"
    />
  </div>
);

const Cadastro = () => {
  const navigate = useNavigate();
  const [tipo, setTipo] = useState("comum"); // tipo de utilizador
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  // Estado do formulário — todos os campos num só objeto
  const [form, setForm] = useState({
    nome: "",
    telefone: "",
    provincia: "",
    municipio: "",
    bairro: "",
    bi: "",
    data_nascimento: "",
    horario_abertura: "",
    horario_fechamento: "",
    email: "",
    senha: "",
    confirmar_senha: "",
  });

  // Atualiza um campo específico sem perder os outros
  const atualizar = (campo) => (e) =>
    setForm((prev) => ({ ...prev, [campo]: e.target.value }));

  const handleCriarConta = async () => {
    // Validações básicas
    if (!form.nome || !form.telefone || !form.senha) {
      setErro("Preencha todos os campos obrigatórios.");
      return;
    }
    if (form.senha !== form.confirmar_senha) {
      setErro("As senhas não coincidem.");
      return;
    }
    if (form.senha.length < 6) {
      setErro("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    try {
      setErro("");
      setCarregando(true);

      // Prepara os dados para enviar ao backend
      const dados = {
        nome: form.nome,
        telefone: form.telefone,
        provincia: form.provincia,
        municipio: form.municipio,
        bairro: form.bairro,
        email: form.email,
        senha: form.senha,
        tipo_usuario: tipo, // "comum", "coletor" ou "empresa"
        ...(tipo !== "empresa" && {
          bi: form.bi,
          data_nascimento: form.data_nascimento,
        }),
        ...(tipo === "empresa" && {
          horario_abertura: form.horario_abertura,
          horario_fechamento: form.horario_fechamento,
        }),
      };

      // Chama o backend — POST /api/auth/registar
      await registar(dados);

      // Redireciona conforme o tipo
      if (tipo === "coletor") {
        navigate("/ColetadorProfile");
      } else if (tipo === "empresa") {
        navigate("/EmpresaProfile");
      } else {
        navigate("/PaginaInicial");
      }
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div id="Cadastro" className="w-full flex justify-center py-12 bg-green-900">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-6 sm:p-8">

        {/* Título */}
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-green-900">Cadastre-se</h1>
          <p className="mt-2 text-sm text-gray-600">
            Cadastro grátis para usuários, coletadores e empresas.
          </p>
        </div>

        {/* Tipo de utilizador */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Tipo ativo={tipo === "comum"} onClick={() => setTipo("comum")} icon={User} label="Usuário" />
          <Tipo ativo={tipo === "coletor"} onClick={() => setTipo("coletor")} icon={Truck} label="Coletador(a)" />
          <Tipo ativo={tipo === "empresa"} onClick={() => setTipo("empresa")} icon={Building2} label="Empresa" />
        </div>

        {/* Formulário */}
        <div className="space-y-4">
          <Campo label={tipo === "empresa" ? "Nome da empresa" : "Nome completo"} obrigatório value={form.nome} onChange={atualizar("nome")} />
          <Campo label="Telefone" obrigatório value={form.telefone} onChange={atualizar("telefone")} hint="Ex: 923 456 789" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Campo label="Província" obrigatório value={form.provincia} onChange={atualizar("provincia")} />
            <Campo label="Município" obrigatório value={form.municipio} onChange={atualizar("municipio")} />
          </div>

          <Campo label="Bairro" obrigatório value={form.bairro} onChange={atualizar("bairro")} />

          {tipo !== "empresa" && (
            <>
              <Campo label="BI" value={form.bi} onChange={atualizar("bi")} />
              <Campo label="Data de nascimento" type="date" obrigatório hint="+18 anos" value={form.data_nascimento} onChange={atualizar("data_nascimento")} />
            </>
          )}

          {tipo === "empresa" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Campo label="Horário de abertura" type="time" obrigatório value={form.horario_abertura} onChange={atualizar("horario_abertura")} />
              <Campo label="Horário de fechamento" type="time" obrigatório value={form.horario_fechamento} onChange={atualizar("horario_fechamento")} />
            </div>
          )}

          <Campo label="Email" type="email" value={form.email} onChange={atualizar("email")} />
          <Campo label="Senha" type="password" obrigatório value={form.senha} onChange={atualizar("senha")} />
          <Campo label="Confirmar senha" type="password" obrigatório value={form.confirmar_senha} onChange={atualizar("confirmar_senha")} />
        </div>

        {/* Mensagem de erro */}
        {erro && (
          <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
            {erro}
          </p>
        )}

        {/* Botão */}
        <button
          onClick={handleCriarConta}
          disabled={carregando}
          className="w-full mt-6 bg-green-800 text-white py-3 rounded-xl font-semibold text-base disabled:opacity-60 disabled:cursor-not-allowed transition"
        >
          {carregando ? "A criar conta..." : "Criar conta"}
        </button>

        <p className="text-xs sm:text-sm text-center mt-4 text-gray-600">
          Já tens uma conta?{" "}
          <Link to="/Login" className="font-semibold text-green-800 hover:underline">
            Entrar
          </Link>
        </p>

        <p className="text-xs text-center mt-2 text-gray-400">
          Contas administrativas são criadas apenas internamente.
        </p>
      </div>
    </div>
  );
};

export default Cadastro;
