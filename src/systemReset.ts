import fs from 'fs';
import path from 'path';

// Define the directory where files are stored
const uploadsDir = path.join(__dirname, './uploads');

// Function to reset the `uploads` directory
export function resetFunction() {
  if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir);
    files.forEach((file) => {
      try {
        const filePath = path.join(uploadsDir, file);
        fs.unlinkSync(filePath);
        console.log(`Deleted: ${file}`);
      } catch (error) {
        console.error(`Failed to delete file ${file}: ${(error as Error).message}`);
      }
    });
    console.log('Uploads directory reset completed.');
  } else {
    console.log('Uploads directory does not exist. Nothing to reset.');
  }
}
