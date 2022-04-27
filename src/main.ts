import chalk from 'chalk';
import decompress from 'decompress';
import fs from 'fs';
import PDFMerger from 'pdf-merger-js';
import PdfPrinter from 'pdfmake';
import { TDocumentDefinitions } from 'pdfmake/interfaces';
import { header } from './header';
import './styles';
import { fonts, styles } from './styles';
import { convertKmlToGeoJson } from './toGeoJson';

export const photos: any[] = [];

const photoWidth = 120;
const photoHeight = 150;
const photoGap = 30;

// export type HeaderData = {
//   tipo: string;
//   projeto: string;
//   localidade: string;
//   idSgiOuGlSgp: string;
//   data: string;
//   siteOuAbord: string;
//   versao: string;
// };

// const headerData: HeaderData = {} as HeaderData;

const docDefinition: TDocumentDefinitions = {
  pageSize: 'A4',
  pageOrientation: 'portrait',
  pageMargins: [0, 95, 0, 0],

  header,

  content: [photos],

  styles,
};

const printer = new PdfPrinter(fonts);
const merger = new PDFMerger();
const pdfsToMergeDir = 'src/pdfs-to-merge';

let polesInPdf = 96;
let polesAmount = 0;

const inputFileDir = 'input';
const inputFile = fs.readdirSync(inputFileDir);
const kmlAndCloudMediaDir = 'src/kml-cloud-media';

const noPhotoPath = 'src/static/images/no-photo-infinitel.png';

let polesAmountImmutable = 0;
let photosAmount = 0;
let polesWithoutPhoto = 0;
let ignoredMarkers = 0;

let begin: number;
(async () => {
  begin = Date.now();

  const file = inputFile[0];

  if (file) {
    checkInputFileExtension(file);
  } else {
    throw new Error(
      `${chalk.redBright('Coloque um arquivo kmz na pasta input')}`
    );
  }
})();

function checkInputFileExtension(file: string) {
  const extension = file.split('.').pop();

  if (extension === 'kmz') {
    console.log(`${chalk.yellowBright('Kmz detectado... 🌎')}`);
    console.log('');
    console.log(`${chalk.magentaBright('Processando... 🦜')}`);

    extractKmlFileAndMediaFolder(file);
  } else {
    throw new Error(`${chalk.redBright('O arquivo de entrada não é um kmz!')}`);
  }
}

async function extractKmlFileAndMediaFolder(file: string) {
  fs.copyFileSync(`${inputFileDir}/${file}`, `${kmlAndCloudMediaDir}/${file}`);

  fs.renameSync(
    `${kmlAndCloudMediaDir}/${file}`,
    `${kmlAndCloudMediaDir}/${file}.zip`
  );

  // decompress to get the kml file and media folder
  await decompress(
    `${kmlAndCloudMediaDir}/${file}.zip`,
    `${kmlAndCloudMediaDir}`
  );

  fs.rmSync(`${kmlAndCloudMediaDir}/${file}.zip`);

  fs.readdirSync(kmlAndCloudMediaDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => {
      if (dirent.name !== 'cloud_media') {
        fs.renameSync(
          `${kmlAndCloudMediaDir}/${dirent.name}`,
          `${kmlAndCloudMediaDir}/cloud_media`
        );
      }
    });

  const checkMediaFolder = fs.readdirSync(kmlAndCloudMediaDir);

  if (checkMediaFolder.length > 1) {
    const cloudMediaDir = `${kmlAndCloudMediaDir}/cloud_media`;
    const cloudMediaFiles = fs.readdirSync(cloudMediaDir);

    photosAmount = cloudMediaFiles.length;

    for await (const file of cloudMediaFiles) {
      fs.renameSync(`${cloudMediaDir}/${file}`, `${cloudMediaDir}/${file}.png`);
    }

    getGeoJsonFromKmlFile();
  } else {
    getGeoJsonFromKmlFile();
  }
}

