// ══ ESTADO ══
    let todosPedidos = [];
    let filtroAtual = 'TODOS';

    // ══ LOGIN ══
    // A senha agora é validada no servidor (netlify/functions/admin-login.js).
    // O front-end nunca conhece a senha real — só guarda o token que o
    // servidor devolve depois de confirmar a senha.
    function verificarLogin() {
      if (sessionStorage.getItem('adm_token')) mostrarAdmin();
    }

    document.getElementById('btnLogin').addEventListener('click', fazerLogin);
    document.getElementById('inputSenha').addEventListener('keydown', e => {
      if (e.key === 'Enter') fazerLogin();
    });

    async function fazerLogin() {
      const senha = document.getElementById('inputSenha').value;
      const erro  = document.getElementById('loginError');
      erro.textContent = '';

      try {
        const resp = await fetch('/.netlify/functions/admin-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ senha }),
        });
        const data = await resp.json();

        if (!resp.ok) {
          erro.textContent = data.erro || 'Senha incorreta. Tente novamente.';
          document.getElementById('inputSenha').value = '';
          return;
        }

        sessionStorage.setItem('adm_token', data.token);
        mostrarAdmin();
      } catch {
        erro.textContent = 'Erro ao conectar com o servidor. Tente novamente.';
      }
    }

    document.getElementById('btnLogout').addEventListener('click', () => {
      sessionStorage.removeItem('adm_token');
      location.reload();
    });

    function mostrarAdmin() {
      document.getElementById('loginScreen').style.display = 'none';
      document.getElementById('adminPanel').style.display = 'block';
      carregarPedidos();
    }

    // ══ CARREGAR PEDIDOS ══
    async function carregarPedidos() {
      document.getElementById('loadingMsg').style.display = 'block';
      document.getElementById('tabelaPedidos').style.display = 'none';
      document.getElementById('emptyMsg').style.display = 'none';

      const resp = await fetch('/.netlify/functions/listar-pedidos', {
        headers: { 'x-admin-token': sessionStorage.getItem('adm_token') || '' },
      });

      if (resp.status === 401) {
        sessionStorage.removeItem('adm_token');
        location.reload();
        return;
      }

      const data = await resp.json();
      todosPedidos = data.data || [];
      renderizarTabela();
      atualizarStats();

      document.getElementById('loadingMsg').style.display = 'none';
    }

    document.getElementById('btnRefresh').addEventListener('click', carregarPedidos);

    // ══ FILTROS ══
    document.querySelectorAll('.adm-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.adm-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        filtroAtual = btn.dataset.filter;
        renderizarTabela();
      });
    });

    // ══ RENDERIZAR TABELA ══
    function renderizarTabela() {
  const lista = filtroAtual === 'TODOS'
    ? todosPedidos
    : todosPedidos.filter(p => p.status === filtroAtual);

  const tbody = document.getElementById('tabelaBody');
  const tabela = document.getElementById('tabelaPedidos');
  const empty  = document.getElementById('emptyMsg');

  if (!lista.length) {
    tabela.style.display = 'none';
    empty.style.display = 'block';
    return;
  }

  tabela.style.display = 'table';
  empty.style.display = 'none';

  tbody.innerHTML = lista.map(p => {
    const data     = new Date(p.dateCreated).toLocaleDateString('pt-BR');
    const cliente  = p.clienteDetalhes;
    const nome     = cliente?.name || '—';
    const cpf      = cliente?.cpfCnpj || '—';
    const telefone = cliente?.phone || cliente?.mobilePhone || '—';
    const endereco = cliente
      ? `${cliente.address || ''}, ${cliente.addressNumber || ''} ${cliente.complement || ''} — ${cliente.province || ''}, ${cliente.city || ''}/${cliente.state || ''} — CEP: ${cliente.postalCode || ''}`
      : '—';
    const metodo   = traduzirMetodo(p.billingType, p.description);
    const status   = traduzirStatus(p.status);
    const badge    = badgeCss(p.status);
    const parcelas = p.installmentCount > 1 ? `${p.installmentCount}x` : '1x';
    const valor    = `R$ ${p.value.toFixed(2).replace('.', ',')}`;
    const produto  = p.description || '—';

    return `
      <tr>
        <td>${data}</td>
        <td style="font-weight:600">${nome}</td>
        <td>${cpf}</td>
        <td>${telefone}</td>
        <td style="min-width:280px;white-space:normal;line-height:1.5">${endereco}</td>
        <td style="min-width:200px;white-space:normal;line-height:1.5">${produto}</td>
        <td>${metodo}</td>
        <td>${parcelas}</td>
        <td style="font-weight:600">${valor}</td>
        <td><span class="badge ${badge}">${status}</span></td>
      </tr>
    `;
  }).join('');
}

    // ══ STATS ══
    function atualizarStats() {
      const pagos     = todosPedidos.filter(p => p.status === 'RECEIVED' || p.status === 'CONFIRMED');
      const pendentes = todosPedidos.filter(p => p.status === 'PENDING');
      const receita   = pagos.reduce((s, p) => s + p.value, 0);

      document.getElementById('statTotal').textContent    = todosPedidos.length;
      document.getElementById('statPagos').textContent    = pagos.length;
      document.getElementById('statPendentes').textContent = pendentes.length;
      document.getElementById('statReceita').textContent  = receita.toFixed(2).replace('.', ',');
    }

    // ══ HELPERS ══
    function traduzirMetodo(tipo, descricao) {
      if (tipo === 'UNDEFINED') {
        // Extrai a unidade da descrição: "[RETIRADA NA LOJA] Matriz ..."
        const match = descricao && descricao.match(/\[RETIRADA NA LOJA\]\s*([^|]+)/);
        const unidade = match ? match[1].trim() : '';
        return unidade ? `Retirada — ${unidade.split(' — ')[0]}` : 'Retirada na loja';
      }
      const map = { CREDIT_CARD: 'Cartão', BOLETO: 'Boleto', PIX: 'PIX', DEBIT_CARD: 'Débito' };
      return map[tipo] || tipo;
    }

    function traduzirStatus(status) {
      const map = {
        PENDING: 'Pendente', RECEIVED: 'Pago', CONFIRMED: 'Confirmado',
        OVERDUE: 'Vencido', REFUNDED: 'Estornado', CANCELLED: 'Cancelado',
        DECLINED: 'Recusado',
      };
      return map[status] || status;
    }

    function badgeCss(status) {
      if (status === 'RECEIVED' || status === 'CONFIRMED') return 'badge-pago';
      if (status === 'PENDING') return 'badge-pendente';
      return 'badge-cancelado';
    }

    // ══ INIT ══
    verificarLogin();