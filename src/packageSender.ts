import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import logger from './logger';

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

function parseVersion(version: string) {
  const [major, minor, patch] = version.split('.').map(Number);
  return { major, minor, patch };
}

function compareVersions(v1: string, v2: string) {
  const version1 = parseVersion(v1);
  const version2 = parseVersion(v2);
  if (version1.major !== version2.major) return version1.major - version2.major;
  if (version1.minor !== version2.minor) return version1.minor - version2.minor;
  return version1.patch - version2.patch;
}

function getMetadataFilePath(packageName: string) {
  return path.join(uploadDir, `${packageName}-metadata.json`);
}

function getExistingVersions(packageName: string): string[] {
  const files = fs.readdirSync(uploadDir);
  return files
    .filter(file => file.startsWith(`${packageName}-`) && file.endsWith('.zip'))
    .map(file => file.split('-')[1].replace('.zip', ''));
}

function loadPackageMetadata(packageName: string): PackageMetadata | null {
  const metadataPath = getMetadataFilePath(packageName);
  if (fs.existsSync(metadataPath)) {
    return JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
  }
  return null;
}

function savePackageMetadata(packageName: string, metadata: PackageMetadata) {
  const metadataPath = getMetadataFilePath(packageName);
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
}

// POST /package - Upload a new package
router.post('/package', async (req: Request, res: Response): Promise<void> => {
  const { Name, Version, Content, JSProgram, URL } = req.body;

  if (!Name || !Version) {
    res.status(400).json({ error: 'Name and Version are required.' });
    return;
  }

  const method = Content ? 'Content' : URL ? 'URL' : null;
  if (!method) {
    res.status(400).json({ error: 'No package content provided.' });
    return;
  }

  const existingVersions = getExistingVersions(Name);
  if (existingVersions.includes(Version)) {
    res.status(409).json({ error: 'Package version already exists.' });
    return;
  }

  const packageId = uuidv4();
  const uploadPath = path.join(uploadDir, `${Name}-${Version}.zip`);

  // Handle package upload
  try {
    if (Content) {
      const decodedContent = Buffer.from(Content, 'base64');
      fs.writeFileSync(uploadPath, decodedContent);
    }

    savePackageMetadata(Name, { Name, Version, ID: packageId, Method: method });
    res.status(201).json({
      metadata: { Name, Version, ID: packageId },
      data: { Content, JSProgram, URL },
    });
  } catch (error) {
    logger.error('Failed to upload package:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /package/:id - Update an existing package
router.post('/package/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { Name, Version, Content, JSProgram, URL } = req.body;

  if (!Name || !Version) {
    res.status(400).json({ error: 'Name and Version are required.' });
    return;
  }

  const metadata = loadPackageMetadata(Name);
  if (!metadata) {
    res.status(404).json({ error: 'Package not found.' });
    return;
  }

  const updateMethod = Content ? 'Content' : URL ? 'URL' : null;
  if (!updateMethod) {
    res.status(400).json({ error: 'No package content provided.' });
    return;
  }

  if (metadata.Method !== updateMethod) {
    res.status(400).json({
      error: `Inconsistent update method. Package was originally ingested via ${metadata.Method}.`,
    });
    return;
  }

  const existingVersions = getExistingVersions(Name);

  if (existingVersions.includes(Version)) {
    res.status(409).json({ error: 'Package version already exists.' });
    return;
  }

  // Version comparison and update logic
  if (Content) {
    for (const existingVersion of existingVersions) {
      if (compareVersions(Version, existingVersion) < 0) {
        res.status(400).json({ error: 'Older Patch version not allowed for Content updates.' });
        return;
      }
    }
  }

  // Save the updated package
  const packageId = uuidv4();
  const uploadPath = path.join(uploadDir, `${Name}-${Version}.zip`);

  try {
    if (Content) {
      const decodedContent = Buffer.from(Content, 'base64');
      fs.writeFileSync(uploadPath, decodedContent);
    }

    savePackageMetadata(Name, { Name, Version, ID: packageId, Method: metadata.Method });
    res.status(201).json({
      metadata: { Name, Version, ID: packageId },
      data: { Content, JSProgram, URL },
    });
  } catch (error) {
    logger.error('Failed to update package:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
