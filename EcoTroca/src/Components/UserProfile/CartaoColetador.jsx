export default function CartaoColetador({ catador }) {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm">
      <h3 className="font-semibold">{catador.nome}</h3>
      <p>Total coletado: {catador.totalColetado} Kg</p>
      <p>Município: {catador.Município}</p>
    </div>
  );
}
