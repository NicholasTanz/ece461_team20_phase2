/*
import { Request, Response } from 'express';
import {processAllUrls} from '../run'

// Controller for handling package data
export const getPackages = (req: Request, res: Response) => {
  res.json({ message: 'Fetching packages...' });
};

export async function getPackageRating(req: Request, res: Response): Promise<void> {
    const { id } = req.params; // Get the package ID from the path
  
    // Check for missing fields
    if (!id) {
        res.status(400).json({ error: 'Missing field(s) in the PackageID' });
        return
    }
  
    try {
      // Validate the package ID here 

      // change later. 
      const packageUrlFromId: string[] = ['https://github.com/mrdoob/three.js/'];

      // Fetch the package rating
      const packageRating = await processAllUrls(packageUrlFromId);
      

      if (!packageRating) {
        return res.status(404).json({ error: 'Package does not exist.' });
      }
  
      // Return the package rating
      res.status(200).json(packageRating);
      return
    } catch (error) {
      console.error('Error fetching package rating:', error);
      res.status(500).json({ error: 'The package rating system choked on at least one of the metrics.' });
      return
    }
  }
  */