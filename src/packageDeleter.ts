import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import logger from './logger';

const router = Router();

const uploadsDir = path.join(__dirname, 'uploads');

// DELETE /package/:id
router.delete('/package/:id', (req: Request, res: Response) => {
  const { id } = req.params;

  // Validate Package ID
  if (!id) {
    res.status(400).send('There is missing field(s) in the PackageID or invalid');
    return;
  }

  try {
    // Search for metadata file with matching ID
    const metadataFiles = fs
      .readdirSync(uploadsDir)
      .filter((file) => file.endsWith('-metadata.json'));

    let found = false;
    let metadataFilePath: string | null = null;
    let associatedZipFilePath: string | null = null;

    for (const file of metadataFiles) {
      const filePath = path.join(uploadsDir, file);
      const metadata = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

      if (metadata.ID === id) {
        found = true;
        metadataFilePath = filePath;
        associatedZipFilePath = path.join(uploadsDir, `${metadata.Name}-${metadata.Version}.zip`);
        break;
      }
    }

    if (!found) {
      res.status(404).send('Package does not exist.');
      return;
    }

    // Delete the metadata file
    if (metadataFilePath && fs.existsSync(metadataFilePath)) {
      fs.unlinkSync(metadataFilePath);
      logger.info(`Deleted metadata file: ${metadataFilePath}`);
    }

    // Delete the associated zip file
    if (associatedZipFilePath && fs.existsSync(associatedZipFilePath)) {
      fs.unlinkSync(associatedZipFilePath);
      logger.info(`Deleted package zip file: ${associatedZipFilePath}`);
    }

    res.status(200).send('Package is deleted.');
  } catch (error) {
    logger.error(`Error deleting package ${id}: ${(error as Error).message}`);
    res.status(500).send('Internal server error.');
  }
});

export default router;
