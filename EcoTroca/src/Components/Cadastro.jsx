import React, { useState } from "react";
import { User, Truck, Building2, ChevronDown } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { registar } from "../api.js";

// ── Provincias e municipios disponiveis ──────────────────────
// Por agora so Luanda e Icolo e Bengo — expandir quando necessario
const PROVINCIAS_MUNICIPIOS = {
  "Luanda": [
    "Luanda", "Viana", "Cacuaco", "Cazenga", "Belas",
    "Icolo e Bengo", "Quilamba Quiaxi"
  ],
  "Icolo e Bengo": [
    "Catete", "Calumbo", "Cassoneca", "Mucari", "Ngangula"
  ],
};

// Lista de provincias para o primeiro dropdown
const PROVINCIAS = Object.keys(PROVINCIAS_MUNICIPIOS);

// ── Validacoes ───────────────────────────────────────────────
const validarNome = (nome) => {
  if (!nome.trim()) return "Nome e obrigatorio.";
  if (nome.trim().length < 3) return "Nome deve ter pelo menos 3 caracteres.";
  if (!/^[a-zA-ZA-y\s]+$/.test(nome)) return "Nome nao pode conter numeros ou caracteres especiais.";
  return null;
};

const validarTelefone = (tel) => {
  const limpo = tel.replace(/\s/g, "");
  if (!limpo) return "Telefone e obrigatorio.";
  if (!/^[9][0-9]{8}$/.test(limpo)) return "Telefone invalido. Deve ter 9 digitos e comecar por 9.";
  return null;
};

const validarEmail = (email) => {
  if (!email) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? null : "Email invalido.";
};

const validarBI = (bi) => {
  if (!bi) return null;
  if (!/^[0-9]{9}[A-Z]{2}[0-9]{3}$/.test(bi.toUpperCase())) return "BI invalido. Formato: 000000000LA000";
  return null;
};

const validarDataNascimento = (data) => {
  if (!data) return "Data de nascimento e obrigatoria.";
  const nascimento = new Date(data);
  const hoje = new Date();
  const idade = hoje.getFullYear() - nascimento.getFullYear();
  const aniversarioPassou =
    hoje.getMonth() > nascimento.getMonth() ||
    (hoje.getMonth() === nascimento.getMonth() && hoje.getDate() >= nascimento.getDate());
  const idadeReal = aniversarioPassou ? idade : idade - 1;
  if (idadeReal < 18) return "Tens de ter pelo menos 18 anos para te registar.";
  if (idadeReal > 100) return "Data de nascimento invalida.";
  return null;
};

const validarSenha = (senha) => {
  if (!senha) return "Senha e obrigatoria.";
  if (senha.length < 6) return "A senha deve ter pelo menos 6 caracteres.";
  if (!/[A-Z]/.test(senha)) return "A senha deve ter pelo menos uma letra maiuscula.";
  if (!/[0-9]/.test(senha)) return "A senha deve ter pelo menos um numero.";
  return null;
};

// ── Card de tipo de conta ────────────────────────────────────
const Tipo = ({ ativo, onClick, Icon, label }) => (
  <div onClick={onClick}
    className={`cursor-pointer border rounded-xl p-4 flex flex-col items-center transition ${
      ativo ? "bg-green-800 text-white border-green-800" : "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200"
    }`}>
    <Icon className="mb-2 w-6 h-6 sm:w-8 sm:h-8" />
    <span className="text-sm sm:text-base font-medium">{label}</span>
  </div>
);

// ── Input generico ───────────────────────────────────────────
const Campo = ({ label, obrigatorio, type = "text", hint, value, onChange, erro }) => (
  <div className="flex flex-col">
    <label className="text-green-700 mb-1 text-sm sm:text-base">
      {label} {obrigatorio && <span className="text-red-500">*</span>}
    </label>
    <input type={type} placeholder={hint || ""} value={value} onChange={onChange}
      className={`border rounded-md p-2 focus:outline-none focus:ring-2 text-sm sm:text-base w-full ${
        erro ? "border-red-400 focus:ring-red-400" : "focus:ring-green-500"
      }`} />
    {erro && <p className="text-red-500 text-xs mt-1">{erro}</p>}
  </div>
);

