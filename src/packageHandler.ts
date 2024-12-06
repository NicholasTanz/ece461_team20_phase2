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

// GET /package/{id}
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
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


// POST /package/byRegEx
router.post('/byRegEx', async (req: Request, res: Response): Promise<void> => {
    const { RegEx } = req.body;
  
    // Validate input
    if (!RegEx) {
      res.status(400).send({
        error: 'There is missing field(s) in the PackageRegEx or it is formed improperly, or is invalid.',
      });
      return;
    }
  
    try {
      // Compile regex
      const regex = new RegExp(RegEx);
  
      // Read metadata files
      const metadataFiles = fs.readdirSync(uploadsDir).filter((file) => file.endsWith('-metadata.json'));
      const matchedPackages = metadataFiles
        .map((file) => {
          const metadata = JSON.parse(fs.readFileSync(path.join(uploadsDir, file), 'utf-8'));
          if (regex.test(metadata.Name)) {
            return {
              Version: metadata.Version,
              Name: metadata.Name,
              ID: metadata.ID,
            };
          }
          return null;
        })
        .filter((pkg): pkg is NonNullable<typeof pkg> => pkg !== null);
  
      if (matchedPackages.length === 0) {
        res.status(404).send({
          error: 'No package found under this regex.',
        });
        return;
      }
  
      // Format the response
      const response = {
        value: matchedPackages.map((pkg) => ({
          Version: pkg.Version,
          Name: pkg.Name,
          ID: pkg.ID,
        })),
      };
  
      res.status(200).json(response);
    } catch (error) {
      console.error(`Error processing regex search: ${(error as Error).message}`);
      res.status(500).send({
        error: 'Internal server error.',
      });
    }
  });
  

// GET /package/{id}/cost
router.get('/:id/cost', async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const dependency = req.query.dependency === 'true';
  
    // Validate inputs
    if (!id) {
      res.status(400).json({ error: 'Missing or invalid PackageID.' });
      return;
    }
  
    try {
      // Locate the package metadata
      const metadataFiles = fs.readdirSync(uploadsDir).filter((file) => file.endsWith('-metadata.json'));
      const metadataFile = metadataFiles.find((file) => file.includes(id));
  
      if (!metadataFile) {
        res.status(404).json({ error: 'Package does not exist.' });
        return;
      }
  
      const metadataPath = path.join(uploadsDir, metadataFile);
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
  
      const standaloneCost = metadata.Cost || 0;
  
      let responsePayload: Record<string, any> = {
        [id]: {
          standaloneCost: standaloneCost,
          totalCost: standaloneCost,
        },
      };
  
      if (dependency && metadata.Dependencies) {
        for (const dep of metadata.Dependencies) {
          const depMetadataFile = metadataFiles.find((file) => file.includes(dep));
  
          if (!depMetadataFile) {
            logger.error(`Dependency metadata file not found for ID: ${dep}`);
            res.status(500).json({
              error: `Failed to process dependency: ${dep}.`,
            });
            return;
          }
  
          const depMetadataPath = path.join(uploadsDir, depMetadataFile);
          const depMetadata = JSON.parse(fs.readFileSync(depMetadataPath, 'utf-8'));
          const depCost = depMetadata.Cost || 0;
  
          responsePayload[dep] = {
            standaloneCost: depCost,
            totalCost: depCost + responsePayload[id].totalCost,
          };
  
          responsePayload[id].totalCost += depCost;
        }
      }
  
      res.status(200).json(responsePayload);
    } catch (error) {
      logger.error(`Error fetching cost for package ${id}: ${(error as Error).message}`);
      res.status(500).json({ error: 'Internal server error.' });
    }
  });
  

// DELETE /package/:id
router.delete('/:id', (req: Request, res: Response) => {
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
