import { Router, Request, Response } from 'express';
import { resetState } from './resetState';
import logger from './logger';

const router = Router();

/**
 * DELETE /reset - Reset the system state
 */
router.delete('/reset', async (req: Request, res: Response) => {

  try {
    resetState();
    res.status(200).send('Registry is reset.');
    logger.info('Registry reset triggered successfully.');
  } catch (error) {
    logger.error(`Failed to reset the registry: ${(error as Error).message}`);
    res.status(500).json({ error: 'Failed to reset the registry.' });
  }
});

export default router;
