"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const axios_1 = __importDefault(require("axios")); // For fetching files from URLs
const logger_1 = __importDefault(require("./logger"));
const router = (0, express_1.Router)();
// Paths for uploads and downloads
const uploadsDir = path_1.default.join(__dirname, 'uploads');
const downloadsDir = path_1.default.join(__dirname, '../downloads');
// Ensure the downloads directory exists
if (!fs_1.default.existsSync(downloadsDir)) {
    fs_1.default.mkdirSync(downloadsDir, { recursive: true });
}
// GET /receiver/package/{id}
router.get('/package/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // Validate the ID
        if (!id || typeof id !== 'string') {
            res.status(400).json({ error: "There is missing field(s) in the PackageID or it is formed improperly, or is invalid." });
            return;
        }
        // Search for the metadata file that contains the given ID
        const metadataFiles = fs_1.default
            .readdirSync(uploadsDir)
            .filter((file) => file.endsWith('-metadata.json'));
        let metadata = null;
        for (const file of metadataFiles) {
            const filePath = path_1.default.join(uploadsDir, file);
            try {
                const data = JSON.parse(fs_1.default.readFileSync(filePath, 'utf-8'));
                if (data.ID === id) {
                    metadata = data;
                    break;
                }
            }
            catch (error) {
                logger_1.default.warn(`Failed to parse metadata file: ${file}`);
            }
        }
        // If no matching metadata file is found, return 404
        if (!metadata) {
            logger_1.default.warn(`Metadata for package ${id} not found.`);
            res.status(404).json({ error: "Package does not exist." });
            return;
        }
        const { Name, Version, URL, JSProgram } = metadata;
        const uploadFilePath = path_1.default.join(uploadsDir, `${Name}-${Version}.zip`);
        const downloadFilePath = path_1.default.join(downloadsDir, `${Name}-${Version}.zip`);
        let content;
        // Check if the file already exists in the downloads directory
        if (fs_1.default.existsSync(downloadFilePath)) {
            content = fs_1.default.readFileSync(downloadFilePath).toString('base64');
        }
        else if (fs_1.default.existsSync(uploadFilePath)) {
            // Copy file from uploads to downloads
            fs_1.default.copyFileSync(uploadFilePath, downloadFilePath);
            content = fs_1.default.readFileSync(downloadFilePath).toString('base64');
        }
        else if (URL) {
            // Fetch the file from the URL if it's not locally available
            logger_1.default.info(`Fetching package from URL: ${URL}`);
            try {
                const response = await axios_1.default.get(URL, { responseType: 'arraybuffer' });
                const fileData = Buffer.from(response.data);
                // Save the file to downloads directory
                fs_1.default.writeFileSync(downloadFilePath, fileData);
                content = fileData.toString('base64');
            }
            catch (error) {
                logger_1.default.error(`Failed to fetch package from URL ${URL}: ${error.message}`);
                res.status(404).json({ error: "Package does not exist." });
                return;
            }
        }
        else {
            logger_1.default.warn(`File ${Name}-${Version}.zip not found in uploads or URL.`);
            res.status(404).json({ error: "Package does not exist." });
            return;
        }
        // Construct the response
        const formattedResponse = `
  metadata:
    Name: ${metadata.Name}
    Version: ${metadata.Version}
    ID: ${id}
  data:
    Content: ${content.length > 100
            ? `${content.slice(0, 100)}... [truncated]`
            : content}
    URL: ${URL || 'N/A'}
    JSProgram: |
      ${JSProgram ? JSProgram.replace(/\n/g, '\n    ') : 'N/A'}
  `;
        // Send the formatted response
        res.status(200).send(formattedResponse);
    }
    catch (error) {
        logger_1.default.error(`Error downloading package ${req.params.id}: ${error.message}`);
        res.status(500).json({ error: "Internal server error." });
    }
});
exports.default = router;
