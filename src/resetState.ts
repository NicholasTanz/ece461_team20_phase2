import fs from 'fs';
import path from 'path';
import logger from './logger';

const uploadsDir = path.join(__dirname, '../../uploads');
const downloadsDir = path.join(__dirname, '../../downloads');
const reposDir = path.join(__dirname, '../../repos'); // If you're storing cloned repos

/**
 * Function to clear all files in a directory.
 * @param dirPath - The path to the directory to clear.
 */
function clearDirectory(dirPath: string) {
  if (fs.existsSync(dirPath)) {
    const files = fs.readdirSync(dirPath);
    files.forEach((file) => {
      const filePath = path.join(dirPath, file);
      fs.unlinkSync(filePath);
    });
  }
}

/**
 * Function to reset the system to its default state.
 * Clears uploads, downloads, and repos directories.
 */
export function resetSystemState(): void {
  logger.info('Resetting system to default state...');

  // Clear the uploads directory
  clearDirectory(uploadsDir);
  logger.info('Cleared uploads directory.');

  // Clear the downloads directory
  clearDirectory(downloadsDir);
  logger.info('Cleared downloads directory.');

  // Clear the repos directory if it exists
  clearDirectory(reposDir);
  logger.info('Cleared repos directory.');

  // Ensure directories exist after clearing them
  fs.mkdirSync(uploadsDir, { recursive: true });
  fs.mkdirSync(downloadsDir, { recursive: true });
  fs.mkdirSync(reposDir, { recursive: true });

  logger.info('System reset complete.');
}

// tests/cleanup.ts
//import { cleanTestPackageFiles } from './testUtils';

// Run the cleanup
//cleanTestPackageFiles();
//console.log('Test package files cleaned up.');