async function getGeoJsonFromKmlFile() {
  const geoJson = await convertKmlToGeoJson(`${kmlAndCloudMediaDir}/doc.kml`);

  await geoJson.features.filter((marker: any) => {
    if (Number(marker.properties.name)) polesAmount++;
  });

  polesAmountImmutable = polesAmount;

  geoJson.features.forEach((marker: any) => {
    const pole = marker.properties.name as string;
    const photos = marker.properties.com_exlyo_mapmarker_images_with_ext as
      | string
      | undefined;
    const coordinates = marker.geometry.coordinates as Array<number>;

    let leftPhoto;
    let rightPhoto;

    if (photos !== undefined) {
      const photosObj = JSON.parse(photos as string);
      leftPhoto = photosObj[0];
      rightPhoto = photosObj[1];
    } else {
      leftPhoto = undefined;
      rightPhoto = undefined;
    }

    if (pole && Number(pole)) {
      setLeftAndRightPhotos(Number(pole), coordinates, leftPhoto, rightPhoto);
    } else {
      ignoredMarkers++;
      // console.log(`Marcador nomeado "${pole}" foi ignorado`);
    }
  });
}

function setLeftAndRightPhotos(
  pole: number,
  coordinates: number[],
  leftPhoto: any,
  rightPhoto: any
) {
  let leftPhotoPath: string = '';
  let rightPhotoPath: string = '';

  const photosDir = 'src/kml-cloud-media/';

  if (leftPhoto && rightPhoto) {
    leftPhotoPath = `${photosDir}${leftPhoto.file_rel_path}${leftPhoto.file_extension}`;
    rightPhotoPath = `${photosDir}${rightPhoto.file_rel_path}${rightPhoto.file_extension}`;
  }

  if (leftPhoto && !rightPhoto) {
    leftPhotoPath = `${photosDir}${leftPhoto.file_rel_path}${leftPhoto.file_extension}`;
    rightPhotoPath = noPhotoPath;
  }

  if (!leftPhoto && rightPhoto) {
    leftPhotoPath = noPhotoPath;
    rightPhotoPath = `${photosDir}${rightPhoto.file_rel_path}${rightPhoto.file_extension}`;
  }

  if (!leftPhoto && !rightPhoto) {
    polesWithoutPhoto++;
    leftPhotoPath = noPhotoPath;
    rightPhotoPath = noPhotoPath;
  }

  splitColumnsAndPdf(pole, coordinates, leftPhotoPath, rightPhotoPath);
}

let polesInLeftColumn: any[][] = [];
let polesInRightColumn: any[][] = [];

function splitColumnsAndPdf(
  pole: number,
  coordinates: number[],
  leftPhotoPath: string,
  rightPhotoPath: string
) {
  if (pole % 2 !== 0) {
    polesInLeftColumn.push([pole, coordinates, leftPhotoPath, rightPhotoPath]);
  } else if (pole % 2 === 0) {
    polesInRightColumn.push([pole, coordinates, leftPhotoPath, rightPhotoPath]);
  } else {
    throw new Error(
      `${chalk.redBright.bold('Algum poste está nomeado incorretamente')}`
    );
  }

  if (
    polesInLeftColumn.length - polesInRightColumn.length > 1 ||
    polesInRightColumn.length - polesInLeftColumn.length > 1
  ) {
    throw new Error(
      `${chalk.redBright.bold(
        'Provavelmente a numeração dos postes está incorreta no kmz, verifique e tente novamente!'
      )}`
    );
  }

  const polesInMemory = polesInLeftColumn.length + polesInRightColumn.length;

  if (
    polesInMemory === polesInPdf ||
    (polesAmount < polesInPdf && polesInMemory === polesAmount)
  ) {
    createColumns(polesInLeftColumn, polesInRightColumn);
  }
}

