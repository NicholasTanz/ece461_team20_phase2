import request from 'supertest';
import { expect } from 'chai';
import express from 'express';
import packageSender from '../src/packageSender';
import packageReceiver from '../src/packageReceiver';

// Set up Express app for testing
const app = express();
app.use(express.json());
app.use('/send', packageSender);
app.use('/receive', packageReceiver);

describe('Package Management Tests', () => {
  // Mock data for testing
  const testPackageContent = 'UEsDBAoAAAAAACAfUFkAAAAAAAAAAAAAAAASAAkAdW5kZXJzY29yZS1t';
  const testJSProgram = `
    if (process.argv.length === 7) {
      console.log('Success');
      process.exit(0);
    } else {
      console.log('Failed');
      process.exit(1);
    }
  `;
  const testURL = 'https://github.com/jashkenas/underscore';

  let uploadedPackageID: string;
  let uploadedPackageUrlID: string;

  // Helper function to pre-upload a package
  async function preUploadPackage(name: string, version: string, useContent: boolean) {
    const payload = {
      Name: name,
      Version: version,
      JSProgram: testJSProgram,
      Content: testPackageContent, // Include content for both cases
      ...(useContent ? {} : { URL: testURL }) // Add URL if not using content
    };
  
    console.log('Uploading with payload:', payload);
  
    // Send request to upload the package
    const response = await request(app)
      .post('/send/upload')
      .send(payload);
  
    console.log('Upload Response:', response.body);
  
    // Check if the response status is not 201 (created)
    if (response.status !== 201) {
      throw new Error(`Failed to upload package: ${name} - Status: ${response.status}`);
    }
  
    // Check if the response has the expected metadata structure
    if (!response.body || !response.body.metadata || !response.body.metadata.ID) {
      throw new Error(`Invalid response structure: ${JSON.stringify(response.body)}`);
    }
  
    return response.body.metadata.ID;
  }
  
  

  // Pre-upload packages before running the tests
  before(async () => {
    try {
      // Upload packages with content and URL respectively
      uploadedPackageID = await preUploadPackage('cool-package', '1.0.0', true); // Uses Content
      uploadedPackageUrlID = await preUploadPackage('cool-package-url', '1.0.0', false); // Uses URL
    } catch (error) {
      console.error('Error in before hook:', error);
      throw error; // Fail the tests if setup fails
    }
  });
  

  // Test uploading a package with content
  describe('POST /send/upload', () => {
    it('should upload a new package with content successfully', async () => {
      const response = await request(app)
        .post('/send/upload')
        .send({
          Content: testPackageContent,
          JSProgram: testJSProgram,
          Name: 'new-package',
          Version: '1.0.0'
        });

      expect(response.status).to.equal(201);
      expect(response.body).to.have.property('metadata');
      expect(response.body.metadata.Name).to.equal('new-package');
    });

    it('should upload a new package using URL successfully', async () => {
      const response = await request(app)
        .post('/send/upload')
        .send({
          URL: testURL,
          Content: testPackageContent,
          JSProgram: testJSProgram,
          Name: 'new-package-url',
          Version: '1.0.0'
        });

      expect(response.status).to.equal(201);
      expect(response.body).to.have.property('metadata');
      expect(response.body.metadata.Name).to.equal('new-package-url');
    });
  });

  // Test updating a package with a higher version
  describe('POST /send/upload - Update package with higher version', () => {
    it('should update cool-package with a higher version', async () => {
      const response = await request(app)
        .post('/send/upload')
        .send({
          Content: testPackageContent,
          JSProgram: testJSProgram,
          Name: 'cool-package',
          Version: '4.2.0'
        });

      expect(response.status).to.equal(200);
      expect(response.body.metadata.Version).to.equal('4.2.0');
    });

    it('should update cool-package-url with a higher version', async () => {
      const response = await request(app)
        .post('/send/upload')
        .send({
          URL: testURL,
          Content: testPackageContent,
          JSProgram: testJSProgram,
          Name: 'cool-package-url',
          Version: '4.2.0'
        });

      expect(response.status).to.equal(200);
      expect(response.body.metadata.Version).to.equal('4.2.0');
    });
  });

  // Test appending a package with a lower version
  describe('POST /send/upload - Append package with lower version', () => {
    it('should append cool-package with a lower version', async () => {
      const response = await request(app)
        .post('/send/upload')
        .send({
          Content: testPackageContent,
          JSProgram: testJSProgram,
          Name: 'cool-package',
          Version: '0.9.0'
        });

      expect(response.status).to.equal(200);
      expect(response.body.metadata.Version).to.equal('0.9.0');
    });

    it('should append cool-package-url with a lower version', async () => {
      const response = await request(app)
        .post('/send/upload')
        .send({
          URL: testURL,
          Content: testPackageContent,
          JSProgram: testJSProgram,
          Name: 'cool-package-url',
          Version: '0.9.0'
        });

      expect(response.status).to.equal(200);
      expect(response.body.metadata.Version).to.equal('0.9.0');
    });
  });

  // Test downloading a package
  describe('GET /receive/download/:id', () => {
    it('should download cool-package successfully by ID', async () => {
      const response = await request(app)
        .get(`/receive/download/${uploadedPackageID}`)
        .expect(200);

      expect(response.body).to.have.property('metadata');
      expect(response.body.metadata.Name).to.equal('cool-package');
      expect(response.body.data).to.have.property('Content');
    });

    it('should download cool-package-url successfully by ID', async () => {
      const response = await request(app)
        .get(`/receive/download/${uploadedPackageUrlID}`)
        .expect(200);

      expect(response.body).to.have.property('metadata');
      expect(response.body.data).to.have.property('URL');
    });

    it('should return 404 if the package does not exist', async () => {
      const response = await request(app)
        .get('/receive/download/nonexistent-id')
        .expect(404);

      expect(response.body).to.have.property('error', 'Package not found.');
    });
  });
});
