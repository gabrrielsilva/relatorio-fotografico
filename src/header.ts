import chalk from 'chalk';
import fs from 'fs';
import readline from 'readline';

interface Header {
  id: string;
  titulo: string;
  seguimento: string;
  local: string;
  site_abordagem: string;
  versao: string;
}

const imagesDir = `src/static/images`,
      leftLogoDir = `${imagesDir}/left-logo`,
      rightLogoDir = `${imagesDir}/right-logo`,
      leftLogo = fs.readdirSync(leftLogoDir),
      rightLogo = fs.readdirSync(rightLogoDir);
      
let   headerData: Header = {} as Header;

export let header: {};

export let startTime = 0;

export async function setHeader() {
  const user = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  const questionColor = chalk.inverse;
  const createQuestion = (field: string) => {
    const headerProperty = field.toLowerCase().replace(/\//g, '_');

    return new Promise((resolve) => {
      user.question(questionColor(`Qual o ${field} do projeto?\n`), (answer: any) =>
        resolve(headerData[headerProperty as keyof Header] = answer)
      )
    })
  }

  await createQuestion('id'),
  await createQuestion('titulo'),
  await createQuestion('seguimento'),
  await createQuestion('local'),
  await createQuestion('site/abordagem'),
  await createQuestion('versao')

  console.log('');
  console.log(chalk.magentaBright('Processando...\n'));

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
            image: `${leftLogoDir}/${leftLogo[0]}`,
            fit: [100, 100],
            alignment: 'center',
            margin: [0, 10],
          },
          {
            rowSpan: 2,
            text: `Relatório fotográfico\n${headerData.seguimento}`,
            style: 'titleHeader',
          },
          {
            rowSpan: 2,
            text: `ID SGI/GL SGP\n ${headerData.id}`,
            style: 'infoHeader',
          },
          {
            rowSpan: 2,
            text: `SITE/ABORD\n ${headerData.site_abordagem}`,
            style: 'infoHeader',
          },
          {
            rowSpan: 4,
            image: `${rightLogoDir}/${rightLogo[0]}`,
            fit: [100, 100],
            alignment: 'center',
            margin: [0, 10],
          },
        ],
        [],
        [
          '',
          {
            text: `PROJETO: ${headerData.titulo}`,
            style: 'infoHeader',
          },
          {
            rowSpan: 2,
            text: `DATA\n ${new Date().toLocaleDateString('pt-BR')}`,
            style: 'infoHeader',
          },
          {
            rowSpan: 2,
            text: `VERSÃO\n ${headerData.versao}`,
            style: 'infoHeader',
          },
          '',
        ],
        [
          '',
          {
            text: `LOCALIDADE: ${headerData.local}`,
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