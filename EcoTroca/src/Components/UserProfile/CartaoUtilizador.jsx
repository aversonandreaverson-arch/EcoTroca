// Este componente serve para mostrar um cartão com dados do utilizador
// Ele recebe um "user" como propriedade (props)

export default function CartaoUtilizador({ user }) {
  // O "user" vem do componente pai e contém os dados do utilizador

  return (
    // Div principal do cartão
    <div className="bg-white p-4 rounded-xl shadow-sm">
      
      {/* Nome do utilizador */}
      <h3 className="font-semibold">
        {user.nome}
      </h3>

      {/* Município do utilizador */}
      {/* Estamos a buscar o município dentro do objeto user */}
      <p>
        Município: {user.Município}
      </p>

    </div>
  );
}
