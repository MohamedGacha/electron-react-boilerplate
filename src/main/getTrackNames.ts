import fs from 'fs';
import path from 'path';

const getTrackNames = (): string[] => {
  const setupsPath = path.join(
    process.env.HOME || process.env.USERPROFILE || '',
    'Documents',
    'Assetto Corsa Competizione',
    'Setups',
  );
  const trackSet = new Set<string>();

  if (!fs.existsSync(setupsPath)) return [];

  const carFolders = fs
    .readdirSync(setupsPath, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  carFolders.forEach((carFolder) => {
    const carPath = path.join(setupsPath, carFolder);
    const trackFolders = fs
      .readdirSync(carPath, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);
    trackFolders.forEach((track) => trackSet.add(track));
  });

  return Array.from(trackSet);
};

export default getTrackNames;
