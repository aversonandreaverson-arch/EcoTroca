import React from 'react';
import { Facebook, Instagram, Twitter, Linkedin, Mail } from "lucide-react";
import logo from "../assets/Ecotroca-logo-2.0.png";

export default function Footer() {
  return (
    <footer className="bg-green-900 text-gray-200 pt-12">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">

        {/* Grid principal */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

          {/* Sobre a plataforma + Logo */}
          <div>
            <img src={logo} alt="Ecotroca-Angola Logo" className="w-36 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Ecotroca-Angola</h3>
            <p className="text-gray-300">
              Uma plataforma para conectar empresas, coletadores e cidadãos,
              promovendo a reciclagem e gestão sustentável de resíduos em Angola.
            </p>
          </div>

          {/* Links úteis */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Links Úteis</h4>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-green-400 transition">Página Inicial</a></li>
              <li><a href="#" className="hover:text-green-400 transition">Pedidos de Empresas</a></li>
              <li><a href="#" className="hover:text-green-400 transition">Coletadores</a></li>
              <li><a href="#" className="hover:text-green-400 transition">Contato</a></li>
            </ul>
          </div>

          {/* Contato */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Contato</h4>
            <ul className="space-y-2">
              <li>Email: <a href="mailto:suporte@ecotroca.co.ao" className="hover:text-green-400 transition">suporte@ecotroca.co.ao</a></li>
              <li>Telefone: <a href="tel:+244923456789" className="hover:text-green-400 transition">+244 923 456 789</a></li>
              <li>Endereço: Luanda, Angola</li>
            </ul>
          </div>

          {/* Redes sociais */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Siga-nos</h4>
            <div className="flex space-x-4 mb-4">
              <a href="#" className="hover:text-green-400 transition"><Facebook /></a>
              <a href="#" className="hover:text-green-400 transition"><Instagram /></a>
              <a href="#" className="hover:text-green-400 transition"><Twitter /></a>
              <a href="#" className="hover:text-green-400 transition"><Linkedin /></a>
            </div>
            <h4 className="text-lg font-semibold text-white mb-2">Newsletter</h4>
            <p className="text-gray-300 text-sm mb-2">Receba atualizações e novidades diretamente no seu e-mail:</p>
            <div className="flex">
              <input 
                type="email"
                placeholder="Digite seu e-mail"
                className="w-full rounded-l-xl p-2 text-gray-900 focus:outline-none"
              />
              <button className="bg-green-500 hover:bg-green-600 text-white px-4 rounded-r-xl transition">
                <Mail className="w-4 h-4 inline mr-1"/> Enviar
              </button>
            </div>
          </div>

        </div>

        {/* Linha de copyright */}
        <div className="border-t border-green-800 mt-12 pt-6 text-center text-gray-400 text-sm">
          © {new Date().getFullYear()} Ecotroca-Angola. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}