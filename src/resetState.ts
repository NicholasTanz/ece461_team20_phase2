import fs from 'fs';
import path from 'path';
import logger from './logger';

const uploadsDir = path.join(__dirname, 'uploads');
const downloadsDir = path.join(__dirname, '../downloads');

/**
 * Function to clear all contents of a directory.
 * @param dirPath - The path to the directory to clear.
 */
function clearDirectory(dirPath: string): void {
  if (fs.existsSync(dirPath)) {
    try {
      // Read all entries in the directory (files and subdirectories)
      const entries = fs.readdirSync(dirPath);
      for (const entry of entries) {
        const entryPath = path.join(dirPath, entry);

        // Remove each entry
        try {
          fs.rmSync(entryPath, { recursive: true, force: true });
          logger.info(`Deleted: ${entryPath}`);
        } catch (error) {
          logger.error(`Error deleting ${entryPath}: ${(error as Error).message}`);
        }
      }
    } catch (error) {
      logger.error(`Error reading directory ${dirPath}: ${(error as Error).message}`);
    }
  }
}

/**
 * Function to reset the system to its default state.
 * Clears the contents of the uploads and downloads directories.
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

    logger.info('System reset complete.');
  } catch (error) {
    logger.error(`Error during system reset: ${(error as Error).message}`);
  }
}
