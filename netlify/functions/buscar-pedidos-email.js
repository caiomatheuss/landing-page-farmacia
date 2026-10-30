export const handler = async () => ({
  statusCode: 410,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ erro: 'Esta rota foi desativada. Os pedidos ficam em meus-pedidos.html, com login no Supabase.' }),
});
