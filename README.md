# Arte Pharmaceutica

Landing page e checkout da farmácia de manipulação, hospedados na Netlify. O backend de autenticação e pedidos (Express) deve ir para Railway ou Render e usa o Neon (PostgreSQL).

## Autenticação com roles

- `customer` → após o login vai para `meus-pedidos.html`
- `admin` → após o login vai para `admin.html` (lista todos os pedidos e altera status)
- JWT fica no `localStorage` (`arte_auth_token`)
- Quem acessa `admin.html` sem ser admin é enviado para `login.html`

### 1. SQL no Neon

No console do Neon → SQL Editor, rode `sql/alter_clientes.sql`.

### 2. Variáveis de ambiente do Neon / backend

No Neon: **Dashboard → seu projeto → Connection details → Connection string**.

Copie a URI (com `sslmode=require`) para:

- Netlify → Site configuration → Environment variables → `DATABASE_URL` (já usada pelas functions do checkout)
- Railway ou Render → as variáveis abaixo

Arquivo de referência: `backend/.env.example`

```
DATABASE_URL=postgresql://USER:SENHA@HOST/neondb?sslmode=require
JWT_SECRET=um-segredo-longo-aleatorio
PORT=3000
EMPRESA_ID=1
FRONTEND_ORIGIN=https://arte-pharmaceutica.netlify.app,http://localhost:8888
```

Gere o `JWT_SECRET` com:

```bash
openssl rand -hex 32
```

### 3. Backend local

```bash
cd backend
cp .env.example .env
# edite o .env
npm install
npm start
```

Crie o primeiro admin (a senha precisa de 6–20 caracteres, 1 maiúscula e 1 número):

```bash
node scripts/criar-admin.js admin@artepharmaceutica.com 'SenhaForte1' 'Administrador'
```

### 4. Deploy no Railway (gratuito)

1. New Project → Deploy from GitHub → este repositório
2. **Root Directory:** `backend`
3. Variáveis: `DATABASE_URL`, `JWT_SECRET`, `EMPRESA_ID=1`, `FRONTEND_ORIGIN` com a URL da Netlify
4. Copie a URL pública (ex.: `https://algo.up.railway.app`)
5. No site, atualize `config.js`:

```js
export const API_BASE = 'https://algo.up.railway.app';
```

6. Teste `https://algo.up.railway.app/health`

### 5. Deploy no Render (alternativa)

1. New → Web Service → este repositório
2. Root Directory: `backend`
3. Build: `npm install` · Start: `npm start`
4. Mesmas variáveis de ambiente
5. Atualize `config.js` com a URL `onrender.com`

### Endpoints

| Método | Rota | Quem |
|---|---|---|
| POST | `/auth/register` | público |
| POST | `/auth/login` | público |
| GET | `/auth/me` | logado |
| GET | `/admin/pedidos` | admin |
| PATCH | `/admin/pedidos/:id/status` | admin |
| GET | `/cliente/pedidos` | customer |

O login antigo por senha única (`admin.html` + `admin-login`) foi removido.
