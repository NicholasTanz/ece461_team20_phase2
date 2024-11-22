"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchNpmPackageVersions = fetchNpmPackageVersions;
const axios_1 = __importDefault(require("axios"));
const logger_1 = __importDefault(require("./logger")); // Import the existing logger
// Function to fetch available versions of an npm package
async function fetchNpmPackageVersions(packageName) {
    const registryUrl = `https://registry.npmjs.org/${packageName}`;
    try {
        // Fetch the package metadata from the npm registry
        const response = await axios_1.default.get(registryUrl);
        // Extract the versions object from the response
        const versions = response.data.versions;
        // Convert the object keys (version numbers) to an array
        const availableVersions = Object.keys(versions);
        // Log the available versions
        logger_1.default.info(`Available versions for package ${packageName}: ${availableVersions.join(', ')}`);
        // Return the available versions
        return availableVersions;
    }
    catch (error) {
        const errorMessage = error.message;
        logger_1.default.error(`Failed to fetch versions for package ${packageName}: ${errorMessage}`);
        throw new Error(`Could not fetch versions for package ${packageName}`);
    }
}
