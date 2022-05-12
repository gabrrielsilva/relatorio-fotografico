import chalk from 'chalk';
import decompress from 'decompress';
import fs from 'fs';
import PDFMerger from 'pdf-merger-js';
import { createPDF } from './create';
import { setHeader, startTime } from './header';
import './styles';
import { convertKmlToGeoJson } from './toGeoJson';

export const photos: any[] = [];

const processId = process.pid;

const photoWidth = 120,
      photoHeight = 150,
      photoGap = 30,
      imagesDir = `src/static/images`,
      noPhotoPath = `${imagesDir}/no-photo-infinitel.png`;

const inputFileDir = `input`,
      inputFile = fs.readdirSync(inputFileDir),
      kmlCloudMediaDir = `src/kml-cloud-media`,
      pdfsToMergeDir = `src/pdfs-to-merge`;

let   POLES_IN_PDF = 96,
      polesAmount = 0,
      polesAmountImmutable = 0,
      polesWithoutPhoto = 0,
      photosAmount = 0,
      ignoredMarkers = 0;

const merger = new PDFMerger();

(async() => {
  console.log(chalk.blueBright(`Process PID: ${processId}\n`));

  const filename = inputFile[0];

  if (filename) checkInputFileExtension(filename)
  else throw new Error(chalk.redBright(`Coloque um arquivo KMZ na pasta input`))
})()

async function checkInputFileExtension(filename: string) {
  const extension = filename.split(`.`).pop();

  if (extension === 'kmz') {
    console.log(chalk.yellow(`KMZ Detectado...`));
    console.log('');
    
    await setHeader();

    extractKmlFileAndMediaFolder(filename);
  } else {
    throw new Error(chalk.redBright(`O arquivo de entrada não é um KMZ`))
  }
}

async function extractKmlFileAndMediaFolder(filename: string) {
  if (fs.existsSync(kmlCloudMediaDir)) {
    fs.rmSync(kmlCloudMediaDir, { recursive: true, force: true });
  }

  if (fs.existsSync(pdfsToMergeDir)) {
    fs.rmSync(pdfsToMergeDir, { recursive: true, force: true });
  }

  fs.mkdirSync(kmlCloudMediaDir);
  fs.mkdirSync(pdfsToMergeDir);

  fs.copyFileSync(
    `${inputFileDir}/${filename}`,
    `${kmlCloudMediaDir}/${filename}`
  );

  fs.renameSync(
    `${kmlCloudMediaDir}/${filename}`,
    `${kmlCloudMediaDir}/${filename}.zip`
  )

  await decompress(
    `${kmlCloudMediaDir}/${filename}.zip`,
    kmlCloudMediaDir
  )

  fs.rmSync(`${kmlCloudMediaDir}/${filename}.zip`);
  fs.readdirSync(kmlCloudMediaDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => {
      if (dirent.name !== 'cloud_media') {
        fs.renameSync(
          `${kmlCloudMediaDir}/${dirent.name}`,
          `${kmlCloudMediaDir}/cloud_media`
        )
      }
    })

  const itemsInFolder = fs.readdirSync(kmlCloudMediaDir);
    
  // check if doc.kml and cloud_media exist
  if (itemsInFolder.length > 1) {
    const cloudMediaDir = `${kmlCloudMediaDir}/cloud_media`,
          cloudMediaFiles = fs.readdirSync(cloudMediaDir);

    photosAmount = cloudMediaFiles.length;

    for await (const file of cloudMediaFiles) {
      fs.renameSync(
        `${cloudMediaDir}/${file}`,
        `${cloudMediaDir}/${file}.png`
      )
    }

    getGeoJsonFromKml();
  } else {
    throw new Error('Erro de extração do KMZ');
  }
}

