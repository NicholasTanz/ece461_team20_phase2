import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import axios from 'axios'; // For fetching files from URLs
import logger from './logger';

const router = Router();

// Paths for uploads and downloads
const uploadsDir = path.join(__dirname, 'uploads');
const downloadsDir = path.join(__dirname, '../downloads');

// Ensure the downloads directory exists
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true });
}

// GET /receiver/package/{id}
router.get('/package/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate the ID
    if (!id || typeof id !== 'string') {
      res.status(400).json({ error: "There is missing field(s) in the PackageID or it is formed improperly, or is invalid." });
      return;
    }

    // Search for the metadata file that contains the given ID
    const metadataFiles = fs
      .readdirSync(uploadsDir)
      .filter((file) => file.endsWith('-metadata.json'));

    let metadata: Record<string, any> | null = null;

    for (const file of metadataFiles) {
      const filePath = path.join(uploadsDir, file);
      try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        if (data.ID === id) {
          metadata = data;
          break;
        }
      } catch (error) {
        logger.warn(`Failed to parse metadata file: ${file}`);
      }
    }

    // If no matching metadata file is found, return 404
    if (!metadata) {
      logger.warn(`Metadata for package ${id} not found.`);
      res.status(404).json({ error: "Package does not exist." });
      return;
    }

    const { Name, Version, URL, JSProgram } = metadata;
    const uploadFilePath = path.join(uploadsDir, `${Name}-${Version}.zip`);
    const downloadFilePath = path.join(downloadsDir, `${Name}-${Version}.zip`);
    let content: string;

    // Check if the file already exists in the downloads directory
    if (fs.existsSync(downloadFilePath)) {
      content = fs.readFileSync(downloadFilePath).toString('base64');
    } else if (fs.existsSync(uploadFilePath)) {
      // Copy file from uploads to downloads
      fs.copyFileSync(uploadFilePath, downloadFilePath);
      content = fs.readFileSync(downloadFilePath).toString('base64');
    } else if (URL) {
      // Fetch the file from the URL if it's not locally available
      logger.info(`Fetching package from URL: ${URL}`);
      try {
        const response = await axios.get(URL, { responseType: 'arraybuffer' });
        const fileData = Buffer.from(response.data);

        // Save the file to downloads directory
        fs.writeFileSync(downloadFilePath, fileData);
        content = fileData.toString('base64');
      } catch (error) {
        logger.error(`Failed to fetch package from URL ${URL}: ${(error as Error).message}`);
        res.status(404).json({ error: "Package does not exist." });
        return;
      }
    } else {
      logger.warn(`File ${Name}-${Version}.zip not found in uploads or URL.`);
      res.status(404).json({ error: "Package does not exist." });
      return;
    }

    // Construct the response
  const formattedResponse = `
  metadata:
    Name: ${metadata.Name}
    Version: ${metadata.Version}
    ID: ${id}
  data:
    Content: ${
      content.length > 100
        ? `${content.slice(0, 100)}... [truncated]`
        : content
    }
    ${URL ? `URL: ${URL}` : ''}
    JSProgram: |
      ${JSProgram ? JSProgram.replace(/\n/g, '\n    ') : 'N/A'}
  `;

  // Send the formatted response
  res.status(200).send(formattedResponse);
  } catch (error) {
    logger.error(`Error downloading package ${req.params.id}: ${(error as Error).message}`);
    res.status(500).json({ error: "Internal server error." });
  }
});

export default router;
