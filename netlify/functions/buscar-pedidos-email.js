export const handler = async () => ({
  statusCode: 410,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ erro: 'Esta rota foi desativada. Use GET /cliente/pedidos no backend.' }),
});
