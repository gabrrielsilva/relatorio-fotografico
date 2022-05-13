import chalk from 'chalk';
import decompress from 'decompress';
import fs from 'fs';
import PDFMerger from 'pdf-merger-js';
import { createPDF } from './create';
import { setHeader, startTime } from './header';
import './styles';
import { convertKmlToGeoJson } from './toGeoJson';

export const photos: any[] = [],
             subs: any[] = [];

const photoWidth = 120,
      photoHeight = 150,
      photoGap = 30,
      imagesDir = `src/static/images`,
      noPhotoPath = `${imagesDir}/no-photo-infinitel.png`;

const inputFileDir = `input`,
      inputFile = fs.readdirSync(inputFileDir),
      kmlMediaDir = `src/kml-cloud-media`,
      pdfsToMergeDir = `src/pdfs-to-merge`;

let   GEOJSON: any,
      POLES_IN_PDF = 96,
      polesAmount = 0,
      polesAmountImmutable = 0,
      polesWithoutPhoto = 0,
      photosAmount = 0,
      subsMarkerAmount = 0,
      subsAmount = 0,
      subsAmountImmutable = 0,
      ignoredMarkers = 0,
      renamedMediaFolder = false;

const merger = new PDFMerger();

(async() => {
  const filename = inputFile[0];

  if (filename) checkInputFileExtension(filename)
  else throw new Error(chalk.redBright(`Coloque um arquivo KMZ na pasta input`))
})()

async function checkInputFileExtension(filename: string) {
  const extension = filename.split(`.`).pop();

  if (extension === 'kmz') {
    console.log(chalk.blueBright(`KMZ Detectado...`));
    console.log('');
    
    await setHeader();

    extractKmlFileAndMediaFolder(filename);
  } else {
    throw new Error(chalk.redBright(`O arquivo de entrada não é um KMZ`))
  }
}

async function extractKmlFileAndMediaFolder(filename: string) {
  if (fs.existsSync(kmlMediaDir)) {
    fs.rmSync(kmlMediaDir, { recursive: true, force: true });
  }

  if (fs.existsSync(pdfsToMergeDir)) {
    fs.rmSync(pdfsToMergeDir, { recursive: true, force: true });
  }

  fs.mkdirSync(kmlMediaDir);
  fs.mkdirSync(pdfsToMergeDir);

  fs.copyFileSync(
    `${inputFileDir}/${filename}`,
    `${kmlMediaDir}/${filename}`
  );

  fs.renameSync(
    `${kmlMediaDir}/${filename}`,
    `${kmlMediaDir}/${filename}.zip`
  )

  await decompress(
    `${kmlMediaDir}/${filename}.zip`,
    kmlMediaDir
  )

  fs.rmSync(`${kmlMediaDir}/${filename}.zip`);

  fs.readdirSync(kmlMediaDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(async dirent => {
      const itemsInFolder = fs.readdirSync(kmlMediaDir);
        
      if (itemsInFolder.length > 1) {
        const cloudMediaDir = `${kmlMediaDir}/${dirent.name}`,
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
    })
}

async function getGeoJsonFromKml() {
  GEOJSON = await convertKmlToGeoJson(`${kmlMediaDir}/doc.kml`)

  await GEOJSON.features.forEach((marker: any) => {
    if (marker.properties.name) {
      const pole = JSON.stringify(marker.properties.name).replace(/["​]/g, ''),
            photos = marker.properties.com_exlyo_mapmarker_images_with_ext as string;

      if (photos && !renamedMediaFolder) { 
        const photosObject = JSON.parse(photos) as Array<any>,
        mediaFolderName = photosObject[0].file_rel_path.match(/(\S+)\//)[1] as string;
        
        fs.readdirSync(kmlMediaDir, { withFileTypes: true })
          .filter(dirent => dirent.isDirectory())
          .map(async dirent => {
            fs.renameSync(
              `${kmlMediaDir}/${dirent.name}`,
              `${kmlMediaDir}/${mediaFolderName}`  
            );
          })
      }

      if (pole) {;
        if (pole.includes('.')) {
          console.log(chalk.bgYellow.black(`O marcador ${pole} foi ignorado pois ainda não há suporte a casas decimais`));
        }

        if (Number(pole) && !pole.includes('.')) polesAmount++;
      }

      polesAmountImmutable = polesAmount;
    }
  })

  for (let index = 0; index <= polesAmountImmutable; index++) {
    GEOJSON.features.filter((marker: any) => {
      if (marker.properties.name) {
        const markerIdentifier = JSON.stringify(marker.properties.name).replace(/["​]/g, '');

        // parseFloat to identify decimal places
        const pole = parseFloat(markerIdentifier),
              photos = marker.properties.com_exlyo_mapmarker_images_with_ext,
              coordinates = marker.geometry.coordinates as Array<number>;

        let   leftPhoto,
              rightPhoto;

        if (photos) {
          const photosObject = JSON.parse(photos);
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
      polesAmount -= POLES_IN_PDF;
      
      await createPDF();
    }
    
    // last pdf
    if (
      polesAmount < POLES_IN_PDF &&
      photos.length === Math.ceil(polesAmount / 2)
    ) {
      createPDF();
      setTimeout(() => { mergePDFS() }, 1000)
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

  console.log(`${chalk.greenBright(`RELATÓRIO GERADO`)} ${chalk.gray(`[${(Date.now() - startTime) / 1000}s]`)}`);
  console.log('');
  console.log(`Total de postes: ${chalk.rgb(255, 110, 0)(polesAmountImmutable)}`);
  console.log(`Fotos no kmz: ${chalk.rgb(255, 110, 0)(photosAmount)}`);
  console.log(`Postes sem foto: ${chalk.rgb(255, 110, 0)(polesWithoutPhoto)}`);
  // console.log(`Marcadores ignorados: ${chalk.rgb(255, 110, 0)(Math.floor(ignoredMarkers / POLES_IN_PDF))}`);
}