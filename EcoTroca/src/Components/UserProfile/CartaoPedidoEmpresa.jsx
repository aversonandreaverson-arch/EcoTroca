// Este componente mostra um cartão com informações de um coletador
// Ele recebe um objeto chamado "catador" através das props

export default function CartaoColetador({ catador }) {

  return (
    // Div principal do cartão
    <div className="bg-white p-4 rounded-xl shadow-sm">

      {/* Nome do coletador */}
      <h3 className="font-semibold">
        {catador.nome}
      </h3>

      {/* Quantidade total coletada pelo coletador */}
      <p>
        Total coletado: {catador.totalColetado} Kg
      </p>

      {/* Município onde o coletador atua */}
      {/* Estamos a buscar esta informação dentro do objeto catador */}
      <p>
        Município: {catador.Município}
      </p>

    </div>
  );
}
