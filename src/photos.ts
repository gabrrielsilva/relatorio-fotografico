import fs from 'fs';
import './styles';

export const photos: any[] = [];

const photoWidth = 120;
const photoHeight = 150;
const photoGap = 30;

const photosInLeftColumn: string[] = [];
const photosInRightColumn: string[] = [];

fs.readdir('photos', async (err, files) => {
  for await (const file of files) {
    const name = file.split('.'); // 20 . 1 . png

    if (Number(name[0]) % 2 === 0)
      photosInRightColumn.push(`${name[0]}.${name[1]}`); // even

    if (Number(name[0]) % 2 !== 0)
      photosInLeftColumn.push(`${name[0]}.${name[1]}`); // odd
  }

  const photoChunckInLeftColumn: string[][] =
    groupTwoPhotos(photosInLeftColumn);

  const photoChunckInRightColumn: string[][] =
    groupTwoPhotos(photosInRightColumn);

  createColumns(photoChunckInLeftColumn, photoChunckInRightColumn);
});

function groupTwoPhotos(arr: string[]) {
  let chunks = [],
    i = 0,
    n = arr.length;

  while (i < n) {
    chunks.push(arr.slice(i, (i += 2)));
  }

  return chunks;
}

function createColumns(
  photoChunckInLeftColumn: string[][],
  photoChunckInRightColumn: string[][]
) {
  photoChunckInLeftColumn.forEach((leftAndRightPhotoInLeftColumn, index) => {
    const leftAndRightPhotoInRightColumn = photoChunckInRightColumn[index];

    let pageBreak;
    if (photos.length % 4 === 0) {
      pageBreak = 'after';
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
                  text: `Poste ${parseInt(leftAndRightPhotoInLeftColumn[0])}`,
                },
                '',
              ],
              [
                {
                  image: `photos/${leftAndRightPhotoInLeftColumn[0]}.png`,
                  width: photoWidth,
                  height: photoHeight,
                },
                {
                  image: `photos/${leftAndRightPhotoInLeftColumn[1]}.png`,
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
                  text: `Poste ${parseInt(leftAndRightPhotoInRightColumn[0])}`,
                },
                '',
              ],
              [
                {
                  image: `photos/${leftAndRightPhotoInRightColumn[0]}.png`,
                  width: photoWidth,
                  height: photoHeight,
                },
                {
                  image: `photos/${leftAndRightPhotoInRightColumn[1]}.png`,
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
