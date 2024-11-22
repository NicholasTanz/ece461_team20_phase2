import fs from 'fs';
import path from 'path';
import logger from './logger';

const uploadsDir = path.join(__dirname, 'uploads');
const downloadsDir = path.join(__dirname, '../downloads');

/**
 * Function to clear all files in a directory.
 * @param dirPath - The path to the directory to clear.
 */
function clearDirectory(dirPath: string) {
  if (fs.existsSync(dirPath)) {
    const files = fs.readdirSync(dirPath);
    files.forEach((file) => {
      const filePath = path.join(dirPath, file);
      try {
        if (fs.lstatSync(filePath).isDirectory()) {
          // Recursively clear directories
          clearDirectory(filePath);
          fs.rmdirSync(filePath); // Remove the empty directory
        } else {
          fs.unlinkSync(filePath); // Remove the file
        }
      } catch (error) {
        logger.error(`Error deleting ${filePath}: ${(error as Error).message}`);
      }
    });
  }
}

/**
 * Function to reset the system to its default state.
 * Clears uploads and downloads directories.
 */
export function resetState(): void {
  logger.info('Starting system reset.');

  try {
    // Clear the uploads directory
    clearDirectory(uploadsDir);
    logger.info('Cleared uploads.');

    // Clear the downloads directory
    clearDirectory(downloadsDir);
    logger.info('Cleared downloads.');

    // Ensure directories exist after clearing them
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    if (!fs.existsSync(downloadsDir)) {
      fs.mkdirSync(downloadsDir, { recursive: true });
    }

    logger.info('System reset complete.');
  } catch (error) {
    logger.error(`Error during system reset: ${(error as Error).message}`);
  }
}
