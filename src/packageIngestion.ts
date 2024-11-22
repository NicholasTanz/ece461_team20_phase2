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
      const apiUrl = 'https://8m3o9iosid.execute-api.us-east-1.amazonaws.com/dev';
      await axios.post(apiUrl, { url: packageUrl });
      res.status(200).json({
        message: 'Ingestion requested successfully.',
        packageUrl,
        combinedScore,
        metrics: {
          rampUpScore,
          correctnessScore,
          responsivenessScore,
          pinnedDepsScore,
          prCodeScore,
        },
      });
    } else {
      logger.info('Score does not meet threshold. Package will not be ingested.');
      res.status(400).json({ message: 'Package does not meet the required threshold', combinedScore });
    }
  } catch (error) {
    logger.error(`Error processing package URL:`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;