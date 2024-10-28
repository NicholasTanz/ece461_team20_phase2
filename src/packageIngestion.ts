// packageIngestion.ts

import axios from 'axios';
import { processUrl } from './run'; // Assuming `processUrl` calculates metrics and returns the package score
import logger from './logger';

/**
 * Function to request ingestion of an npm package based on NetScore.
 * @param packageUrl - URL of the npm package to be evaluated and ingested if it meets the score threshold.
 */
async function requestPackageIngestion(packageUrl: string): Promise<void> {
  try {
    logger.info(`Evaluating package at ${packageUrl}`);
    
    // Calculate metrics for the provided package URL
    const metrics = await processUrl(packageUrl);
    const netScore = metrics?.NetScore ?? -1;

    if (netScore < 0) {
      logger.error('Failed to calculate NetScore. Aborting ingestion request.');
      return;
    }

    // Log and check the NetScore for threshold
    logger.info(`NetScore for ${packageUrl}: ${netScore}`);
    if (netScore >= 0.5) {
      logger.info(`NetScore meets threshold. Requesting ingestion for ${packageUrl}.`);

      // Send the ingestion request (you'll need an actual ingestion API URL here)
      await axios.post('https://8m3o9iosid.execute-api.us-east-1.amazonaws.com/dev', { url: packageUrl });//FROM AWS LAMBDA FUNCTION URL
      logger.info(`Ingestion requested successfully for package: ${packageUrl}`);
    } else {
      logger.warn(`NetScore below threshold. Ingestion not requested for ${packageUrl}.`);
    }
  } catch (error: any) {
    logger.error(`Error in processing package ${packageUrl}: ${error.message}`);
  }
}

// Run ingestion request for a sample npm package
(async () => {
  const packageUrl = 'https://www.npmjs.com/package/axios'; // Replace with actual package URL
  await requestPackageIngestion(packageUrl);
})();

export { processUrl };