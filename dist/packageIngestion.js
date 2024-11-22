"use strict";
// packageIngestion.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processUrl = void 0;
const axios_1 = __importDefault(require("axios"));
const run_1 = require("./run"); // Assuming `processUrl` calculates metrics and returns the package score
Object.defineProperty(exports, "processUrl", { enumerable: true, get: function () { return run_1.processUrl; } });
const logger_1 = __importDefault(require("./logger"));
/**
 * Function to request ingestion of an npm package based on NetScore.
 * @param packageUrl - URL of the npm package to be evaluated and ingested if it meets the score threshold.
 */
async function requestPackageIngestion(packageUrl) {
    try {
        logger_1.default.info(`Evaluating package at ${packageUrl}`);
        // Calculate metrics for the provided package URL
        const metrics = await (0, run_1.processUrl)(packageUrl);
        const netScore = metrics?.NetScore ?? -1;
        if (netScore < 0) {
            logger_1.default.error('Failed to calculate NetScore. Aborting ingestion request.');
            return;
        }
        // Log and check the NetScore for threshold
        logger_1.default.info(`NetScore for ${packageUrl}: ${netScore}`);
        if (netScore >= 0.5) {
            logger_1.default.info(`NetScore meets threshold. Requesting ingestion for ${packageUrl}.`);
            // Send the ingestion request (you'll need an actual ingestion API URL here)
            await axios_1.default.post('https://8m3o9iosid.execute-api.us-east-1.amazonaws.com/dev', { url: packageUrl }); //FROM AWS LAMBDA FUNCTION URL
            logger_1.default.info(`Ingestion requested successfully for package: ${packageUrl}`);
        }
        else {
            logger_1.default.warn(`NetScore below threshold. Ingestion not requested for ${packageUrl}.`);
        }
    }
    catch (error) {
        logger_1.default.error(`Error in processing package ${packageUrl}: ${error.message}`);
    }
}
// Run ingestion request for a sample npm package
(async () => {
    const packageUrl = 'https://www.npmjs.com/package/axios'; // Replace with actual package URL
    await requestPackageIngestion(packageUrl);
})();
