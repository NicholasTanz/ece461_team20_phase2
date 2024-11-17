import { Router, Request, Response } from 'express';
import multer, { StorageEngine } from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import logger from './logger';

const router = Router();
const uploadDir = path.join(__dirname, '../uploads');

// Ensure the uploads directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage: StorageEngine = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

// Handle package upload
router.post('/upload', upload.single('package'), async (req: Request, res: Response): Promise<void> => {
    try {
      const file = req.file;
      const { Content, JSProgram, Name, Version } = req.body;
  
      // Check if no file or content is provided
      if (!file && !Content) {
        res.status(400).json({ error: 'No package content provided.' });
        return;
      }
  
      const packageId = uuidv4();
      const packageVersion = Version || '1.0.0';
      const uploadPath = path.join(uploadDir, file ? file.originalname : `${packageId}-test.zip`);
  
      // Check if updating an existing package
      if (fs.existsSync(uploadPath)) {
        fs.unlinkSync(uploadPath);
        logger.info(`Package ${file?.originalname || Name} updated.`);
      } else {
        logger.info(`Package ${file?.originalname || Name} uploaded.`);
      }
  
      // Save content if provided as base64
      if (Content) {
        const buffer = Buffer.from(Content, 'base64');
        fs.writeFileSync(uploadPath, buffer);
      } else if (file) {
        fs.renameSync(file.path, uploadPath);
      }
  
      const fileContent = fs.readFileSync(uploadPath).toString('base64');
  
      // Return response
      res.status(201).json({
        metadata: { Name: Name || file!.originalname, Version: packageVersion, ID: packageId },
        data: { Content: fileContent, JSProgram }
      });
    } catch (error) {
      logger.error(`Error uploading package: ${(error as Error).message}`);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
export default router;
