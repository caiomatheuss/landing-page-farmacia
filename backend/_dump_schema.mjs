import 'dotenv/config';
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function dump(label, text) {
  const { rows } = await pool.query(text);
  console.log('---' + label + '---');
  console.log(JSON.stringify(rows));
}

await dump('empresas', 'select id, nome, slug from empresas');
await dump('produtos', 'select id, empresa_id, codigo, nome, preco from produtos order by id');
await dump(
  'cols',
  `select table_name, column_name, data_type
   from information_schema.columns
   where table_schema = 'public'
     and table_name in ('empresas','clientes','produtos','pedidos','pedido_itens')
   order by table_name, ordinal_position`
);
await pool.end();
