import boxen from 'boxen';
import chalk from 'chalk';
import { Spinner } from 'cli-spinner';
import decompress from 'decompress';
import dotenv from 'dotenv';
import fs from 'fs';
import PDFMerger from 'pdf-merger-js';
import { createPDF } from './create';
import { setHeader, startTime } from './header';
import './styles';
import { convertKmlToGeoJson } from './toGeoJson';
dotenv.config();

export const photos: any[] = [],
             polesInLeftColumn: any[] = [],
             polesInRightColumn: any[] = [],
             undergroundsInLeftColumn: any[] = [],
             undergroundsInRightColumn: any[] = [];

const photoWidth = 120,
      photoHeight = 150,
      photoGap = 30;

const inputFileDir = 'input',
      kmlMediaDir = 'src/kml-media',
      pdfsToMergeDir = 'src/pdfs-to-merge',
      imagesDir = 'src/static/images',
      input = fs.readdirSync(inputFileDir),
      noPhoto = `${imagesDir}/no-photo-infinitel.png`;

let   GEOJSON: any,
      polesInPdf = 96,
      polesAmountRecursive = 0,
      polesAmountImmutable = 0,
      polesWithoutPhoto = 0,
      undergroundMarkersAmount = 0,
      photosAmount = 0,
      ignoredMarkers = 0,
      renamedMediaFolder = false;

const merger = new PDFMerger();

const spinner = new Spinner(chalk.yellow('Processando'));
      spinner.setSpinnerString('|/-\\');

(async() => {
  const filename = input[0];

  if (filename) checkInputFileExtension(filename)
  else throw new Error(chalk.redBright('Coloque um arquivo KMZ na pasta input'))
})()

async function checkInputFileExtension(filename: string) {
  const extension = filename.split(`.`).pop();

  if (extension === 'kmz') {
    console.log(chalk.blueBright('KMZ Detectado'));
    console.log('');
    
    await setHeader();

    spinner.start();

    extractKmlFileAndMediaFolder(filename);
  } else throw new Error(chalk.redBright('O arquivo de entrada não é um KMZ'))
}

