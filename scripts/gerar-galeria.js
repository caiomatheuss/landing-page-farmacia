// Gera galeria-data.js a partir dos arquivos em images/galeria/.
// Nome: secao-unidade-orientacao-numero.jpg
// A orientação publicada é a medida real (width x height).
import fs from 'fs';
import path from 'path';
import { imageSize } from 'image-size';

const ROOT = process.cwd();
const PASTA = path.join(ROOT, 'images', 'galeria');
const SAIDA = path.join(ROOT, 'galeria-data.js');

const SECOES = ['fachada', 'ambiente', 'formula', 'lab', 'produtos', 'especialidade'];
const UNIDADES = ['matriz', 'filial', 'geral'];
const PADRAO = new RegExp(
  `^(${SECOES.join('|')})-(${UNIDADES.join('|')})-(h|v)-(\\d+)\\.(jpe?g)$`,
  'i'
);

// alt e legenda opcionais, por nome de arquivo.
const SOBRESCREVER = {
  'fachada-matriz-h-01.jpg': {
    alt: 'Fachada da Matriz — Arte Pharmaceutica',
    legenda: 'A casa da matriz, na Rua Dona Izabel A Redentora.',
  },
  'fachada-filial-h-01.jpg': {
    alt: 'Fachada da Filial — Arte Pharmaceutica',
    legenda: 'A filial, na Rua Visconde do Rio Branco.',
  },
  'ambiente-matriz-v-01.jpg': {
    legenda: 'Recepção da matriz, com o emblema na parede.',
  },
  'ambiente-matriz-v-02.jpg': {
    legenda: 'Nichos iluminados e a cristaleira da matriz.',
  },
  'ambiente-matriz-v-03.jpg': {
    legenda: 'O salão da matriz, entre o balcão de mármore e a linha.',
  },
  'ambiente-matriz-v-04.jpg': {
    legenda: 'Vidraria e frascos nos nichos da matriz.',
  },
  'ambiente-matriz-v-05.jpg': {
    legenda: 'Prateleiras de vidraria com o emblema da matriz.',
  },
  'ambiente-matriz-v-06.jpg': {
    legenda: 'Detalhe da vidraria ao lado do balcão da matriz.',
  },
  'ambiente-matriz-v-07.jpg': {
    legenda: 'Certificado e o emblema sobre o balcão da matriz.',
  },
  'ambiente-filial-h-01.jpg': {
    legenda: 'Atendimento da filial, com o emblema no vidro.',
  },
  'ambiente-filial-h-02.jpg': {
    legenda: 'Balcão de mármore da filial.',
  },
  'ambiente-filial-h-03.jpg': {
    legenda: 'A linha de produtos ao lado do balcão da filial.',
  },
  'ambiente-filial-h-04.jpg': {
    legenda: 'Recepção da filial e a porta da área restrita.',
  },
  'ambiente-filial-v-01.jpg': {
    legenda: 'Prateleiras da filial, com o certificado da casa.',
  },
  'ambiente-filial-v-02.jpg': {
    legenda: 'O balcão da filial, visto de lado.',
  },
  'formula-matriz-v-01.jpg': {
    legenda: 'A fórmula conferida diante dos frascos de cápsulas.',
  },
  'formula-matriz-v-02.jpg': {
    legenda: 'Cápsulas na placa de enchimento.',
  },
  'formula-matriz-v-03.jpg': {
    legenda: 'Blíster fechado na bancada da matriz.',
  },
  'lab-matriz-h-01.jpg': {
    legenda: 'Salas de hormônios e de antibióticos.',
  },
  'lab-matriz-h-02.jpg': {
    legenda: 'Cabine de pesagem do laboratório da matriz.',
  },
  'lab-matriz-h-03.jpg': {
    legenda: 'Pesagem de insumo na bancada.',
  },
  'lab-matriz-v-01.jpg': {
    legenda: 'Preparo na cabine do laboratório.',
  },
  'lab-matriz-v-02.jpg': {
    legenda: 'Cápsulas manipuladas na mão.',
  },
  'lab-matriz-v-03.jpg': {
    legenda: 'Conferência de peso no laboratório.',
  },
  'lab-matriz-v-04.jpg': {
    legenda: 'Selagem dos sachês prontos.',
  },
  'lab-matriz-v-05.jpg': {
    legenda: 'Enchimento das cápsulas, uma a uma.',
  },
  'especialidade-matriz-h-01.jpg': {
    alt: 'Equipe em manipulação na matriz — Arte Pharmaceutica',
    legenda: 'A equipe em manipulação na matriz.',
  },
  'especialidade-matriz-v-03.jpg': {
    alt: 'Farmacêutica com cápsula manipulada — Arte Pharmaceutica',
    legenda: 'Cápsula manipulada, pronta para conferência.',
  },
};

const ROTULO_SECAO = {
  fachada: 'Fachada',
  ambiente: 'Ambiente',
  formula: 'Formulação',
  lab: 'Laboratório',
  produtos: 'Produtos',
  especialidade: 'Especialidade',
};

const ROTULO_UNIDADE = {
  matriz: 'da Matriz',
  filial: 'da Filial',
  geral: '',
};

function altAutomatico(secao, unidade) {
  const lugar = ROTULO_UNIDADE[unidade];
  const titulo = lugar ? `${ROTULO_SECAO[secao]} ${lugar}` : ROTULO_SECAO[secao];
  return `${titulo} — Arte Pharmaceutica`;
}

function medir(arquivo) {
  const dim = imageSize(fs.readFileSync(arquivo));
  const width = Number(dim.width) || 0;
  const height = Number(dim.height) || 0;
  const orientacao = width >= height ? 'h' : 'v';
  return { width, height, orientacao };
}

if (!fs.existsSync(PASTA)) {
  console.warn(`[galeria] Pasta não encontrada: ${PASTA}`);
  fs.writeFileSync(SAIDA, 'window.GALERIA = [];\n');
  process.exit(0);
}

const fotos = [];

for (const nome of fs.readdirSync(PASTA)) {
  const caminho = path.join(PASTA, nome);
  if (!fs.statSync(caminho).isFile()) continue;

  const match = nome.match(PADRAO);
  if (!match) {
    console.warn(`[galeria] Ignorado (fora do padrão): ${nome}`);
    continue;
  }

  const secao = match[1].toLowerCase();
  const unidade = match[2].toLowerCase();
  const letra = match[3].toLowerCase();
  const ordem = Number(match[4]);
  const { width, height, orientacao } = medir(caminho);

  if (!width || !height) {
    console.warn(`[galeria] Ignorado (sem medida): ${nome}`);
    continue;
  }

  if (letra !== orientacao) {
    console.warn(
      `[galeria] ${nome}: o nome diz "${letra}", a foto é ${width}×${height} (${orientacao}). Vale a medida.`
    );
  }

  const extra = SOBRESCREVER[nome] || {};
  fotos.push({
    src: `images/galeria/${nome}`,
    alt: extra.alt || altAutomatico(secao, unidade),
    legenda: extra.legenda || '',
    secao,
    unidade,
    orientacao,
    width,
    height,
    ordem,
  });
}

fotos.sort((a, b) =>
  a.secao.localeCompare(b.secao) ||
  a.unidade.localeCompare(b.unidade) ||
  a.ordem - b.ordem ||
  a.src.localeCompare(b.src)
);

const corpo = `window.GALERIA = ${JSON.stringify(fotos, null, 2)};\n`;
fs.writeFileSync(SAIDA, corpo);
console.log(`[galeria] ${fotos.length} foto(s) em galeria-data.js`);
