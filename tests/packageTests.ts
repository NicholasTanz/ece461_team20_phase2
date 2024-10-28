import request from 'supertest';
import { expect } from 'chai';
import express from 'express';
import fs from 'fs';
import path from 'path';
import packageManager from '../src/packageManager';

// Set up Express app for testing
const app = express();
app.use(express.json());
app.use('/', packageManager);

// Directory paths
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const downloadsDir = path.join(__dirname, '../downloads');

// Mock package file and path
const testFileName = 'test-package.zip';
const testFilePath = path.join(uploadDir, testFileName);

// Helper function to clean up files after tests
function cleanupFile(filePath: string) {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

describe('Package Manager Tests', () => {
  before(() => {
    // Ensure necessary directories exist before tests
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir, { recursive: true });
  });

  afterEach(() => {
    // Clean up the uploaded test file after each test
    cleanupFile(testFilePath);
  });

  // Test Upload Endpoint
  describe('POST /upload', () => {
    it('should upload a new package successfully', async () => {
      const response = await request(app)
        .post('/upload')
        .attach('package', Buffer.from('test content'), testFileName);

      expect(response.status).to.equal(200);
      expect(response.text).to.include('uploaded/updated successfully');
      expect(fs.existsSync(testFilePath)).to.be.true;
    });

    it('should update an existing package', async () => {
      // Create initial file to simulate existing package
      fs.writeFileSync(testFilePath, 'initial content');

      const response = await request(app)
        .post('/upload')
        .attach('package', Buffer.from('updated content'), testFileName);

      expect(response.status).to.equal(200);
      expect(response.text).to.include('uploaded/updated successfully');
      
      // Check that file content has been updated
      const fileContent = fs.readFileSync(testFilePath, 'utf-8');
      expect(fileContent).to.equal('updated content');
    });

    it('should return 400 if no file is uploaded', async () => {
      const response = await request(app).post('/upload');
      expect(response.status).to.equal(400);
      expect(response.text).to.equal('No file uploaded.');
    });
  });

  // Test Download Endpoint
  describe('GET /download/:packageName', () => {
    beforeEach(() => {
      // Create a file in the uploads folder to simulate an uploaded package
      fs.writeFileSync(testFilePath, 'downloadable content');
    });

    afterEach(() => {
      // Clean up any downloaded files
      cleanupFile(path.join(downloadsDir, testFileName));
    });

    it('should download an existing package successfully', async () => {
      const response = await request(app).get(`/download/${testFileName}`);

      expect(response.status).to.equal(200);
      expect(response.headers['content-disposition']).to.include(`attachment; filename="${testFileName}"`);
      expect(response.text).to.equal('downloadable content');
      
      // Ensure file was moved to downloads directory
      const downloadedFilePath = path.join(downloadsDir, testFileName);
      expect(fs.existsSync(downloadedFilePath)).to.be.true;
      expect(fs.readFileSync(downloadedFilePath, 'utf-8')).to.equal('downloadable content');
    });

    it('should return 404 if the package does not exist', async () => {
      const res = await request(app)
        .get('/download')
        .query({ packageNames: 'nonexistent-package.zip' })
        .expect(200);
    
      expect(res.body).to.deep.equal({
        results: [{ packageName: 'nonexistent-package.zip', status: 'not found' }]
      });
    });
  });
});

// Utility function to clean up files ending with "test-package.zip"
export function cleanTestPackageFiles() {
  if (fs.existsSync(uploadDir)) {
    fs.readdirSync(uploadDir).forEach((file) => {
      if (file.endsWith('test-package.zip')) {
        fs.unlinkSync(path.join(uploadDir, file));
      }
    });
    console.log('Cleaned up test-package files');
  } else {
    console.log(`Directory "${uploadDir}" does not exist.`);
  }
}

// Example Test Suite
describe('Package Manager Tests', () => {
  it('should upload a new package successfully', async () => {
    const res = await request(app)
      .post('/upload')
      .attach('package', Buffer.from('sample data'), 'test-package.zip')
      .expect(200);

    expect(res.body).to.have.property('status', 'success');
  });

  // Additional tests can go here
});

// Run cleanup manually
// cleanTestPackageFiles();