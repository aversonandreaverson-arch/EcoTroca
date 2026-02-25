// Este componente mostra um cartão com informações de um coletador
// Ele recebe um objeto chamado "catador" através das props

export default function CartaoColetador({ catador }) {

  // Se o catador não existir, não mostra nada (evita o erro)
  if (!catador) return null;

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm">

      <h3 className="font-semibold">
        {catador.nome}
      </h3>

      <p>
        Total coletado: {catador.totalColetado} Kg
      </p>

      <p>
        Município: {catador.Município}
      </p>

    </div>
  );
}