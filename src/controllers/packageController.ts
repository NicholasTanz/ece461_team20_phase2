import { Request, Response } from 'express';

// Controller for handling package data
export const getPackages = (req: Request, res: Response) => {
  res.json({ message: 'Fetching packages...' });
};

export const ratePackage = (req: Request, res: Response) => {
  const { packageId, rating } = req.body;
  // Here you would add logic to rate the package
  res.status(201).json({ message: `Rated package ${packageId} with ${rating}` });
};
