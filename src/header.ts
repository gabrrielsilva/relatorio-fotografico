import fs from 'fs';
import { data } from './data';
import './styles';

const leftLogoDir = 'src/static/images/left-logo';
const rightLogoDir = 'src/static/images/right-logo';

const leftLogo = fs.readdirSync(leftLogoDir);
const rightLogo = fs.readdirSync(rightLogoDir);

export const header = {
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
          text: `Relatório fotográfico\n${data.tipo}`,
          style: 'titleHeader',
        },
        {
          rowSpan: 2,
          text: `ID SGI/GL SGP\n ${data.idSgiOuGlSgp}`,
          style: 'infoHeader',
        },
        {
          rowSpan: 2,
          text: `SITE/ABORD\n ${data.siteOuAbord}`,
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
        { text: `PROJETO: ${data.projeto}`, style: 'infoHeader' },
        { rowSpan: 2, text: `DATA\n ${data.data}`, style: 'infoHeader' },
        { rowSpan: 2, text: `VERSÃO\n ${data.versao}`, style: 'infoHeader' },
        '',
      ],
      [
        '',
        { text: `LOCALIDADE: ${data.localidade}`, style: 'infoHeader' },
        '',
        '',
        '',
      ],
    ],
  },
};
