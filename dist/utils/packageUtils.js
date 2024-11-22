"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchPackageSize = fetchPackageSize;
const axios_1 = __importDefault(require("axios"));
const logger_1 = __importDefault(require("../logger")); // Import the existing logger
// Function to fetch the size of an npm package using the Bundlephobia API
async function fetchPackageSize(packageName) {
    const bundlephobiaUrl = `https://bundlephobia.com/api/size?package=${packageName}`;
    try {
        // Fetch the package size information from the Bundlephobia API
        const response = await axios_1.default.get(bundlephobiaUrl);
        // Extract gzip and dependency sizes from the response
        const { gzip, dependencySizes } = response.data;
        // Calculate the total size of all dependencies
        const totalDependencySize = dependencySizes.reduce((sum, dep) => sum + dep.approximateSize, 0);
        // Log and return the sizes
        logger_1.default.info(`Package ${packageName} size: gzip ${gzip} bytes, dependencies total ${totalDependencySize} bytes`);
        return { gzipSize: gzip, dependencySize: totalDependencySize };
    }
    catch (error) {
        const errorMessage = error.message;
        logger_1.default.error(`Failed to fetch size for package ${packageName}: ${errorMessage}`);
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
    }
    catch (error) {
        console.error(error.message);
    }
})();