async function getGeoJsonFromKml() {
  const GEOJSON = await convertKmlToGeoJson(`${kmlCloudMediaDir}/doc.kml`)

  // console.log(GEOJSON);
  
  await GEOJSON.features.forEach((marker: any) => {
    const poleName = JSON.stringify(marker.properties.name);

    if (poleName) {
      const pole = poleName.replace(/"/g, '').replace(/​/g, '');

      if (pole.includes('.')) {
        console.log(chalk.bgYellow.black(`O marcador ${pole} foi ignorado pois ainda não há suporte a casas decimais`));
      }

      if (Number(pole) && !pole.includes('.')) polesAmount++;
    }

    polesAmountImmutable = polesAmount;
  })

  for (let index = 0; index <= polesAmountImmutable; index++) {
    GEOJSON.features.filter((marker: any) => {
      if (marker.properties.name) {
        const poleName = JSON.stringify(marker.properties.name);
        const pole = parseFloat(poleName.replace(/"/g, '').replace(/​/g, '')),
              photos = marker.properties.com_exlyo_mapmarker_images_with_ext as
              | string
              | undefined,
              coordinates = marker.geometry.coordinates as Array<number>;

        let   leftPhoto,
              rightPhoto;

        if (photos) {
          const photosObject = JSON.parse(photos as string);
          leftPhoto = photosObject[0];
          rightPhoto = photosObject[1];
        } else {
          leftPhoto = undefined;
          rightPhoto = undefined;
        }
        
        if (!pole.toString().includes('.') && pole === index) { 
          setLeftAndRightPhotos(
            pole,
            coordinates,
            leftPhoto,
            rightPhoto
          );
        }
      } else {
        ignoredMarkers++;
      }
    })
  }
}

function setLeftAndRightPhotos(
  pole: number,
  coordinates: number[],
  leftPhoto: any,
  rightPhoto: any
) {
  const photosDir = 'src/kml-cloud-media/';

  let leftPhotoPath = '',
      rightPhotoPath = '';

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

  splitColumns(pole, coordinates, leftPhotoPath, rightPhotoPath);
}

export let polesInLeftColumn: any[][] = [],
           polesInRightColumn: any[][] = [];

function splitColumns(
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
    throw new Error(chalk.redBright('Algum poste está nomeado incorretamente'));
  }

  if (
    polesInLeftColumn.length - polesInRightColumn.length > 1 ||
    polesInRightColumn.length - polesInLeftColumn.length > 1
  ) {
    throw new Error(chalk.redBright('Há algum marcador intruso ou faltando!'));
  }

  const POLES_IN_MEMORY = polesInLeftColumn.length + polesInRightColumn.length;
  
  if (
    POLES_IN_MEMORY === POLES_IN_PDF ||
    (polesAmount < POLES_IN_PDF && POLES_IN_MEMORY === polesAmount)
  ) {
    createColumns(polesInLeftColumn, polesInRightColumn);
  }
}

async function createColumns(polesInLeftColumn: any[][], polesInRightColumn: any[][]) {
  polesInLeftColumn.forEach(async (tableLeft, i) => {
    let tableRight = polesInRightColumn[i];

    if (!tableLeft) { tableLeft = [null, [0, 0, 0], noPhotoPath, noPhotoPath] };
    if (!tableRight) { tableRight = [null, [0, 0, 0], noPhotoPath, noPhotoPath] };

    let pageBreak;
    if (photos.length % 4 === 0 && photos.length !== 0) pageBreak = 'before';

    const leftAndRightColumnWithTablesAndPhotos = {
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
                    tableLeft[0]
                  )} | Lat. ${parseFloat(
                    tableLeft[1][1].toFixed(4)
                  )} Lon. ${parseFloat(
                    tableLeft[1][0].toFixed(4)
                  )}`,
                },
                '',
              ],
              [
                {
                  image: tableLeft[2],
                  width: photoWidth,
                  height: photoHeight,
                },
                {
                  image: tableLeft[3],
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
                    tableRight[0]
                  )} | Lat. ${parseFloat(
                    tableRight[1][1].toFixed(4)
                  )} Lon. ${parseFloat(
                    tableRight[1][0].toFixed(4)
                  )}`,
                },
                '',
              ],
              [
                {
                  image: tableRight[2],
                  width: photoWidth,
                  height: photoHeight,
                },
                {
                  image: tableRight[3],
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

    photos.push(leftAndRightColumnWithTablesAndPhotos);
    
    if (photos.length === POLES_IN_PDF / 2) {
      polesAmount = polesAmount - POLES_IN_PDF;
      
      await createPDF();
    }
    
    // last pdf
    if (
      polesAmount < POLES_IN_PDF &&
      photos.length === Math.ceil(polesAmount / 2)
    ) {
      createPDF();
      setTimeout(() => {
        mergePDFS();
      }, 500)
    }
  })
}

function mergePDFS() {
  const pdfs = fs.readdirSync(pdfsToMergeDir);

  for (const pdf of pdfs) {
    merger.add(`${pdfsToMergeDir}/${pdf}`);
    fs.rmSync(`${pdfsToMergeDir}/${pdf}`);
  }

  merger.save(`output/relatorio.pdf`);

  console.log('');
  console.log(`${chalk.greenBright(`RELATÓRIO GERADO`)} ${chalk.gray(`[${(Date.now() - startTime) / 1000}s]`)}`);
  console.log('');
  console.log(`Total de postes: ${chalk.rgb(255, 110, 0)(polesAmountImmutable)}`);
  console.log(`Fotos no kmz: ${chalk.rgb(255, 110, 0)(photosAmount)}`);
  console.log(`Postes sem foto: ${chalk.rgb(255, 110, 0)(polesWithoutPhoto)}`);
  // console.log(`Marcadores ignorados: ${chalk.rgb(255, 110, 0)(Math.floor(ignoredMarkers / POLES_IN_PDF))}`);
}