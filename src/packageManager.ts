import { Router, Request, Response, RequestHandler } from 'express';
import multer, { StorageEngine } from 'multer';
import path from 'path';
import fs from 'fs';
import logger from './logger';
import { fetchNpmPackageVersions } from './versionChecker';

const router = Router();

// Configure multer for file uploads
const storage: StorageEngine = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    cb(null, 'uploads/');  // Save files to 'uploads' directory
  },
  filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    cb(null, Date.now() + '-' + file.originalname);  // Generate unique file name
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
  const uploadPath = path.join(__dirname, '../../uploads', packageName);

  if (fs.existsSync(uploadPath)) {
    fs.unlinkSync(uploadPath);  // Remove the old version
    logger.info(`Package ${packageName} updated.`);
  } else {
    logger.info(`Package ${packageName} uploaded.`);
  }

  // Save the new package
  fs.renameSync(file.path, uploadPath);

  res.send(`Package ${packageName} uploaded/updated successfully.`);
};


// Attach the uploadHandler to the route
router.post('/upload', upload.single('package'), uploadHandler);


// Download a package
router.get('/download/:packageName', (req: Request, res: Response) => {
  const packageName = req.params.packageName;
  const uploadPath = path.join(__dirname, '../../uploads', packageName);

  if (fs.existsSync(uploadPath)) {
    // Move the file to the downloads folder (cut operation)
    const downloadFilePath = path.join(downloadsDir, packageName);
    fs.renameSync(uploadPath, downloadFilePath);  // Move the file from uploads to downloads

    // Log the successful download and directory of the file
    logger.info(`Package ${packageName} moved to downloads directory: ${downloadFilePath}`);

    // Serve the file from the downloads directory
    res.download(downloadFilePath, packageName, (err: Error | undefined) => {
      if (err) {
        logger.error(`Error in downloading package ${packageName}: ${err}`);
        res.status(500).send('Error in downloading file.');
      }
    });
  } else {
    logger.warn(`Package ${packageName} not found for download.`);
    res.status(404).send('Package not found.');
  }
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
