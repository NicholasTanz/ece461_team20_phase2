import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import axios from 'axios'; // For fetching files from URLs
import logger from './logger';
import multer from 'multer';
import { processUrl } from './run'; // Adjust the path based on your directory structure

const router = Router();

// Paths for uploads and downloads
const uploadsDir = path.join(__dirname, 'uploads');
const downloadsDir = path.join(__dirname, '../downloads');

// Ensure the downloads directory exists
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true });
}

// GET /package/{id}
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate the ID
    if (!id || typeof id !== 'string') {
      res.status(400).json({ error: "There is missing field(s) in the PackageID or it is formed improperly, or is invalid." });
      return;
    }

    // Search for the metadata file that contains the given ID
    const metadataFiles = fs
      .readdirSync(uploadsDir)
      .filter((file) => file.endsWith('-metadata.json'));

    let metadata: Record<string, any> | null = null;

    for (const file of metadataFiles) {
      const filePath = path.join(uploadsDir, file);
      try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        if (data.ID === id) {
          metadata = data;
          break;
        }
      } catch (error) {
        logger.warn(`Failed to parse metadata file: ${file}`);
      }
    }

    // If no matching metadata file is found, return 404
    if (!metadata) {
      logger.warn(`Metadata for package ${id} not found.`);
      res.status(404).json({ error: "Package does not exist." });
      return;
    }

    const { Name, Version, URL, JSProgram } = metadata;
    const uploadFilePath = path.join(uploadsDir, `${Name}-${Version}.zip`);
    const downloadFilePath = path.join(downloadsDir, `${Name}-${Version}.zip`);
    let content: string;

    // Check if the file already exists in the downloads directory
    if (fs.existsSync(downloadFilePath)) {
      content = fs.readFileSync(downloadFilePath).toString('base64');
    } else if (fs.existsSync(uploadFilePath)) {
      // Copy file from uploads to downloads
      fs.copyFileSync(uploadFilePath, downloadFilePath);
      content = fs.readFileSync(downloadFilePath).toString('base64');
    } else if (URL) {
      // Fetch the file from the URL if it's not locally available
      logger.info(`Fetching package from URL: ${URL}`);
      try {
        const response = await axios.get(URL, { responseType: 'arraybuffer' });
        const fileData = Buffer.from(response.data);

        // Save the file to downloads directory
        fs.writeFileSync(downloadFilePath, fileData);
        content = fileData.toString('base64');
      } catch (error) {
        logger.error(`Failed to fetch package from URL ${URL}: ${(error as Error).message}`);
        res.status(404).json({ error: "Package does not exist." });
        return;
      }
    } else {
      logger.warn(`File ${Name}-${Version}.zip not found in uploads or URL.`);
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
    Content: ${
      content.length > 100
        ? `${content.slice(0, 100)}... [truncated]`
        : content
    }
    ${URL ? `URL: ${URL}` : ''}
    JSProgram: |
      ${JSProgram ? JSProgram.replace(/\n/g, '\n    ') : 'N/A'}
  `;

  // Send the formatted response
  res.status(200).send(formattedResponse);
  } catch (error) {
    logger.error(`Error downloading package ${req.params.id}: ${(error as Error).message}`);
    res.status(500).json({ error: "Internal server error." });
  }
});


// POST /package/byRegEx
router.post('/byRegEx', async (req: Request, res: Response): Promise<void> => {
    const { RegEx } = req.body;
  
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
      const metadataFiles = fs.readdirSync(uploadsDir).filter((file) => file.endsWith('-metadata.json'));
      const matchedPackages = metadataFiles
        .map((file) => {
          const metadata = JSON.parse(fs.readFileSync(path.join(uploadsDir, file), 'utf-8'));
          if (regex.test(metadata.Name)) {
            return {
              Version: metadata.Version,
              Name: metadata.Name,
              ID: metadata.ID,
            };
          }
          return null;
        })
        .filter((pkg): pkg is NonNullable<typeof pkg> => pkg !== null);
  
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
    } catch (error) {
      console.error(`Error processing regex search: ${(error as Error).message}`);
      res.status(500).send({
        error: 'Internal server error.',
      });
    }
  });
  

// GET /package/{id}/cost
router.get('/:id/cost', async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const dependency = req.query.dependency === 'true';
  
    // Validate inputs
    if (!id) {
      res.status(400).json({ error: 'Missing or invalid PackageID.' });
      return;
    }
  
    try {
      // Locate the package metadata
      const metadataFiles = fs.readdirSync(uploadsDir).filter((file) => file.endsWith('-metadata.json'));
      const metadataFile = metadataFiles.find((file) => file.includes(id));
  
      if (!metadataFile) {
        res.status(404).json({ error: 'Package does not exist.' });
        return;
      }
  
      const metadataPath = path.join(uploadsDir, metadataFile);
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
  
      const standaloneCost = metadata.Cost || 0;
  
      let responsePayload: Record<string, any> = {
        [id]: {
          standaloneCost: standaloneCost,
          totalCost: standaloneCost,
        },
      };
  
      if (dependency && metadata.Dependencies) {
        for (const dep of metadata.Dependencies) {
          const depMetadataFile = metadataFiles.find((file) => file.includes(dep));
  
          if (!depMetadataFile) {
            logger.error(`Dependency metadata file not found for ID: ${dep}`);
            res.status(500).json({
              error: `Failed to process dependency: ${dep}.`,
            });
            return;
          }
  
          const depMetadataPath = path.join(uploadsDir, depMetadataFile);
          const depMetadata = JSON.parse(fs.readFileSync(depMetadataPath, 'utf-8'));
          const depCost = depMetadata.Cost || 0;
  
          responsePayload[dep] = {
            standaloneCost: depCost,
            totalCost: depCost + responsePayload[id].totalCost,
          };
  
          responsePayload[id].totalCost += depCost;
        }
      }
  
      res.status(200).json(responsePayload);
    } catch (error) {
      logger.error(`Error fetching cost for package ${id}: ${(error as Error).message}`);
      res.status(500).json({ error: 'Internal server error.' });
    }
  });
  

// DELETE /package/:id
router.delete('/:id', (req: Request, res: Response) => {
    const { id } = req.params;
  
    // Validate Package ID
    if (!id) {
      res.status(400).send('There is missing field(s) in the PackageID or invalid');
      return;
    }
  
    try {
      // Search for metadata file with matching ID
      const metadataFiles = fs
        .readdirSync(uploadsDir)
        .filter((file) => file.endsWith('-metadata.json'));
  
      let found = false;
      let metadataFilePath: string | null = null;
      let associatedZipFilePath: string | null = null;
  
      for (const file of metadataFiles) {
        const filePath = path.join(uploadsDir, file);
        const metadata = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  
        if (metadata.ID === id) {
          found = true;
          metadataFilePath = filePath;
          associatedZipFilePath = path.join(uploadsDir, `${metadata.Name}-${metadata.Version}.zip`);
          break;
        }
      }
  
      if (!found) {
        res.status(404).send('Package does not exist.');
        return;
      }
  
      // Delete the metadata file
      if (metadataFilePath && fs.existsSync(metadataFilePath)) {
        fs.unlinkSync(metadataFilePath);
        logger.info(`Deleted metadata file: ${metadataFilePath}`);
      }
  
      // Delete the associated zip file
      if (associatedZipFilePath && fs.existsSync(associatedZipFilePath)) {
        fs.unlinkSync(associatedZipFilePath);
        logger.info(`Deleted package zip file: ${associatedZipFilePath}`);
      }
  
      res.status(200).send('Package is deleted.');
    } catch (error) {
      logger.error(`Error deleting package ${id}: ${(error as Error).message}`);
      res.status(500).send('Internal server error.');
    }
  });
  
  
  const uploadDir = path.join(__dirname, './uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  });
  const upload = multer({ storage });
  
  interface PackageMetadata {
    Name: string;
    Version: string;
    ID: string;
    Method: 'Content' | 'URL';
    JSProgram: string;
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
      const match = file.match(new RegExp(`^${packageName}-(\\d+\\.\\d+\\.\\d+)\\.zip$`));
      if (match && match[1]) {
        versions.push(match[1]);
      }
    });
  
    return versions;
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
  router.post('/', upload.single('content'), async (req: Request, res: Response): Promise<void> => {
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
    const zipFilePath = path.join(uploadDir, `${Name}-${sanitizedVersion}.zip`);
  
    try {
      if (file) {
        fs.renameSync(file.path, zipFilePath);
      } else if (URL) {
        await downloadFileFromUrl(URL, zipFilePath);
      }
  
      const fileContent = fs.readFileSync(zipFilePath).toString('base64');
  
      const metadata: PackageMetadata = {
        Name,
        Version: effectiveVersion,
        ID: packageId,
        Method: method,
        JSProgram: JSProgram || 'if (process.argv.length === 7) { console.log("Success"); process.exit(0); } else { console.log("Failed"); process.exit(1); }',
        ...(URL && { URL }), // Add URL to metadata if applicable
      };
      savePackageMetadata(Name, effectiveVersion, metadata);
  
      res.status(201).send(
        `metadata:
        Name: ${metadata.Name}
        Version: ${metadata.Version}
        ID: ${metadata.ID}
      data:
        Content: ${fileContent.slice(0, 100)}... [truncated]
        ${URL ? `URL: ${URL}` : ''}
        JSProgram: |
          ${metadata.JSProgram.replace(/\n/g, '\n    ')}
      `
      );
    } catch (error) {
      logger.error(`Failed to upload package: ${(error as Error).message}`);
      res.status(500).json({ error: 'Failed to upload package.' });
    }
  });
  
  // post /package/:id - Update an existing package
  router.post('/:id', upload.single('content'), async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { Name, Version, JSProgram, Content, URL } = req.body;
    const file = req.file;
  
    if (!Name || !Version) {
      res.status(400).json({ error: 'Name and Version are required.' });
      return;
    }
  
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
        if (parsedIncomingVersion.major < parsedExistingVersion.major) continue;
  
        // For the same major version, check minor
        if (parsedIncomingVersion.major === parsedExistingVersion.major) {
          if (parsedIncomingVersion.minor < parsedExistingVersion.minor) continue;
  
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
    const uploadPath = path.join(uploadDir, `${Name}-${Version}.zip`);
  
    try {
      if (file) {
        fs.renameSync(file.path, uploadPath);
      } else if (Content) {
        const decodedContent = Buffer.from(Content, 'base64');
        fs.writeFileSync(uploadPath, decodedContent);
      } else if (URL) {
        await downloadFileFromUrl(URL, uploadPath);
      }
  
      const fileContent = fs.readFileSync(uploadPath).toString('base64');
  
      const metadata: PackageMetadata = {
        Name,
        Version,
        ID: packageId,
        Method: existingMetadata.Method,
        JSProgram: JSProgram || existingMetadata.JSProgram,
        ...(URL && { URL }), // Add URL to metadata if applicable
      };
      savePackageMetadata(Name, Version, metadata);
  
      res.status(200).send(
        `metadata:
        Name: ${metadata.Name}
        Version: ${metadata.Version}
        ID: ${metadata.ID}
      data:
        Content: ${fileContent.slice(0, 100)}... [truncated]
        ${URL ? `URL: ${URL}` : ''}
        JSProgram: |
          ${metadata.JSProgram.replace(/\n/g, '\n    ')}
      `
      );
    } catch (error) {
      logger.error(`Failed to update package: ${(error as Error).message}`);
      res.status(500).json({ error: 'Failed to update package.' });
    }
  });
  

  async function evaluatePackage(url: string) {
    try {
      const metrics = await processUrl(url);
  
      if (metrics) {
        console.log('Package Metrics:', metrics);
      } else {
        console.error('Invalid URL or metrics could not be calculated.');
      }
    } catch (error) {
      console.error('Error evaluating package:', error);
    }
  }
  
  // GET package/id/rate
  router.get('/:id/rate', async (req: Request, res: Response): Promise<void> => {
      const { id } = req.params;
  
      if (!id) {
        res.status(400).json({ error: 'There is missing field(s) in the PackageID.' });
        return;
      }
    
      const metadataFiles = fs.readdirSync(uploadsDir).filter(file => file.endsWith('-metadata.json'));
      const metadataFile = metadataFiles.find(file => file.includes(id));
      if (!metadataFile) {
        res.status(404).json({ error: 'Package does not exist.' });
        return;
      }
    
      try {
        const metadataPath = path.join(uploadsDir, metadataFile);
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
    
        // Check if metrics are already cached
        if (
          metadata.metrics &&
          metadata.metrics.NetScore !== undefined &&
          metadata.metrics.License !== undefined
        ) {
          logger.info(`Returning cached metrics for package ID: ${id}`);
          res.status(200).json(metadata.metrics);
          return;
        }
    
        if (!metadata.URL) {
          res.status(400).json({ error: 'URL is missing in the package metadata.' });
          return;
        }
    
        logger.info(`Evaluating package with ID: ${id}, URL: ${metadata.URL}`);
        const metrics = await processUrl(metadata.URL);
    
        if (metrics.NetScore === 0 || metrics.NetScore === -1) {
          res.status(500).json({ error: 'The package rating system choked on at least one of the metrics.' });
          return;
        }
    
        // Save calculated metrics back to the metadata
        metadata.metrics = metrics;
        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    
        res.status(200).json(metrics);
      } catch (error) {
        logger.error(`Error evaluating package with ID: ${id}, Error: ${(error as Error).message}`);
        res.status(500).json({ error: 'The package rating system encountered an unexpected error.' });
      }
    });
  

export default router;
