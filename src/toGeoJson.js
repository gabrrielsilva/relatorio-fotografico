import { kml } from '@tmcw/togeojson';
import fs from 'fs';
import xmldom from 'xmldom';

const DOMParser = xmldom.DOMParser;

export const convertKmlToGeoJson = (kmlPath) => {
  const kmlfile = new DOMParser().parseFromString(
    fs.readFileSync(kmlPath, 'utf8')
  );
  const geoJson = kml(kmlfile);

  return geoJson;
};
