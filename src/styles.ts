import { StyleDictionary } from 'pdfmake/interfaces';

export const styles: StyleDictionary = {
  header: {
    margin: [0, 0, 0, 15],
  },

  titleHeader: {
    fontSize: 13,
    bold: true,
    alignment: 'center',
  },

  infoHeader: {
    fontSize: 9,
    bold: true,
  },

  columns: {
    alignment: 'center',
    margin: [25, 15, 25, 15],
  },

  titlePhotoTable: {
    alignment: 'center',
    fontSize: 10,
    bold: true,
    color: 'white',
    fillColor: '#002E46',
  },
};

export const fonts = {
  Roboto: {
    normal: 'src/static/fonts/Roboto-Regular.ttf',
    bold: 'src/static/fonts/Roboto-Medium.ttf',
    italics: 'src/static/fonts/Roboto-Italic.ttf',
    bolditalics: 'src/static/fonts/Roboto-MediumItalic.ttf',
  },
};
