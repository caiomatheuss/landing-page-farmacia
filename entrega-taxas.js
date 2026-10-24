// Taxa de motoboy por bairro. A comparação ignora maiúsculas e acentos.
// No navegador, o checkout lê window.ArteEntrega. No servidor, as funções importam daqui.

const TABELA = [
  {
    cidade: 'São José dos Pinhais',
    itens: [
      ['Aeroporto/Afonso Pena', 20],
      ['Águas Belas', 18],
      ['Aristocrata', 12],
      ['Arujá', 25],
      ['Aviação', 20],
      ['Barro Preto', 25],
      ['Bom Jesus', 10],
      ['Boneca do Iguaçu', 18],
      ['Borda do Campo', 30],
      ['Braga', 15],
      ['Campo Largo', 15],
      ['Campo Largo da Roseira', 45],
      ['Camela/Malhada', 45],
      ['Centro', 45],
      ['Colônia Mergulhão', 30],
      ['Colônia Murici', 20],
      ['Colônia Rio Grande', 12],
      ['Contenda', 40],
      ['Costeira', 11],
      ['Cristal', 22],
      ['Cruzeiro', 20],
      ['Del Rey', 22],
      ['Guatupê', 22],
      ['Iná', 20],
      ['Independência', 18],
      ['Ipê', 20],
      ['Jardim Itália', 18],
      ['Jardim Suíça', 15],
      ['Ouro Fino', 18],
      ['Quississana', 18],
      ['Renault/CIC/Audi', 30],
      ['Rio Pequeno', 18],
      ['Roseira', 30],
      ['São Cristóvão', 15],
      ['São Domingos', 10],
      ['São Marcos', 25],
      ['São Pedro', 10],
      ['Veneza', 15],
      ['Vila Roco', 15],
    ],
  },
  {
    cidade: 'Curitiba',
    itens: [
      ['Abranches', 35],
      ['Água Verde', 30],
      ['Ahú', 30],
      ['Alto Boqueirão', 25],
      ['Alto da Glória', 30],
      ['Alto da XV', 30],
      ['Atuba', 33],
      ['Bacacheri', 33],
      ['Bairro Alto', 40],
      ['Barreirinha', 30],
      ['Batel', 30],
      ['Bigorrilho', 30],
      ['Boa Vista', 35],
      ['Boqueirão', 20],
      ['Cabral', 30],
      ['Cajuru', 25],
      ['Campina do Siqueira', 30],
      ['Campão da Imbuia', 35],
      ['Campo Comprido', 35],
      ['Centro Cívico', 28],
      ['Centro Curitiba', 30],
      ['Champagnat', 35],
      ['CIC', 35],
      ['Cristo Rei', 30],
      ['Fanny', 30],
      ['Fazendinha', 28],
      ['Guabirotuba', 25],
      ['Hauer', 28],
      ['Hugo Lange', 28],
      ['Jardim Botânico', 25],
      ['Jardim das Américas', 25],
      ['Jardim Social', 25],
      ['Juvevê', 30],
      ['Mercês', 30],
      ['Mossunguê', 30],
      ['Novo Mundo', 28],
      ['Orleans', 35],
      ['Parolin', 28],
      ['Pilarzinho', 30],
      ['Pinheirinho', 28],
      ['Prado Velho', 28],
      ['Rebouças', 28],
      ['Santa Cândida', 40],
      ['Santa Felicidade', 35],
      ['Santa Quitéria', 28],
      ['Santo Inácio', 30],
      ['São Braz', 33],
      ['São Francisco', 30],
      ['Seminário', 30],
      ['Sítio Cercado', 25],
      ['Tarumã', 30],
      ['Tatuquara', 40],
      ['Tingui', 25],
      ['Uberaba', 35],
      ['Vila Oficinas', 30],
      ['Vista Alegre', 25],
      ['Xaxim', 30],
    ],
  },
];

function semAcento(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function chavesDoNome(nome) {
  const partes = String(nome).split('/').map((p) => p.trim()).filter(Boolean);
  const chaves = new Set([semAcento(nome), ...partes.map(semAcento)]);
  if (semAcento(nome) === 'centro curitiba') chaves.add('centro');
  if (semAcento(nome) === 'alto da xv') chaves.add('alto da rua xv');
  if (semAcento(nome) === 'cic') chaves.add('cidade industrial de curitiba');
  return [...chaves].filter(Boolean);
}

const ENTRADAS = TABELA.flatMap((grupo) => {
  const cidadeKey = semAcento(grupo.cidade);
  return grupo.itens.flatMap(([nome, valor]) =>
    chavesDoNome(nome).map((key) => ({
      key,
      cidadeKey,
      cidade: grupo.cidade,
      nome,
      valor,
    }))
  );
});

export function listaBairros() {
  return TABELA.map((grupo) => ({
    cidade: grupo.cidade,
    bairros: grupo.itens.map(([nome, valor]) => ({ nome, valor })),
  }));
}

export function taxaPorEndereco(bairro, cidade) {
  const nb = semAcento(bairro);
  const nc = semAcento(cidade);
  if (!nb) return { ok: false, motivo: 'sem-bairro' };

  let hits = ENTRADAS.filter((e) => e.key === nb);
  if (nc) {
    const naCidade = hits.filter((e) => e.cidadeKey === nc);
    if (naCidade.length) hits = naCidade;
    else if (hits.length) return { ok: false, motivo: 'fora' };
  }

  const unicos = [];
  const vistos = new Set();
  hits.forEach((h) => {
    const id = `${h.cidadeKey}|${semAcento(h.nome)}`;
    if (vistos.has(id)) return;
    vistos.add(id);
    unicos.push(h);
  });

  if (unicos.length === 1) {
    return { ok: true, valor: unicos[0].valor, bairro: unicos[0].nome, cidade: unicos[0].cidade };
  }
  if (unicos.length > 1) return { ok: false, motivo: 'ambiguo' };
  return { ok: false, motivo: 'fora' };
}

export function resolverTaxaEntrega(cliente) {
  const tipo = String(cliente?.deliveryType || 'entrega');
  if (tipo === 'retirada') return { taxa: 0, retirada: true };
  const resultado = taxaPorEndereco(cliente?.bairro, cliente?.cidade);
  if (!resultado.ok) {
    const err = new Error('Região não disponível para entrega. Entre em contato pelo WhatsApp.');
    err.code = 'FORA_DE_AREA';
    throw err;
  }
  return { taxa: resultado.valor, bairro: resultado.bairro, cidade: resultado.cidade, retirada: false };
}

if (typeof window !== 'undefined') {
  window.ArteEntrega = { listaBairros, taxaPorEndereco, semAcento };
}
