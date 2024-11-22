import { Router, Request, Response } from 'express';
import { resetState } from './resetState';
import logger from './logger';

const router = Router();

/**
 * DELETE /reset - Reset the system state
 */
router.delete('/reset', async (req: Request, res: Response) => {
  const authToken = req.header('X-Authorization');

//   // Check if the authentication token is present
//   if (!authToken) {
//     res.status(403).json({ error: 'Authentication failed due to invalid or missing AuthenticationToken.' });
//     return;
//   }

//   // Verify the token (dummy check for this example; replace with real logic)
//   const validToken = 'valid-auth-token'; // Replace with your actual authentication logic
//   if (authToken !== validToken) {
//     res.status(401).json({ error: 'You do not have permission to reset the registry.' });
//     return;
//   }

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
