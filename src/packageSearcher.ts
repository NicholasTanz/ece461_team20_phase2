import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();

const uploadsDir = path.join(__dirname, 'uploads');
const PAGE_LIMIT = 10; // Limit per page
const MAX_MATCHES = 100; // Maximum allowed matches to avoid excessive responses

// Helper function to parse metadata
function parseMetadata(filePath: string) {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  }
  
// POST /packages
router.post('/packages', (req: Request, res: Response) => {
  const queries = req.body;
  const offset = parseInt(req.query.offset as string) || 0;

  // Validate input
  if (!Array.isArray(queries) || queries.some((query) => typeof query.Name !== 'string')) {
    res.status(400).json({
      error: 'There is missing field(s) in the PackageQuery or it is formed improperly, or is invalid.',
    });
    return;
  }

  try {
    // Collect metadata files
    const metadataFiles = fs.readdirSync(uploadsDir).filter((file) => file.endsWith('-metadata.json'));
    let matchedPackages: any[] = [];

    // Process queries
    for (const query of queries) {
      const regex = new RegExp(query.Name === '*' ? '.*' : query.Name);
      const matches = metadataFiles
        .map((file) => {
          const metadata = parseMetadata(path.join(uploadsDir, file));
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

      matchedPackages = [...matchedPackages, ...matches];
    }

    // Check for too many matches
    if (matchedPackages.length > MAX_MATCHES) {
      res.status(413).json({ error: 'Too many packages returned.' });
      return;
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
  } catch (error) {
    console.error(`Error processing package query: ${(error as Error).message}`);
    res.status(500).json({
      error: 'Internal server error.',
    });
  }
});

// POST /package/byRegEx
router.post('/package/byRegEx', async (req: Request, res: Response): Promise<void> => {
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

export default router;
