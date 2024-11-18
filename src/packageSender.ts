import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import logger from './logger';
import axios from 'axios';

const router = Router();

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

interface PackageMetadata {
  Name: string;
  Version: string;
  ID: string;
  Method: 'Content' | 'URL';
}

// Helper function to download content from a URL
async function downloadFileFromUrl(url: string, filePath: string): Promise<void> {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  fs.writeFileSync(filePath, response.data);
}

// Helper function to parse the version string
function parseVersion(version: string) {
  const [major, minor, patch] = version.split('.').map(Number);
  return { major, minor, patch };
}

function getExistingVersions(packageName: string): string[] {
  const files = fs.readdirSync(uploadDir);
  const versions: string[] = [];

  files.forEach(file => {
    // Check if the file belongs to the given package and is a zip file
    const match = file.match(new RegExp(`^${packageName}-(\\d+\\.\\d+\\.\\d+)\\.zip$`));
    if (match && match[1]) {
      versions.push(match[1]); // Extract the version part from the file name
    }
  });

  return versions;
}

// Helper function to compare versions
function compareVersions(v1: string, v2: string) {
  const version1 = parseVersion(v1);
  const version2 = parseVersion(v2);
  if (version1.major !== version2.major) return version1.major - version2.major;
  if (version1.minor !== version2.minor) return version1.minor - version2.minor;
  return version1.patch - version2.patch;
}

// Generate the metadata file path
function getMetadataFilePath(packageName: string, version: string) {
  return path.join(uploadDir, `${packageName}-${version}-metadata.json`);
}

// Load package metadata
function loadPackageMetadata(packageName: string, version: string): PackageMetadata | null {
  const metadataPath = getMetadataFilePath(packageName, version);
  if (fs.existsSync(metadataPath)) {
    return JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
  }
  return null;
}

// Save package metadata
function savePackageMetadata(packageName: string, version: string, metadata: PackageMetadata) {
  const metadataPath = getMetadataFilePath(packageName, version);
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
}

// POST /package - Upload a new package
router.post('/package', async (req: Request, res: Response): Promise<void> => {
  const { Name, Version, Content, JSProgram, URL } = req.body;

  // Validate inputs
  if (!Name || !Version) {
    res.status(400).json({ error: 'Name and Version are required.' });
    return;
  }

  const method = Content ? 'Content' : URL ? 'URL' : null;
  if (!method) {
    res.status(400).json({ error: 'No package content provided.' });
    return;
  }

  // Check if the package version already exists
  const existingMetadata = loadPackageMetadata(Name, Version);
  if (existingMetadata) {
    res.status(409).json({ error: 'Package version already exists.' });
    return;
  }

  // Generate a unique package ID
  const packageId = uuidv4();
  const zipFilePath = path.join(uploadDir, `${Name}-${Version}.zip`);

  try {
    if (method === 'Content') {
      // Save the uploaded content to a zip file
      const decodedContent = Buffer.from(Content, 'base64');
      fs.writeFileSync(zipFilePath, decodedContent);
    } else if (method === 'URL' && URL) {
      // Download the content from the provided URL and save it
      await downloadFileFromUrl(URL, zipFilePath);
    }

    // Save package metadata
    const metadata: PackageMetadata = { Name, Version, ID: packageId, Method: method };
    savePackageMetadata(Name, Version, metadata);

    res.status(201).json({
      metadata: { Name, Version, ID: packageId },
      data: { Content, JSProgram, URL },
    });
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Failed to upload package: ${error.message}`);
      res.status(500).json({ error: 'Failed to upload package.' });
    } else {
      logger.error('An unknown error occurred during package upload');
      res.status(500).json({ error: 'Unknown error occurred.' });
    }
  }
});

// Update an existing package
router.post('/package/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { Name, Version, Content, JSProgram, URL } = req.body;

  if (!Name || !Version) {
    res.status(400).json({ error: 'Name and Version are required.' });
    return;
  }

  // Determine the update method
  const updateMethod = Content ? 'Content' : URL ? 'URL' : null;
  if (!updateMethod) {
    res.status(400).json({ error: 'No package content provided.' });
    return;
  }

  // Load the original package metadata by searching for the ID
  const metadataFiles = fs.readdirSync(uploadDir).filter(file => file.endsWith('-metadata.json'));
  let existingMetadata: PackageMetadata | null = null;

  for (const metadataFile of metadataFiles) {
    const filePath = path.join(uploadDir, metadataFile);
    const metadata = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    if (metadata.ID === id) {
      existingMetadata = metadata;
      break;
    }
  }

  if (!existingMetadata) {
    res.status(404).json({ error: 'Package not found.' });
    return;
  }

  // Check if the update method matches the original method
  if (existingMetadata.Method !== updateMethod) {
    res.status(400).json({
      error: `Inconsistent update method. Package was originally ingested via ${existingMetadata.Method}.`
    });
    return;
  }

  const existingVersions = getExistingVersions(Name);
  const latestVersion = existingVersions.sort(compareVersions).pop();

  // Check if the version already exists
  if (existingVersions.includes(Version)) {
    res.status(409).json({ error: 'Package version already exists.' });
    return;
  }

  // Check versioning rules for Content-based updates
  if (existingMetadata.Method === 'Content') {
    if (latestVersion && compareVersions(Version, latestVersion) < 0) {
      res.status(400).json({ error: 'Older Patch version not allowed.' });
      return;
    }
  }

  // Save the updated package
  const packageId = uuidv4();
  if (Content) {
    const decodedContent = Buffer.from(Content, 'base64');
    const uploadPath = path.join(uploadDir, `${Name}-${Version}.zip`);
    fs.writeFileSync(uploadPath, decodedContent);
  }

  // Update metadata with the new version and ID
  savePackageMetadata(Name, Version, { Name, Version, ID: packageId, Method: existingMetadata.Method });

  res.status(201).json({
    metadata: { Name, Version, ID: packageId },
    data: { Content, JSProgram, URL }
  });
});


export default router;
