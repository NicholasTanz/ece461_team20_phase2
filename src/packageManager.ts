import { Router, Request, Response, RequestHandler } from 'express';
import multer, { StorageEngine } from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import logger from './logger';
import { fetchNpmPackageVersions } from './versionChecker';

const router = Router();

//for debugging
// NATO Phonetic Alphabet
const NATO_ALPHABET = [
  'Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot',
  'Golf', 'Hotel', 'India', 'Juliett', 'Kilo', 'Lima',
  'Mike', 'November', 'Oscar', 'Papa', 'Quebec', 'Romeo',
  'Sierra', 'Tango', 'Uniform', 'Victor', 'Whiskey',
  'X-ray', 'Yankee', 'Zulu'
];

// // Configure multer for file uploads
// const storage: StorageEngine = multer.diskStorage({
//   destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
//     cb(null, 'uploads/');  // Save files to 'uploads' directory
//   },
//   filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
//     cb(null, Date.now() + '-' + file.originalname);  // Generate unique file name
//   }
// });
// const upload = multer({ storage });

// Configure multer for file uploads
const storage: StorageEngine = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    cb(null, 'uploads/');
  },
  filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    const randomWord = NATO_ALPHABET[Math.floor(Math.random() * NATO_ALPHABET.length)];
    const newFileName = `${randomWord}-test-package${path.extname(file.originalname)}`;
    cb(null, newFileName);
  }
});
const upload = multer({ storage });

// Ensure that the downloads directory exists
const downloadsDir = path.join(__dirname, '../../downloads');
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true });  // Create downloads folder if it doesn't exist
}

// Define upload handler separately to ensure TypeScript compatibility
const uploadHandler = (req: Request, res: Response): void => {
  const file = req.file;

  if (!file) {
    res.status(400).send('No file uploaded.');
    return;
  }

  const packageName = file.originalname;
  const packageVersion = '1.0.0';  // Replace with actual version if available
  const packageId = uuidv4();      // Generate a unique ID for the package
  const uploadPath = path.join(__dirname, '../../uploads', packageName);

  // Update or upload the package
  if (fs.existsSync(uploadPath)) {
    fs.unlinkSync(uploadPath);
    logger.info(`Package ${packageName} updated.`);
  } else {
    logger.info(`Package ${packageName} uploaded.`);
  }

  // Return the response in the specified format
  res.status(201).json({
    metadata: {
      Name: packageName,
      Version: packageVersion,
      ID: packageId
    },
    //data: {
      //Content: fileContent,
      //JSProgram: '' // Placeholder for JS Program field if required
    //}
  });
};

// Attach the uploadHandler to the route
router.post('/upload', upload.single('package'), uploadHandler);

// Download a package
router.get('/download', async (req: Request, res: Response): Promise<void> => {
  const packageNames = req.query.packageNames as string | string[];

  const packageList = Array.isArray(packageNames) ? packageNames : [packageNames].filter(Boolean);

  if (packageList.length === 0) {
    res.status(400).send('No package names provided.');
    return;
  }

  const results = await Promise.all(
    packageList.map(async (packageName) => {
      const uploadPath = path.join(__dirname, '../../uploads', packageName);
      const downloadFilePath = path.join(downloadsDir, packageName);

      if (fs.existsSync(uploadPath)) {
        fs.renameSync(uploadPath, downloadFilePath);
        logger.info(`Package ${packageName} moved to downloads directory: ${downloadFilePath}`);
        return { packageName, status: 'success', path: downloadFilePath };
      } else {
        logger.warn(`Package ${packageName} not found for download.`);
        return { packageName, status: 'not found' };
      }
    })
  );

  res.json({ results });
});



// Example usage of fetchNpmPackageVersions
async function showPackageVersions() {
  const packageName = 'axios';  // Example npm package name

  try {
    const versions = await fetchNpmPackageVersions(packageName);
    console.log(`Available versions for ${packageName}:`, versions);
  } catch (error) {
    console.error((error as Error).message);
  }
}

showPackageVersions();

export default router;

// Directory where packages are stored
const uploadsDir = path.join(__dirname, '../../uploads');

export async function packageSearch(regexPattern: string): Promise<{ packageName: string, match: string }[]> {
  const regex = new RegExp(regexPattern, 'i'); // Case-insensitive regex
  const results: { packageName: string, match: string }[] = [];

  const files = fs.readdirSync(uploadsDir);

  for (const file of files) {
    const packagePath = path.join(uploadsDir, file);
    let readmeContent = '';

    // Checks if the package has a README file
    const readmePath = path.join(packagePath, 'README.md');
    if (fs.existsSync(readmePath)) {
      readmeContent = fs.readFileSync(readmePath, 'utf-8');
    }

    // Checks if the package name or README content matches the regex
    if (regex.test(file) || regex.test(readmeContent)) {
      results.push({ packageName: file, match: readmeContent });
    }
  }

  return results;
}

router.post('/search', async (req: Request, res: Response): Promise<void> => {
  const { regexPattern } = req.body;

  if (!regexPattern) {
    res.status(400).send('Regex pattern is required.');
    return;
  }

  try {
    const results = await packageSearch(regexPattern);
    res.json({ results });
    return;
  } catch (error) {
    res.status(500).send('Error searching for packages.');
    return;
  }
});
