import fs from 'fs';
import PdfPrinter from 'pdfmake';
import { TDocumentDefinitions } from 'pdfmake/interfaces';
import { header } from './header';
import {
  lastPdf,
  mergePDFS,
  photos,
  polesInLeftColumn,
  polesInRightColumn,
} from './main';
import { fonts, styles } from './styles';

const printer = new PdfPrinter(fonts),
  pdfsDir = `src/pdfs-to-merge`;

let pdfNumber = 0;

export function createPDF() {
  const docDefinition = {
    pageSize: 'A4',
    pageOrientation: 'portrait',
    pageMargins: [0, 95, 0, 0],

    header,

    content: [photos],

    styles,
  };

  if (header && photos) {
    pdfNumber++;

    const PDF = printer.createPdfKitDocument(
      docDefinition as TDocumentDefinitions
    );
    const writeStream = fs.createWriteStream(`${pdfsDir}/${pdfNumber}.pdf`);

    PDF.pipe(writeStream);
    PDF.end();

    photos.length = 0;
    polesInLeftColumn.length = 0;
    polesInRightColumn.length = 0;

    if (lastPdf) {
      setTimeout(() => mergePDFS(), pdfNumber < 4 ? 1000 : pdfNumber * 250);
    }
  }
}
