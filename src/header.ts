import fs from 'fs';
import inquirer from 'inquirer';

export let header: {},
  startTime = 0;

type Answer = {
  id: string;
  titulo: string;
  seguimento: string;
  local: string;
  siteAbordagem: string;
  versao: string;
  logoEsquerda: string;
  logoDireita: string;
};

const logosDir = 'src/static/images/logos',
  logos = fs.readdirSync(logosDir);

export async function setHeader() {
  const question = (
    name: string,
    message: string,
    type: string,
    choices?: string[]
  ) => {
    return {
      name,
      message,
      type,
      choices,
    };
  };

  const answer: Answer = await inquirer.prompt([
    question('id', 'Qual o id do projeto?', 'input'),
    question('titulo', 'Qual o título do projeto?', 'input'),
    question('seguimento', 'Qual o seguimento do projeto?', 'input'),
    question('local', 'Qual o local do projeto?', 'input'),
    question('siteAbordagem', 'Qual o site/abordagem do projeto?', 'input'),
    question('versao', 'Qual a versão do projeto?', 'input'),
    question(
      'logoEsquerda',
      'Escolha a logo esquerda do relatório',
      'list',
      logos
    ),
    question(
      'logoDireita',
      'Escolha a logo direita do relatório',
      'list',
      logos
    ),
  ]);

  console.log('');

  startTime = Date.now();

  header = {
    style: 'header',
    table: {
      widths: ['20%', '36%', '12%', '12%', '20%'],
      heights: 12,
      body: [
        [
          {
            rowSpan: 4,
            image: `${logosDir}/${answer.logoEsquerda}`,
            fit: [100, 100],
            alignment: 'center',
            margin: [0, 10],
          },
          {
            rowSpan: 2,
            text: `Relatório fotográfico\n${answer.seguimento}`,
            style: 'titleHeader',
          },
          {
            rowSpan: 2,
            text: `ID SGI/GL SGP\n ${answer.id}`,
            style: 'infoHeader',
          },
          {
            rowSpan: 2,
            text: `SITE/ABORD\n ${answer.siteAbordagem}`,
            style: 'infoHeader',
          },
          {
            rowSpan: 4,
            image: `${logosDir}/${answer.logoDireita}`,
            fit: [100, 100],
            alignment: 'center',
            margin: [0, 10],
          },
        ],
        [],
        [
          '',
          {
            text: `PROJETO: ${answer.titulo}`,
            style: 'infoHeader',
          },
          {
            rowSpan: 2,
            text: `DATA\n ${new Date().toLocaleDateString('pt-BR')}`,
            style: 'infoHeader',
          },
          {
            rowSpan: 2,
            text: `VERSÃO\n ${answer.versao}`,
            style: 'infoHeader',
          },
          '',
        ],
        [
          '',
          {
            text: `LOCALIDADE: ${answer.local}`,
            style: 'infoHeader',
          },
          '',
          '',
          '',
        ],
      ],
    },
  };
}
