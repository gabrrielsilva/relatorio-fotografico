import fs from 'fs';
import PdfPrinter from 'pdfmake';
import { TDocumentDefinitions } from 'pdfmake/interfaces';
import { header } from './header';
import { photos } from './photos';
import { fonts, styles } from './styles';

const printer = new PdfPrinter(fonts);

const docDefinition: TDocumentDefinitions = {
  pageSize: 'A4',
  pageOrientation: 'portrait',
  pageMargins: [0, 0, 0, 0],

  content: [header, photos],

  styles,
};

setTimeout(() => {
  const pdfDoc = printer.createPdfKitDocument(docDefinition);
  pdfDoc.pipe(fs.createWriteStream('export/document.pdf'));
  pdfDoc.end();
}, 500);
