"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const multer_1 = __importDefault(require("multer"));
const logger_1 = __importDefault(require("./logger"));
const axios_1 = __importDefault(require("axios"));
const router = (0, express_1.Router)();
const uploadDir = path_1.default.join(__dirname, './uploads');
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});
const upload = (0, multer_1.default)({ storage });
// Helper function to download content from a URL
async function downloadFileFromUrl(url, filePath) {
    const response = await axios_1.default.get(url, { responseType: 'arraybuffer' });
    fs_1.default.writeFileSync(filePath, response.data);
}
// Helper function to parse the version string
function parseVersion(version) {
    const [major, minor, patch] = version.split('.').map(Number);
    return { major, minor, patch };
}
function getExistingVersions(packageName) {
    const files = fs_1.default.readdirSync(uploadDir);
    const versions = [];
    files.forEach(file => {
        const match = file.match(new RegExp(`^${packageName}-(\\d+\\.\\d+\\.\\d+)\\.zip$`));
        if (match && match[1]) {
            versions.push(match[1]);
        }
    });
    return versions;
}
// Generate the metadata file path
function getMetadataFilePath(packageName, version) {
    return path_1.default.join(uploadDir, `${packageName}-${version}-metadata.json`);
}
// Load package metadata
function loadPackageMetadata(packageName, version) {
    const metadataPath = getMetadataFilePath(packageName, version);
    if (fs_1.default.existsSync(metadataPath)) {
        return JSON.parse(fs_1.default.readFileSync(metadataPath, 'utf-8'));
    }
    return null;
}
// Save package metadata
function savePackageMetadata(packageName, version, metadata) {
    const metadataPath = getMetadataFilePath(packageName, version);
    fs_1.default.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
}
// POST /package - Upload a new package
router.post('/package', upload.single('content'), async (req, res) => {
    const { Name, Version, JSProgram, URL } = req.body;
    const file = req.file;
    if (!Name) {
        res.status(400).json({ error: 'Name is required.' });
        return;
    }
    const method = file ? 'Content' : URL ? 'URL' : null;
    if (!method) {
        res.status(400).json({ error: 'No package content provided.' });
        return;
    }
    const existingVersions = getExistingVersions(Name);
    const effectiveVersion = Version || (existingVersions.length === 0 ? '1.0.0' : null);
    if (!effectiveVersion) {
        res.status(400).json({ error: 'Version is required when existing versions exist.' });
        return;
    }
    if (existingVersions.includes(effectiveVersion)) {
        res.status(400).json({ error: 'Package version already exists.' });
        return;
    }
    const sanitizedVersion = effectiveVersion.replace(/\./g, '-');
    const packageId = `${Name.toLowerCase()}-ver-${sanitizedVersion}`;
    const zipFilePath = path_1.default.join(uploadDir, `${Name}-${sanitizedVersion}.zip`);
    try {
        if (file) {
            fs_1.default.renameSync(file.path, zipFilePath);
        }
        else if (URL) {
            await downloadFileFromUrl(URL, zipFilePath);
        }
        const fileContent = fs_1.default.readFileSync(zipFilePath).toString('base64');
        const metadata = {
            Name,
            Version: effectiveVersion,
            ID: packageId,
            Method: method,
            JSProgram: JSProgram || 'if (process.argv.length === 7) { console.log("Success"); process.exit(0); } else { console.log("Failed"); process.exit(1); }',
            ...(URL && { URL }), // Add URL to metadata if applicable
        };
        savePackageMetadata(Name, effectiveVersion, metadata);
        res.status(201).send(`metadata:
      Name: ${metadata.Name}
      Version: ${metadata.Version}
      ID: ${metadata.ID}
    data:
      Content: ${fileContent.slice(0, 100)}... [truncated]
      ${URL ? `URL: ${URL}` : ''}
      JSProgram: |
        ${metadata.JSProgram.replace(/\n/g, '\n    ')}
    `);
    }
    catch (error) {
        logger_1.default.error(`Failed to upload package: ${error.message}`);
        res.status(500).json({ error: 'Failed to upload package.' });
    }
});
// PUT /package/:id - Update an existing package
router.put('/package/:id', upload.single('content'), async (req, res) => {
    const { id } = req.params;
    const { Name, Version, JSProgram, Content, URL } = req.body;
    const file = req.file;
    if (!Name || !Version) {
        res.status(400).json({ error: 'Name and Version are required.' });
        return;
    }
    const metadataFiles = fs_1.default.readdirSync(uploadDir).filter(file => file.endsWith('-metadata.json'));
    let existingMetadata = null;
    for (const metadataFile of metadataFiles) {
        const filePath = path_1.default.join(uploadDir, metadataFile);
        const metadata = JSON.parse(fs_1.default.readFileSync(filePath, 'utf-8'));
        if (metadata.ID === id) {
            existingMetadata = metadata;
            break;
        }
    }
    if (!existingMetadata) {
        res.status(404).json({ error: 'Package not found.' });
        return;
    }
    const updateMethod = file ? 'Content' : Content ? 'Content' : URL ? 'URL' : null;
    // Check if the update method matches the original ingestion method
    if (existingMetadata.Method !== updateMethod) {
        res.status(400).json({
            error: `Inconsistent update method. Package was originally ingested via ${existingMetadata.Method}.`,
        });
        return;
    }
    const existingVersions = getExistingVersions(Name);
    // Validate the incoming version for content-based packages only
    if (existingMetadata.Method === 'Content') {
        const parsedIncomingVersion = parseVersion(Version);
        let isValid = true;
        for (const existingVersion of existingVersions) {
            const parsedExistingVersion = parseVersion(existingVersion);
            // Skip unrelated major versions
            if (parsedIncomingVersion.major < parsedExistingVersion.major)
                continue;
            // For the same major version, check minor
            if (parsedIncomingVersion.major === parsedExistingVersion.major) {
                if (parsedIncomingVersion.minor < parsedExistingVersion.minor)
                    continue;
                // For the same major and minor, check patch
                if (parsedIncomingVersion.minor === parsedExistingVersion.minor) {
                    if (parsedIncomingVersion.patch <= parsedExistingVersion.patch) {
                        isValid = false;
                        break;
                    }
                }
            }
        }
        if (!isValid) {
            res.status(400).json({
                error: `Version ${Version} is older or equal to an existing version in the same group.`,
            });
            return;
        }
    }
    const sanitizedVersion = Version.replace(/\./g, '-');
    const packageId = `${Name.toLowerCase()}-ver-${sanitizedVersion}`;
    const uploadPath = path_1.default.join(uploadDir, `${Name}-${Version}.zip`);
    try {
        if (file) {
            fs_1.default.renameSync(file.path, uploadPath);
        }
        else if (Content) {
            const decodedContent = Buffer.from(Content, 'base64');
            fs_1.default.writeFileSync(uploadPath, decodedContent);
        }
        else if (URL) {
            await downloadFileFromUrl(URL, uploadPath);
        }
        const fileContent = fs_1.default.readFileSync(uploadPath).toString('base64');
        const metadata = {
            Name,
            Version,
            ID: packageId,
            Method: existingMetadata.Method,
            JSProgram: JSProgram || existingMetadata.JSProgram,
            ...(URL && { URL }), // Add URL to metadata if applicable
        };
        savePackageMetadata(Name, Version, metadata);
        res.status(201).send(`metadata:
      Name: ${metadata.Name}
      Version: ${metadata.Version}
      ID: ${metadata.ID}
    data:
      Content: ${fileContent.slice(0, 100)}... [truncated]
      ${URL ? `URL: ${URL}` : ''}
      JSProgram: |
        ${metadata.JSProgram.replace(/\n/g, '\n    ')}
    `);
    }
    catch (error) {
        logger_1.default.error(`Failed to update package: ${error.message}`);
        res.status(500).json({ error: 'Failed to update package.' });
    }
});
exports.default = router;
