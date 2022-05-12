import fs from 'fs';
import PdfPrinter from 'pdfmake';
import { TDocumentDefinitions } from 'pdfmake/interfaces';
import { header } from './header';
import { photos, polesInLeftColumn, polesInRightColumn } from './main';
import { fonts, styles } from './styles';

const printer = new PdfPrinter(fonts),
      pdfsDir = `src/pdfs-to-merge`;

let pdfNumber = 0;
      
export function createPDF() {
  return new Promise((resolve) => {
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

      const PDF = printer.createPdfKitDocument(docDefinition as TDocumentDefinitions);
      const writeStream = fs.createWriteStream(`${pdfsDir}/${pdfNumber}.pdf`)

      PDF.pipe(writeStream);
      PDF.end();

      writeStream.on('end', (resolve));
      
      photos.length = 0;
      polesInLeftColumn.length = 0;
      polesInRightColumn.length = 0;
    }
  })
}