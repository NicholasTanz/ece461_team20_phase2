import express from 'express';
import { resetFunction } from './systemReset';

const router = express.Router();

// DELETE /reset
router.delete('/', (req, res) => {
  try {
    resetFunction();
    res.status(200).json({ message: 'Uploads directory reset successfully.' });
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error during reset: ${error.message}`);
      res.status(500).json({ error: `Error during reset: ${error.message}` });
    } else {
      console.error('An unknown error occurred during reset.');
      res.status(500).json({ error: 'Unknown error occurred during reset.' });
    }
  }
});

export default router;
