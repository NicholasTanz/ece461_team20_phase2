"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const router = (0, express_1.Router)();
const uploadsDir = path_1.default.join(__dirname, 'uploads');
const PAGE_LIMIT = 10; // Limit per page
// Helper function to validate authorization token
function validateAuthToken(authToken) {
    const validTokens = ['your-valid-token']; // Replace with actual token validation logic
    return typeof authToken === 'string' && validTokens.includes(authToken);
}
// Helper function to parse metadata
function parseMetadata(filePath) {
    const content = fs_1.default.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
}
// POST /packages
router.post('/packages', (req, res) => {
    const queries = req.body;
    const authToken = req.headers['x-authorization'];
    const offset = parseInt(req.query.offset) || 0;
    // Validate Authorization
    if (!authToken || !validateAuthToken(authToken)) {
        res.status(403).json({
            error: 'Authentication failed due to invalid or missing AuthenticationToken.',
        });
        return;
    }
    // Validate input
    if (!Array.isArray(queries) || queries.some((query) => typeof query.Name !== 'string')) {
        res.status(400).json({
            error: 'There is missing field(s) in the PackageQuery or it is formed improperly, or is invalid.',
        });
        return;
    }
    try {
        // Collect metadata files
        const metadataFiles = fs_1.default.readdirSync(uploadsDir).filter((file) => file.endsWith('-metadata.json'));
        let matchedPackages = [];
        // Process queries
        for (const query of queries) {
            const regex = new RegExp(query.Name === '*' ? '.*' : query.Name);
            const matches = metadataFiles
                .map((file) => {
                const metadata = parseMetadata(path_1.default.join(uploadsDir, file));
                if (regex.test(metadata.Name)) {
                    return {
                        Version: metadata.Version,
                        Name: metadata.Name,
                        ID: metadata.ID,
                    };
                }
                return null;
            })
                .filter((pkg) => pkg !== null);
            matchedPackages = [...matchedPackages, ...matches];
        }
        if (matchedPackages.length === 0) {
            res.status(404).json({ error: 'No package found under the provided queries.' });
            return;
        }
        // Pagination
        const paginatedResults = matchedPackages.slice(offset, offset + PAGE_LIMIT);
        const nextOffset = offset + paginatedResults.length;
        // Add offset to response headers
        res.setHeader('offset', nextOffset.toString());
        // Format response
        const formattedResponse = {
            value: paginatedResults.map((pkg) => ({
                Version: pkg.Version,
                Name: pkg.Name,
                ID: pkg.ID,
            })),
        };
        res.status(200).json(formattedResponse);
    }
    catch (error) {
        console.error(`Error processing package query: ${error.message}`);
        res.status(500).json({
            error: 'Internal server error.',
        });
    }
});
// POST /package/byRegEx
router.post('/package/byRegEx', async (req, res) => {
    const { RegEx } = req.body;
    const authToken = req.headers['x-authorization'];
    // Validate Authorization
    if (!authToken || !validateAuthToken(authToken)) {
        res.status(403).send({
            error: 'Authentication failed due to invalid or missing AuthenticationToken.',
        });
        return;
    }
    // Validate input
    if (!RegEx) {
        res.status(400).send({
            error: 'There is missing field(s) in the PackageRegEx or it is formed improperly, or is invalid.',
        });
        return;
    }
    try {
        // Compile regex
        const regex = new RegExp(RegEx);
        // Read metadata files
        const metadataFiles = fs_1.default.readdirSync(uploadsDir).filter((file) => file.endsWith('-metadata.json'));
        const matchedPackages = metadataFiles
            .map((file) => {
            const metadata = JSON.parse(fs_1.default.readFileSync(path_1.default.join(uploadsDir, file), 'utf-8'));
            if (regex.test(metadata.Name)) {
                return {
                    Version: metadata.Version,
                    Name: metadata.Name,
                    ID: metadata.ID,
                };
            }
            return null;
        })
            .filter((pkg) => pkg !== null);
        if (matchedPackages.length === 0) {
            res.status(404).send({
                error: 'No package found under this regex.',
            });
            return;
        }
        // Format the response
        const response = {
            value: matchedPackages.map((pkg) => ({
                Version: pkg.Version,
                Name: pkg.Name,
                ID: pkg.ID,
            })),
        };
        res.status(200).json(response);
    }
    catch (error) {
        console.error(`Error processing regex search: ${error.message}`);
        res.status(500).send({
            error: 'Internal server error.',
        });
    }
});
exports.default = router;
