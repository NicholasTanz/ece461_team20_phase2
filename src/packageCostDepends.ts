import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import logger from './logger';

const router = Router();
const uploadsDir = path.join(__dirname, 'uploads');

// GET /package/{id}/cost
router.get('/package/:id/cost', async (req: Request, res: Response): Promise<void> => {
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

export default router;
