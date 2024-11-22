import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import axios from 'axios'; // For fetching files from URLs
import logger from './logger';
import metrics from './metrics';

const router = Router();

/**
 * Function to process a package URL and calculate metrics.
 * @param packageUrl - URL of the npm package to be evaluated.
 */
async function processUrl(packageUrl: string): Promise<{ NetScore: number }> {
  try {
    logger.info(`Processing package URL: ${packageUrl}`);

    // Simulate metric calculation for the package
    // Replace this with actual logic for fetching and calculating metrics
    const metrics = await metrics.calculateMetrics(packageUrl);
    const simulatedMetrics = { NetScore: Math.random() }; // Example: Random NetScore for demonstration
    logger.info(`Calculated metrics for ${packageUrl}: ${JSON.stringify(simulatedMetrics)}`);

    return simulatedMetrics;
  } catch (error: any) {
    logger.error(`Failed to process package URL ${packageUrl}: ${error.message}`);
    throw new Error('Failed to process URL');
  }
}

/**
 * POST /ingest
 * Endpoint to handle package ingestion requests.
 */
router.post('/ingest', async (req: Request, res: Response): Promise<void> => {
  try {
    const { packageUrl } = req.body;

    if (!packageUrl || typeof packageUrl !== 'string') {
      res.status(400).json({ error: 'Invalid or missing packageUrl in request body.' });
      return;
    }

    logger.info(`Evaluating package at ${packageUrl}`);
    
    // Calculate metrics for the provided package URL
    const metrics = await processUrl(packageUrl);
    const netScore = metrics?.NetScore ?? -1;

    if (netScore < 0) {
      res.status(500).json({ error: 'Failed to calculate NetScore. Aborting ingestion request.' });
      return;
    }

    logger.info(`NetScore for ${packageUrl}: ${netScore}`);

    if (netScore >= 0.5) {
      logger.info(`NetScore meets threshold. Requesting ingestion for ${packageUrl}.`);

      // Send the ingestion request
      await axios.post('https://8m3o9iosid.execute-api.us-east-1.amazonaws.com/dev', { url: packageUrl }); // FROM AWS LAMBDA FUNCTION URL
      logger.info(`Ingestion requested successfully for package: ${packageUrl}`);
      res.status(200).json({ message: 'Ingestion requested successfully.', packageUrl });
    } else {
      logger.warn(`NetScore below threshold. Ingestion not requested for ${packageUrl}.`);
      res.status(200).json({ message: 'NetScore below threshold. Ingestion not requested.', packageUrl });
    }
  } catch (error: any) {
    logger.error(`Error in processing package ${req.body.packageUrl}: ${error.message}`);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export { processUrl };
export default router;
