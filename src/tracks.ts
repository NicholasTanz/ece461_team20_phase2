import { Router, Request, Response } from 'express';

const router = Router();

router.get('/tracks', (req: Request, res: Response) => {
  try {
    const plannedTracks = ["Access control track"];
    res.status(200).json({ plannedTracks });
  } catch (error) {
    console.error('Error retrieving planned tracks:', error);
    res.status(500).json({ message: 'The system encountered an error while retrieving the student\'s track information.' });
  }
});

export default router;
