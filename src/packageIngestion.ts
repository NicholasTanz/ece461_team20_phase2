import { calculateRampUpMetric, calculateCorrectnessMetric, calculateResponsiveMaintainerMetric, calculatePinnedDependenciesMetric, calculateCodeFromPRsMetric } from './metrics';
import { Router, Request, Response } from 'express';
import logger from './logger';
import axios from 'axios';

const router = Router();

// Function to process package URL and calculate metrics
router.post('/ingest', async (req: Request, res: Response) => {
  const { packageUrl, localPath } = req.body;

  try {
    logger.info(`Processing package URL: ${packageUrl}`);

    // Calculate individual metrics
    const rampUpScore = await calculateRampUpMetric(localPath);
    const correctnessScore = await calculateCorrectnessMetric(localPath);
    const responsivenessScore = await calculateResponsiveMaintainerMetric(packageUrl);
    const pinnedDepsScore = await calculatePinnedDependenciesMetric(packageUrl);
    const prCodeScore = await calculateCodeFromPRsMetric(packageUrl);

    // Combine scores
    const combinedScore = (rampUpScore + correctnessScore + responsivenessScore + pinnedDepsScore + prCodeScore) / 5;

    logger.info(`Combined Score: ${combinedScore}`);

    // Check threshold and ingest
    if (combinedScore > 0.5) {
      // Ingestion logic here (e.g., save to database, call external API, etc.)
      logger.info('Score meets threshold. Ingesting package...');
      res.status(200).json({ message: 'Package ingested successfully', combinedScore });
    } else {
      logger.info('Score does not meet threshold. Package will not be ingested.');
      res.status(400).json({ message: 'Package does not meet the required threshold', combinedScore });
    }
  } catch (error) {
    logger.error(`Error processing package URL:`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /ingest
 * Endpoint to handle package ingestion requests.
 */
router.post('/ingest', async (req: Request, res: Response): Promise<void> => {
  try {
    const { packageUrl, localPath } = req.body;

    // Validate input
    if (!packageUrl || typeof packageUrl !== 'string') {
      res.status(400).json({ error: 'Invalid or missing packageUrl in request body.' });
      return;
    }

    if (!localPath || typeof localPath !== 'string') {
      res.status(400).json({ error: 'Invalid or missing localPath in request body.' });
      return;
    }

    logger.info(`Evaluating package at ${packageUrl}`);

    // Calculate individual metrics
    const rampUpScore = await calculateRampUpMetric(localPath);
    const correctnessScore = await calculateCorrectnessMetric(localPath);
    const responsivenessScore = await calculateResponsiveMaintainerMetric(packageUrl);
    const pinnedDepsScore = await calculatePinnedDependenciesMetric(packageUrl);
    const prCodeScore = await calculateCodeFromPRsMetric(packageUrl);

    // Combine metrics into a NetScore
    const netScore = (rampUpScore + correctnessScore + responsivenessScore + pinnedDepsScore + prCodeScore) / 5;
    logger.info(`NetScore for ${packageUrl}: ${netScore}`);

    if (netScore >= 0.5) {
      logger.info(`NetScore meets threshold. Requesting ingestion for ${packageUrl}.`);

      // Send the ingestion request to the AWS Lambda function
      const apiUrl = 'https://8m3o9iosid.execute-api.us-east-1.amazonaws.com/dev';
      await axios.post(apiUrl, { url: packageUrl });
      
      logger.info(`Ingestion requested successfully for package: ${packageUrl}`);
      res.status(200).json({
        message: 'Ingestion requested successfully.',
        packageUrl,
        netScore,
        metrics: {
          rampUpScore,
          correctnessScore,
          responsivenessScore,
          pinnedDepsScore,
          prCodeScore,
        },
      });
    } else {
      logger.warn(`NetScore below threshold. Ingestion not requested for ${packageUrl}.`);
      res.status(200).json({
        message: 'NetScore below threshold. Ingestion not requested.',
        packageUrl,
        netScore,
        metrics: {
          rampUpScore,
          correctnessScore,
          responsivenessScore,
          pinnedDepsScore,
          prCodeScore,
        },
      });
    }
  } catch (error: any) {
    logger.error(`Error in processing package ${req.body.packageUrl}: ${error.message}`);
    res.status(500).json({ error: 'Internal server error.', details: error.message });
  }
});

export default router;