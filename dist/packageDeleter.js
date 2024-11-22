"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const logger_1 = __importDefault(require("./logger"));
const router = (0, express_1.Router)();
const uploadsDir = path_1.default.join(__dirname, 'uploads');
// DELETE /package/:id
router.delete('/package/:id', (req, res) => {
    const { id } = req.params;
    const authToken = req.headers['x-authorization'];
    // Validate Authorization
    const validTokens = ['your-valid-token']; // Replace with actual token validation logic
    if (!authToken || !validTokens.includes(authToken)) {
        res.status(403).send('Authentication failed due to invalid or missing AuthenticationToken.');
        return;
    }
    // Validate Package ID
    if (!id) {
        res.status(400).send('There is missing field(s) in the PackageID or invalid');
        return;
    }
    try {
        // Search for metadata file with matching ID
        const metadataFiles = fs_1.default
            .readdirSync(uploadsDir)
            .filter((file) => file.endsWith('-metadata.json'));
        let found = false;
        let metadataFilePath = null;
        let associatedZipFilePath = null;
        for (const file of metadataFiles) {
            const filePath = path_1.default.join(uploadsDir, file);
            const metadata = JSON.parse(fs_1.default.readFileSync(filePath, 'utf-8'));
            if (metadata.ID === id) {
                found = true;
                metadataFilePath = filePath;
                associatedZipFilePath = path_1.default.join(uploadsDir, `${metadata.Name}-${metadata.Version}.zip`);
                break;
            }
        }
        if (!found) {
            res.status(404).send('Package does not exist.');
            return;
        }
        // Delete the metadata file
        if (metadataFilePath && fs_1.default.existsSync(metadataFilePath)) {
            fs_1.default.unlinkSync(metadataFilePath);
            logger_1.default.info(`Deleted metadata file: ${metadataFilePath}`);
        }
        // Delete the associated zip file
        if (associatedZipFilePath && fs_1.default.existsSync(associatedZipFilePath)) {
            fs_1.default.unlinkSync(associatedZipFilePath);
            logger_1.default.info(`Deleted package zip file: ${associatedZipFilePath}`);
        }
        res.status(200).send('Package is deleted.');
    }
    catch (error) {
        logger_1.default.error(`Error deleting package ${id}: ${error.message}`);
        res.status(500).send('Internal server error.');
    }
});
exports.default = router;