async function extractKmlFileAndMediaFolder(filename: string) {
  if (fs.existsSync(kmlMediaDir)) fs.rmSync(kmlMediaDir, { recursive: true, force: true });
  if (fs.existsSync(pdfsToMergeDir)) fs.rmSync(pdfsToMergeDir, { recursive: true, force: true });

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

  await decompress(`${kmlMediaDir}/${filename}.zip`, kmlMediaDir);

  fs.rmSync(`${kmlMediaDir}/${filename}.zip`);

  fs.readdirSync(kmlMediaDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(async dirent => {
      const itemsInFolder = fs.readdirSync(kmlMediaDir);
        
      if (itemsInFolder.length > 1) {
        const mediaDir = `${kmlMediaDir}/${dirent.name}`,
              mediaFiles = fs.readdirSync(mediaDir);
    
        photosAmount = mediaFiles.length;
    
        for await (const file of mediaFiles) {
          fs.renameSync(
            `${mediaDir}/${file}`,
            `${mediaDir}/${file}.png`
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
      const markerName = JSON.stringify(marker.properties.name).replace(/["​]/g, ''),
            markerPhotos = marker.properties.com_exlyo_mapmarker_images_with_ext as string;

      if (markerPhotos && !renamedMediaFolder) {
        const photosObject = JSON.parse(markerPhotos) as Array<any>,

        // get the media folder name before the slash
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

      if (markerName.includes('.')) {
        console.log(chalk.bgYellow.black(`O marcador ${markerName} foi ignorado pois ainda não há suporte a casas decimais`));
      }

      // only number = pole
      if (Number(markerName) && !markerName.includes('.')) polesAmountRecursive++;

      polesAmountImmutable = polesAmountRecursive;

      // starts with sub = underground
      if (markerName.startsWith('sub')) {
        const photosInMarker = JSON.parse(marker.properties.com_exlyo_mapmarker_images_with_ext);
        
        undergroundMarkersAmount ++;
        undergroundPhotosAmount += photosInMarker.length;
      }
    }
  })

  

  for (let index = 0; index <= polesAmountImmutable; index++) {
    GEOJSON.features.filter((marker: any) => {
      if (marker.properties.name) {
        const markerName = JSON.stringify(marker.properties.name).replace(/["​]/g, '');

        // parseFloat to identify decimal places
        const pole = parseFloat(markerName),
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
  let leftPhotoPath = '',
      rightPhotoPath = '';

  if (leftPhoto && rightPhoto) {
    leftPhotoPath = `${kmlMediaDir}/${leftPhoto.file_rel_path}${leftPhoto.file_extension}`;
    rightPhotoPath = `${kmlMediaDir}/${rightPhoto.file_rel_path}${rightPhoto.file_extension}`;
  }

  if (leftPhoto && !rightPhoto) {
    leftPhotoPath = `${kmlMediaDir}/${leftPhoto.file_rel_path}${leftPhoto.file_extension}`;
    rightPhotoPath = noPhoto;
  }

  if (!leftPhoto && rightPhoto) {
    leftPhotoPath = noPhoto;
    rightPhotoPath = `${kmlMediaDir}/${rightPhoto.file_rel_path}${rightPhoto.file_extension}`;
  }

  if (!leftPhoto && !rightPhoto) {
    polesWithoutPhoto++;
    leftPhotoPath = noPhoto;
    rightPhotoPath = noPhoto;
  }

  splitColumns(pole, coordinates, leftPhotoPath, rightPhotoPath);
}

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
  ) throw new Error(chalk.redBright('Há algum marcador intruso ou faltando!'));

  const polesInMemory = polesInLeftColumn.length + polesInRightColumn.length;

  if (
    polesInMemory === polesInPdf ||
    (polesAmountRecursive < polesInPdf && polesInMemory === polesAmountRecursive)
  ) {
    createColumns();
  }
}

async function createColumns() {
  polesInLeftColumn.forEach(async (tableLeft, i) => {
    let tableRight = polesInRightColumn[i];

    if (!tableLeft) tableLeft = [null, [0, 0, 0], noPhoto, noPhoto];
    if (!tableRight) tableRight = [null, [0, 0, 0], noPhoto, noPhoto];

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
    
    if (photos.length === polesInPdf / 2) {
      polesAmountRecursive -= polesInPdf;
      
      await createPDF();
    }
    
    // last pdf
    if (
      polesAmountRecursive < polesInPdf &&
      photos.length === Math.ceil(polesAmountRecursive / 2)
    ) {
      createPDF();
      handleUndergrounds();
      // setTimeout(() => { mergePDFS() }, 1000)
    }
  })
}

let undergroundPhotosAmount = 0;

function handleUndergrounds() {
  for (let index = 0; index <= undergroundMarkersAmount; index++) {
    GEOJSON.features.filter(async (marker: any) => {
      if (marker.properties.name) {
        const markerName = JSON.stringify(marker.properties.name).replace(/["​]/g, '');
  
        if (markerName.startsWith('sub')) {
          const sub = Number(markerName.replace(/\D/gim, ''));
          
          if (sub === index) {
            const photosInMarker = JSON.parse(marker.properties.com_exlyo_mapmarker_images_with_ext);

            await photosInMarker.forEach((photo: any, i: number) => {
              // 0 is even
              if (i % 2 === 0) undergroundsInLeftColumn.push(photo);
              if (i % 2 !== 0) undergroundsInRightColumn.push(photo);
              
              if (undergroundsInLeftColumn.length + undergroundsInRightColumn.length === undergroundPhotosAmount) {
                createUndergroundColumns();
              }
            })
          }
        }
      }
    })
  }
}

function createUndergroundColumns() {
  let leftPhotoName = 1,
      rightPhotoName = 2;

  undergroundsInLeftColumn.forEach(async (leftPhoto, i) => {
    let rightPhotoRef = undergroundsInRightColumn[i],
        rightPhoto;
    
    if (rightPhotoRef) {
      rightPhoto = `${kmlMediaDir}/${rightPhotoRef.file_rel_path}${rightPhotoRef.file_extension}`;
    } else {
      rightPhoto = noPhoto;
    }

    let  pageBreak;
    if (photos.length % 4 === 0 && photos.length !== 0) pageBreak = 'before';
    
    const leftAndRightColumnWithTablesAndPhotos = {
      style: 'columns',
      columns: [
        {
          width: '50%',
          table: {
            widths: [240],
            heights: [12, photoHeight],
            body: [
              [
                {
                  style: 'titlePhotoTable',
                  text: `Subterrâneo ${leftPhotoName}`,
                }
              ],
              [
                {
                  image: `${kmlMediaDir}/${leftPhoto.file_rel_path}${leftPhoto.file_extension}`,
                  width: photoWidth,
                  height: photoHeight,
                }
              ],
            ]
          },
        },
        {
          width: '50%',
          table: {
            widths: [240],
            heights: [12, photoHeight],
            body: [
              [
                {
                  style: 'titlePhotoTable',
                  text: `Subterrâneo ${rightPhotoName}`
                }
              ],
              [
                {
                  image: rightPhoto,
                  width: photoWidth,
                  height: photoHeight,
                }
              ],
            ]
          },
        },
      ],
      columnGap: photoGap,
      pageBreak,
    };

    photos.push(leftAndRightColumnWithTablesAndPhotos);

    leftPhotoName+=2;
    rightPhotoName+=2;
    
    const subsInMemory = undergroundsInLeftColumn.length + undergroundsInRightColumn.length;
    
    if (photos.length === Math.ceil(subsInMemory / 2)) {
      createPDF();
      setTimeout(() => {
        mergePDFS();
      }, 1000)
    }
  })
}

function mergePDFS() {
  const pdfs = fs.readdirSync(pdfsToMergeDir);

  for (const pdf of pdfs) {
    merger.add(`${pdfsToMergeDir}/${pdf}`);
    fs.rmSync(`${pdfsToMergeDir}/${pdf}`);
  }

  merger.save('output/relatorio.pdf');
  spinner.stop(true);

  console.log('');
  console.log(boxen(
    chalk.italic(`Postes: ${polesAmountImmutable}\nSubterrâneos: ${undergroundPhotosAmount}\nFotos no kmz: ${photosAmount}\nSem foto: ${polesWithoutPhoto}`),
    { title: `${chalk.greenBright(`RELATÓRIO GERADO`)} ${chalk.gray(`[${(Date.now() - startTime) / 1000}s]`)}`,
    titleAlignment: 'center', textAlignment: 'center', borderColor: 'greenBright', padding: 2 })
  );
}