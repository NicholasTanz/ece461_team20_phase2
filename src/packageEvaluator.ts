/**
 * Handles package evaluation and rating by retrieving or computing metrics based on metadata and package URLs.  
 * Provides a `/package/:id/rate` endpoint for fetching or updating package metrics, with caching and error handling.
 */

import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import logger from './logger';
import { processUrl } from './run'; // Adjust the path based on your directory structure

async function evaluatePackage(url: string) {
  try {
    const metrics = await processUrl(url);

    if (metrics) {
      console.log('Package Metrics:', metrics);
    } else {
      console.error('Invalid URL or metrics could not be calculated.');
    }
  } catch (error) {
    console.error('Error evaluating package:', error);
  }
}

const router = Router();

// Paths for uploads and downloads
const uploadsDir = path.join(__dirname, 'uploads');
const downloadsDir = path.join(__dirname, '../downloads');


// GET package/id
router.get('/package/:id/rate', async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: 'There is missing field(s) in the PackageID.' });
      return;
    }
  
    const metadataFiles = fs.readdirSync(uploadsDir).filter(file => file.endsWith('-metadata.json'));
    const metadataFile = metadataFiles.find(file => file.includes(id));
    if (!metadataFile) {
      res.status(404).json({ error: 'Package does not exist.' });
      return;
    }
  
    try {
      const metadataPath = path.join(uploadsDir, metadataFile);
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
  
      // Check if metrics are already cached
      if (
        metadata.metrics &&
        metadata.metrics.NetScore !== undefined &&
        metadata.metrics.License !== undefined
      ) {
        logger.info(`Returning cached metrics for package ID: ${id}`);
        res.status(200).json(metadata.metrics);
        return;
      }
  
      if (!metadata.URL) {
        res.status(400).json({ error: 'URL is missing in the package metadata.' });
        return;
      }
  
      logger.info(`Evaluating package with ID: ${id}, URL: ${metadata.URL}`);
      const metrics = await processUrl(metadata.URL);
  
      if (metrics.NetScore === 0 || metrics.NetScore === -1) {
        res.status(500).json({ error: 'The package rating system choked on at least one of the metrics.' });
        return;
      }
  
      // Save calculated metrics back to the metadata
      metadata.metrics = metrics;
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
  
      res.status(200).json(metrics);
    } catch (error) {
      logger.error(`Error evaluating package with ID: ${id}, Error: ${(error as Error).message}`);
      res.status(500).json({ error: 'The package rating system encountered an unexpected error.' });
    }
  });

  export default router;