export default function CartaoUtilizador({ user }) {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm">
      <h3 className="font-semibold">{user.nome}</h3>
      <p>Município: {user.Município}</p>
    </div>
  );
}
