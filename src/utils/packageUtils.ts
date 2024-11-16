import axios from 'axios';
import logger from '../logger'; // Import the existing logger

// Function to fetch the size of an npm package using the Bundlephobia API
export async function fetchPackageSize(packageName: string): Promise<{ gzipSize: number, dependencySize: number }> {
  const bundlephobiaUrl = `https://bundlephobia.com/api/size?package=${packageName}`;

  try {
    // Fetch the package size information from the Bundlephobia API
    const response = await axios.get(bundlephobiaUrl);

    // Extract gzip and dependency sizes from the response
    const { gzip, dependencySizes } = response.data;

    // Calculate the total size of all dependencies
    const totalDependencySize = dependencySizes.reduce((sum: number, dep: { approximateSize: number }) => sum + dep.approximateSize, 0);

    // Log and return the sizes
    logger.info(`Package ${packageName} size: gzip ${gzip} bytes, dependencies total ${totalDependencySize} bytes`);

    return { gzipSize: gzip, dependencySize: totalDependencySize };
  } catch (error) {
    const errorMessage = (error as Error).message;
    logger.error(`Failed to fetch size for package ${packageName}: ${errorMessage}`);
    throw new Error(`Could not fetch size for package ${packageName}`);
  }
}

// Example usage
(async () => {
  const packageName = 'axios'; // Replace with any package name
  try {
    const { gzipSize, dependencySize } = await fetchPackageSize(packageName);
    console.log(`Package ${packageName} gzip size: ${gzipSize} bytes`);
    console.log(`Package ${packageName} total dependency size: ${dependencySize} bytes`);
  } catch (error) {
    console.error((error as Error).message);
  }
})();
