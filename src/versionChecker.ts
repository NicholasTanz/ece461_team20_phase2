// npmPackageFetcher.ts: Function to fetch available versions of an npm package from the npm registry and log the results.

import axios from 'axios';
import logger from './logger';  // Import the existing logger

// Function to fetch available versions of an npm package
export async function fetchNpmPackageVersions(packageName: string): Promise<string[]> {
  const registryUrl = `https://registry.npmjs.org/${packageName}`;

  try {
    // Fetch the package metadata from the npm registry
    const response = await axios.get<{ versions: Record<string, unknown> }>(registryUrl);
    
    // Extract the versions object from the response
    const versions = response.data.versions;

    // Convert the object keys (version numbers) to an array
    const availableVersions = Object.keys(versions);

    // Log the available versions
    logger.info(`Available versions for package ${packageName}: ${availableVersions.join(', ')}`);

    // Return the available versions
    return availableVersions;
  } catch (error) {
    const errorMessage = (error as Error).message;
    logger.error(`Failed to fetch versions for package ${packageName}: ${errorMessage}`);
    throw new Error(`Could not fetch versions for package ${packageName}`);
  }
}