function createColumns(
  polesInLeftColumn: any[][],
  polesInRightColumn: any[][]
) {
  polesInLeftColumn.forEach(async (photoTableInLeftColumn, index) => {
    let photoTableInRightColumn = polesInRightColumn[index];

    if (!photoTableInLeftColumn) {
      photoTableInLeftColumn = [null, [0, 0, 0], noPhotoPath, noPhotoPath];
    }

    if (!photoTableInRightColumn) {
      photoTableInRightColumn = [null, [0, 0, 0], noPhotoPath, noPhotoPath];
    }

    let pageBreak;
    if (photos.length % 4 === 0 && photos.length !== 0) {
      pageBreak = 'before';
    }

    const leftAndRightColumnWithleftAndRightPhotosInARow = {
      style: 'columns',
      columns: [
        {
          width: '50%',
          table: {
            widths: [photoWidth, photoWidth],
            heights: [12, photoHeight],
            body: [
              [
                {
                  style: 'titlePhotoTable',
                  colSpan: 2,
                  text: `Poste ${parseInt(
                    photoTableInLeftColumn[0]
                  )} | Lat. ${parseFloat(
                    photoTableInLeftColumn[1][1].toFixed(4)
                  )} Lon. ${parseFloat(
                    photoTableInLeftColumn[1][0].toFixed(4)
                  )}`,
                },
                '',
              ],
              [
                {
                  image: photoTableInLeftColumn[2],
                  width: photoWidth,
                  height: photoHeight,
                },
                {
                  image: photoTableInLeftColumn[3],
                  width: photoWidth,
                  height: photoHeight,
                },
              ],
            ],
          },
        },
        {
          width: '50%',
          table: {
            widths: [photoWidth, photoWidth],
            heights: [12, photoHeight],
            body: [
              [
                {
                  style: 'titlePhotoTable',
                  colSpan: 2,
                  text: `Poste ${parseInt(
                    photoTableInRightColumn[0]
                  )} | Lat. ${parseFloat(
                    photoTableInRightColumn[1][1].toFixed(4)
                  )} Lon. ${parseFloat(
                    photoTableInRightColumn[1][0].toFixed(4)
                  )}`,
                },
                '',
              ],
              [
                {
                  image: photoTableInRightColumn[2],
                  width: photoWidth,
                  height: photoHeight,
                },
                {
                  image: photoTableInRightColumn[3],
                  width: photoWidth,
                  height: photoHeight,
                },
              ],
            ],
          },
        },
      ],
      columnGap: photoGap,
      pageBreak,
    };

    photos.push(leftAndRightColumnWithleftAndRightPhotosInARow);

    if (photos.length === polesInPdf / 2) {
      polesAmount -= polesInPdf;
      createPdf();
    }

    if (
      polesAmount < polesInPdf &&
      photos.length === Math.ceil(polesAmount / 2)
    ) {
      await createPdf();

      fs.rmSync(`${kmlAndCloudMediaDir}/cloud_media`, {
        recursive: true,
        force: true,
      });
      fs.rmSync(`${kmlAndCloudMediaDir}/doc.kml`);

      mergePdfs();
    }
  });
}

let pdfNumber = 0;

async function createPdf() {
  return new Promise((resolve) => {
    pdfNumber++;

    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    const writeStream = fs.createWriteStream(
      `${pdfsToMergeDir}/${pdfNumber}.pdf`
    );

    pdfDoc.pipe(writeStream);
    pdfDoc.end();

    photos.length = 0;
    polesInLeftColumn.length = 0;
    polesInRightColumn.length = 0;

    pdfDoc.on('end', resolve);
  });
}

async function mergePdfs() {
  const pdfsToMerge = fs.readdirSync(pdfsToMergeDir);

  setTimeout(() => {
    for (const pdf of pdfsToMerge) {
      merger.add(`${pdfsToMergeDir}/${pdf}`);
      fs.rmSync(`${pdfsToMergeDir}/${pdf}`);
    }

    merger.save(`output/photographic-report.pdf`);
  }, 500);

  // show info in terminal
  console.log('');
  console.log(
    `${chalk.greenBright(`Relatório gerado`)} ${chalk.gray(
      `[${(Date.now() - begin) / 1000}s] ✅`
    )}`
  );
  console.log('');
  console.log(`☦️ Total de postes: ${chalk.cyanBright(polesAmountImmutable)}`);
  console.log(`📷 Fotos no kmz: ${chalk.cyanBright(photosAmount)}`);
  console.log(`📂 Postes sem foto: ${chalk.cyanBright(polesWithoutPhoto)}`);
  console.log(`📌 Marcadores ignorados: ${chalk.cyanBright(ignoredMarkers)}`);
}
