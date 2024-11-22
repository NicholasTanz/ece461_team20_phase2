import express from 'express';
import { cleanTestPackageFiles } from './testUtils';

const router = express.Router();


// DELETE /cleanup
router.delete('/', (req, res) => {
  try {
    cleanTestPackageFiles();
    res.status(200).json({ message: 'Test package files cleaned up.' });
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error during cleanup: ${error.message}`);
      res.status(500).json({ error: `Error during cleanup: ${error.message}` });
    } else {
      console.error('An unknown error occurred during cleanup.');
      res.status(500).json({ error: 'Unknown error occurred during cleanup.' });
    }
  }
});

export default router;
