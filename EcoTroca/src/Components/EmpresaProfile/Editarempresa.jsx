// ============================================================
//  EditarEmpresa.jsx
//  Página de edição do perfil da empresa
//  Campos: nome, contactos, localização, horário, resíduos aceites
// ============================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header.jsx';
import { getPerfilEmpresa, atualizarEmpresa } from '../../api.js';

export default function EditarEmpresa() {
  const navigate = useNavigate();

  // Controla o estado do formulário
  const [form, setForm] = useState({
    nome:               '',
    telefone:           '',
    email:              '',
    endereco:           '',
    provincia:          '',
    municipio:          '',
    bairro:             '',
    descricao:          '',
    horario_abertura:   '',
    horario_fechamento: '',
    site:               '',
    residuos_aceites:   '',
  });

  const [idEmpresa, setIdEmpresa]   = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [guardando, setGuardando]   = useState(false);
  const [erro, setErro]             = useState('');
  const [sucesso, setSucesso]       = useState(false);

  // Carrega os dados atuais da empresa ao abrir a página
  useEffect(() => {
    getPerfilEmpresa()
      .then((perfil) => {
        setIdEmpresa(perfil.id_empresa);
        setForm({
          nome:               perfil.nome               || '',
          telefone:           perfil.telefone           || '',
          email:              perfil.email              || '',
          endereco:           perfil.endereco           || '',
          provincia:          perfil.provincia          || '',
          municipio:          perfil.municipio          || '',
          bairro:             perfil.bairro             || '',
          descricao:          perfil.descricao          || '',
          horario_abertura:   perfil.horario_abertura   || '',
          horario_fechamento: perfil.horario_fechamento || '',
          site:               perfil.site               || '',
          residuos_aceites:   perfil.residuos_aceites   || '',
        });
      })
      .catch(err => setErro(err.message))
      .finally(() => setCarregando(false));
  }, []);

  // Atualiza um campo específico sem apagar os outros
  const atualizar = (campo) => (e) =>
    setForm(prev => ({ ...prev, [campo]: e.target.value }));

  // Envia os dados atualizados ao backend
  const guardar = async () => {
    setErro('');
    setSucesso(false);

    // Validações básicas
    if (!form.nome.trim())     return setErro('O nome da empresa é obrigatório.');
    if (!form.telefone.trim()) return setErro('O telefone é obrigatório.');

    try {
      setGuardando(true);
      await atualizarEmpresa(form);
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
      <p className="text-white text-lg">A carregar...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-green-700 pt-24 p-6">
      <Header />

      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-md p-6">
        <h2 className="text-2xl font-bold text-green-700 mb-6">Editar Perfil da Empresa</h2>

        <div className="space-y-5">

          {/* ── Secção: Identificação ── */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Identificação
            </p>
            <div className="space-y-3">

              {/* Nome da empresa */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da empresa <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={atualizar('nome')}
                  className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  value={form.descricao}
                  onChange={atualizar('descricao')}
                  rows={3}
                  placeholder="Descreve a tua empresa, missão, serviços..."
                  className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                />
              </div>
            </div>
          </div>

          {/* ── Secção: Contactos ── */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Contactos
            </p>
            <div className="space-y-3">

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.telefone}
                    onChange={atualizar('telefone')}
                    placeholder="Ex: 923456789"
                    className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={atualizar('email')}
                    placeholder="Ex: empresa@email.com"
                    className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              {/* Website */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <input
                  type="text"
                  value={form.site}
                  onChange={atualizar('site')}
                  placeholder="Ex: https://www.empresa.ao"
                  className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </div>

          {/* ── Secção: Localização ── */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Localização
            </p>
            <div className="space-y-3">

              {/* Endereço */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                <input
                  type="text"
                  value={form.endereco}
                  onChange={atualizar('endereco')}
                  placeholder="Ex: Rua da Missão, nº 45"
                  className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
                  <input
                    type="text"
                    value={form.bairro}
                    onChange={atualizar('bairro')}
                    className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Município</label>
                  <input
                    type="text"
                    value={form.municipio}
                    onChange={atualizar('municipio')}
                    className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Província</label>
                  <input
                    type="text"
                    value={form.provincia}
                    onChange={atualizar('provincia')}
                    className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── Secção: Horário ── */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Horário de Funcionamento
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Abertura</label>
                <input
                  type="time"
                  value={form.horario_abertura}
                  onChange={atualizar('horario_abertura')}
                  className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fechamento</label>
                <input
                  type="time"
                  value={form.horario_fechamento}
                  onChange={atualizar('horario_fechamento')}
                  className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </div>

          {/* ── Secção: Resíduos Aceites ── */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Resíduos Aceites
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipos de resíduos que a empresa aceita
              </label>
              <input
                type="text"
                value={form.residuos_aceites}
                onChange={atualizar('residuos_aceites')}
                placeholder="Ex: Plástico, Metal, Papel, Vidro"
                className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <p className="text-xs text-gray-400 mt-1">
                Separa os tipos com vírgula
              </p>
            </div>
          </div>
        </div>

        {/* Mensagens de feedback */}
        {erro && (
          <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
            {erro}
          </p>
        )}
        {sucesso && (
          <p className="text-green-700 text-sm bg-green-50 border border-green-200 rounded-lg p-3 mt-4">
            ✅ Perfil atualizado com sucesso!
          </p>
        )}

        {/* Botão de guardar */}
        <button
          onClick={guardar}
          disabled={guardando}
          className="w-full mt-6 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white py-3 rounded-xl font-semibold transition"
        >
          {guardando ? 'A guardar...' : 'Guardar Alterações'}
        </button>
      </div>
    </div>
  );
}