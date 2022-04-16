import { data } from './data';
import './styles';

export const header = {
  style: 'header',
  table: {
    widths: ['20%', '36%', '12%', '12%', '20%'],
    heights: 12,
    body: [
      [
        {
          rowSpan: 4,
          image: 'src/static/images/tim-logo.png',
          fit: [75, 75],
          alignment: 'center',
          margin: [0, 18],
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
          image: 'src/static/images/comfica-logo.png',
          fit: [75, 75],
          alignment: 'center',
          margin: [0, 20],
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
