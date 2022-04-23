import decompress from 'decompress';
import dotenv from 'dotenv';
import fs from 'fs';
import './styles';
import { convertKmlToGeoJson } from './toGeoJson';
dotenv.config();

export const photos: any[] = [];

const photoWidth = 120;
const photoHeight = 150;
const photoGap = 30;

const inputFileDir = 'kmz';
const inputFile = fs.readdirSync(inputFileDir);
const kmlAndCloudMediaDir = 'src/kml-cloud-media';

let poleAmount = 0;
let photosAmount = 0;
let polesWithoutPhoto = 0;
let ignoredMarkers = 0;

(async () => {
  for await (const file of inputFile) {
    fs.copyFileSync(
      `${inputFileDir}/${file}`,
      `${kmlAndCloudMediaDir}/${file}`
    );

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

    const cloudMediaDir = `${kmlAndCloudMediaDir}/cloud_media`;
    const cloudMediaFiles = fs.readdirSync(cloudMediaDir);

    photosAmount = cloudMediaFiles.length;

    for (const file of cloudMediaFiles) {
      fs.renameSync(`${cloudMediaDir}/${file}`, `${cloudMediaDir}/${file}.png`);
    }
  }

  const geoJson = await convertKmlToGeoJson(`${kmlAndCloudMediaDir}/doc.kml`);

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
      poleAmount++;
      setLeftAndRightPhotos(Number(pole), coordinates, leftPhoto, rightPhoto);
    } else {
      ignoredMarkers++;
      console.log(`Marcador nomeado "${pole}" foi ignorado`);
    }
  });
})();

function setLeftAndRightPhotos(
  pole: number,
  coordinates: number[],
  leftPhoto: any,
  rightPhoto: any
) {
  let leftPhotoPath: string = '';
  let rightPhotoPath: string = '';

  const noPhotoPath = 'src/static/images/no-photo-infinitel.png';
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

  splitColumns(pole, coordinates, leftPhotoPath, rightPhotoPath);
}

let polesInLeftColumn: any[][] = [];
let polesInRightColumn: any[][] = [];

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
    console.log('Algum poste está nomeado incorretamente');
  }

  const polesAmountInMemory =
    polesInLeftColumn.length + polesInRightColumn.length;

  // fuck the memory. ps: nodejs streams

  if (polesAmountInMemory === 100) {
    createColumns(polesInLeftColumn, polesInRightColumn);
  }
}

function createColumns(
  polesInLeftColumn: any[][],
  polesInRightColumn: any[][]
) {
  polesInLeftColumn.forEach((photoTableInLeftColumn, index) => {
    const photoTableInRightColumn = polesInRightColumn[index];

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
  });
}

setTimeout(() => {
  console.log('Quantidade de postes:', poleAmount);
  console.log('Total de fotos no KMZ:', photosAmount);
  console.log('Postes sem foto:', polesWithoutPhoto);
  console.log('Marcadores ignorados:', ignoredMarkers);
}, 15000);