// ── Dropdown generico ────────────────────────────────────────
// Substituicao dos inputs de texto para provincia e municipio
const Dropdown = ({ label, obrigatorio, value, onChange, opcoes, placeholder, erro, disabled }) => (
  <div className="flex flex-col">
    <label className="text-green-700 mb-1 text-sm sm:text-base">
      {label} {obrigatorio && <span className="text-red-500">*</span>}
    </label>
    <div className="relative">
      <select value={value} onChange={onChange} disabled={disabled}
        className={`w-full border rounded-md p-2 pr-8 focus:outline-none focus:ring-2 text-sm sm:text-base appearance-none bg-white ${
          disabled ? "bg-gray-100 text-gray-400 cursor-not-allowed" : ""
        } ${erro ? "border-red-400 focus:ring-red-400" : "focus:ring-green-500"}`}>
        <option value="">{placeholder || "Seleccionar..."}</option>
        {opcoes.map(op => (
          <option key={op} value={op}>{op}</option>
        ))}
      </select>
      {/* Icone de seta no dropdown */}
      <ChevronDown size={16} className="absolute right-2 top-3 text-gray-400 pointer-events-none" />
    </div>
    {erro && <p className="text-red-500 text-xs mt-1">{erro}</p>}
  </div>
);

// ── Componente principal ─────────────────────────────────────
const Cadastro = () => {
  const navigate = useNavigate();
  const [tipo,       setTipo]       = useState("comum");
  const [erro,       setErro]       = useState("");
  const [erros,      setErros]      = useState({});
  const [carregando, setCarregando] = useState(false);

  const [form, setForm] = useState({
    nome: "", telefone: "", provincia: "", municipio: "",
    bairro: "", bi: "", data_nascimento: "",
    horario_abertura: "", horario_fechamento: "",
    email: "", senha: "", confirmar_senha: "",
  });

  // Actualiza campo e limpa o erro correspondente
  const atualizar = (campo) => (e) => {
    const valor = e.target.value;
    setForm(prev => {
      const novo = { ...prev, [campo]: valor };
      // Quando muda a provincia, limpa o municipio
      // para nao ficar municipio de outra provincia seleccionado
      if (campo === "provincia") novo.municipio = "";
      return novo;
    });
    setErros(prev => ({ ...prev, [campo]: null }));
  };

  // Municipios disponiveis para a provincia seleccionada
  // Se nenhuma provincia seleccionada, lista vazia — municipio fica desactivado
  const municipiosDisponiveis = form.provincia
    ? (PROVINCIAS_MUNICIPIOS[form.provincia] || [])
    : [];

  const validarTudo = () => {
    const e = {};
    e.nome     = validarNome(form.nome);
    e.telefone = validarTelefone(form.telefone);
    e.email    = validarEmail(form.email);
    e.senha    = validarSenha(form.senha);
    if (!form.provincia) e.provincia = "Provincia e obrigatoria.";
    if (!form.municipio) e.municipio = "Municipio e obrigatorio.";
    if (!form.bairro.trim()) e.bairro = "Bairro e obrigatorio.";
    if (!form.confirmar_senha) {
      e.confirmar_senha = "Confirma a tua senha.";
    } else if (form.senha !== form.confirmar_senha) {
      e.confirmar_senha = "As senhas nao coincidem.";
    }
    if (tipo !== "empresa") {
      e.bi              = validarBI(form.bi);
      e.data_nascimento = validarDataNascimento(form.data_nascimento);
    }
    if (tipo === "empresa") {
      if (!form.horario_abertura)   e.horario_abertura   = "Horario de abertura e obrigatorio.";
      if (!form.horario_fechamento) e.horario_fechamento = "Horario de fechamento e obrigatorio.";
    }
    const filtrado = Object.fromEntries(Object.entries(e).filter(([, v]) => v));
    setErros(filtrado);
    return Object.keys(filtrado).length === 0;
  };

  const handleCriarConta = async () => {
    setErro("");
    if (!validarTudo()) { setErro("Corrige os erros indicados antes de continuar."); return; }
    try {
      setCarregando(true);
      const dados = {
        nome:         form.nome.trim(),
        telefone:     form.telefone.replace(/\s/g, ""),
        provincia:    form.provincia,
        municipio:    form.municipio,
        bairro:       form.bairro.trim(),
        email:        form.email.trim() || null,
        senha:        form.senha,
        tipo_usuario: tipo,
        ...(tipo !== "empresa" && {
          bi:              form.bi.toUpperCase() || null,
          data_nascimento: form.data_nascimento,
        }),
        ...(tipo === "empresa" && {
          horario_abertura:   form.horario_abertura,
          horario_fechamento: form.horario_fechamento,
        }),
      };
      const resultado = await registar(dados);
      if (resultado.tipo_usuario === "coletor")      navigate("/ColetadorDashboard");
      else if (resultado.tipo_usuario === "empresa") navigate("/DashboardEmpresa");
      else                                           navigate("/PaginaInicial");
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div id="Cadastro" className="w-full flex justify-center py-12 bg-green-900">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-6 sm:p-8">

        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-green-900">Cadastre-se</h1>
          <p className="mt-2 text-sm text-gray-600">Cadastro gratis para usuarios, coletadores e empresas.</p>
        </div>

        {/* Seleccao do tipo de conta */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Tipo ativo={tipo === "comum"}   onClick={() => setTipo("comum")}   Icon={User}      label="Usuario" />
          <Tipo ativo={tipo === "coletor"} onClick={() => setTipo("coletor")} Icon={Truck}     label="Coletador" />
          <Tipo ativo={tipo === "empresa"} onClick={() => setTipo("empresa")} Icon={Building2} label="Empresa" />
        </div>

        <div className="space-y-4">
          <Campo label={tipo === "empresa" ? "Nome da empresa" : "Nome completo"} obrigatorio
            value={form.nome} onChange={atualizar("nome")} erro={erros.nome} />

          <Campo label="Telefone" obrigatorio value={form.telefone} onChange={atualizar("telefone")}
            hint="Ex: 923456789" erro={erros.telefone} />

          {/* Provincia e Municipio — dropdowns em vez de texto livre */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Dropdown de provincia — so Luanda e Icolo e Bengo */}
            <Dropdown
              label="Provincia" obrigatorio
              value={form.provincia}
              onChange={atualizar("provincia")}
              opcoes={PROVINCIAS}
              placeholder="Seleccionar provincia"
              erro={erros.provincia}
            />
            {/* Dropdown de municipio — depende da provincia seleccionada */}
            {/* Fica desactivado ate a provincia estar seleccionada */}
            <Dropdown
              label="Municipio" obrigatorio
              value={form.municipio}
              onChange={atualizar("municipio")}
              opcoes={municipiosDisponiveis}
              placeholder={form.provincia ? "Seleccionar municipio" : "Primeiro selecciona a provincia"}
              erro={erros.municipio}
              disabled={!form.provincia}
            />
          </div>

          <Campo label="Bairro" obrigatorio value={form.bairro} onChange={atualizar("bairro")} erro={erros.bairro} />

          {tipo !== "empresa" && (
            <>
              <Campo label="BI (opcional)" value={form.bi} onChange={atualizar("bi")}
                hint="Ex: 000000000LA000" erro={erros.bi} />
              <Campo label="Data de nascimento" type="date" obrigatorio
                value={form.data_nascimento} onChange={atualizar("data_nascimento")} erro={erros.data_nascimento} />
            </>
          )}

          {tipo === "empresa" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Campo label="Horario de abertura"   type="time" obrigatorio
                value={form.horario_abertura}   onChange={atualizar("horario_abertura")}   erro={erros.horario_abertura} />
              <Campo label="Horario de fechamento" type="time" obrigatorio
                value={form.horario_fechamento} onChange={atualizar("horario_fechamento")} erro={erros.horario_fechamento} />
            </div>
          )}

          <Campo label="Email (opcional)" type="email" value={form.email} onChange={atualizar("email")}
            hint="Ex: nome@email.com" erro={erros.email} />
          <Campo label="Senha" type="password" obrigatorio value={form.senha} onChange={atualizar("senha")}
            hint="Minimo 6 caracteres, 1 maiuscula e 1 numero" erro={erros.senha} />
          <Campo label="Confirmar senha" type="password" obrigatorio
            value={form.confirmar_senha} onChange={atualizar("confirmar_senha")} erro={erros.confirmar_senha} />
        </div>

        {erro && (
          <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3 mt-4">{erro}</p>
        )}

        <button onClick={handleCriarConta} disabled={carregando}
          className="w-full mt-6 bg-green-800 hover:bg-green-700 text-white py-3 rounded-xl font-semibold text-base disabled:opacity-60 disabled:cursor-not-allowed transition">
          {carregando ? "A criar conta..." : "Criar conta"}
        </button>

        <p className="text-xs sm:text-sm text-center mt-4 text-gray-600">
          Ja tens uma conta?{" "}
          <Link to="/Login" className="font-semibold text-green-800 hover:underline">Entrar</Link>
        </p>
        <p className="text-xs text-center mt-2 text-gray-400">
          Contas administrativas sao criadas apenas internamente.
        </p>
      </div>
    </div>
  );
};

export default Cadastro;