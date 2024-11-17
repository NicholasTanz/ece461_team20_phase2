import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import logger from './logger';

const router = Router();
const downloadsDir = path.join(__dirname, '../../downloads');
const uploadsDir = path.join(__dirname, '../../uploads');

// Ensure that the downloads directory exists
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true });
}

// Download a package
router.get('/download', async (req: Request, res: Response): Promise<void> => {
  try {
    const packageNames = req.query.packageNames as string | string[];

    // Validate the packageNames parameter
    if (!packageNames) {
      res.status(400).json({ error: 'No package names provided.' });
      return;
    }

    // Convert to an array if it's a single package name
    const packageList = Array.isArray(packageNames) ? packageNames : [packageNames];

    const results = await Promise.all(
      packageList.map(async (packageName) => {
        const uploadPath = path.join(uploadsDir, packageName);
        const downloadFilePath = path.join(downloadsDir, packageName);

        // Check if the package exists in the uploads directory
        if (fs.existsSync(uploadPath)) {
          // Move the package to the downloads directory
          fs.renameSync(uploadPath, downloadFilePath);
          logger.info(`Package ${packageName} moved to downloads directory: ${downloadFilePath}`);

          const content = fs.readFileSync(downloadFilePath).toString('base64');
          return {
            metadata: {
              Name: packageName,
              Version: '1.0.0', // Default version, can be updated if needed
              ID: uuidv4()
            },
            data: {
              Content: content
            }
          };
        } else {
          logger.warn(`Package ${packageName} not found for download.`);
          return { packageName, status: 'not found' };
        }
      })
    );

    res.status(200).json({ results });
  } catch (error) {
    logger.error(`Error downloading package: ${(error as Error).message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Download a package by ID
router.get('/download/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const uploadPath = path.join(uploadsDir, `${id}.zip`);
    const downloadFilePath = path.join(downloadsDir, `${id}.zip`);

    // Check if the package exists
    if (fs.existsSync(uploadPath)) {
      // Move the package to the downloads directory
      fs.renameSync(uploadPath, downloadFilePath);
      logger.info(`Package with ID ${id} moved to downloads directory: ${downloadFilePath}`);

      const content = fs.readFileSync(downloadFilePath).toString('base64');

      res.status(200).json({
        metadata: {
          Name: id,
          Version: '1.0.0', // Default version, can be updated if needed
          ID: id
        },
        data: {
          Content: content
        }
      });
      return;
    } else {
      logger.warn(`Package with ID ${id} not found.`);
      res.status(404).json({ error: 'Package not found.' });
      return;
    }
  } catch (error) {
    logger.error(`Error downloading package by ID: ${(error as Error).message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
