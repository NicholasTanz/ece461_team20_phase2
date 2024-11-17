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
  const testPackageContent = 'UEsFBgAAAAAAAAAAAAAAAAAAAAAAAA==';
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

  // Test uploading a package with content
  describe('POST /send/upload', () => {
    it('should upload a new package with content successfully', async () => {
      const response = await request(app)
        .post('/send/upload')
        .send({
          Content: testPackageContent,
          JSProgram: testJSProgram,
          Name: 'cool-package',
          Version: '1.0.0'
        });

      expect(response.status).to.equal(201);
      expect(response.body).to.have.property('metadata');
      uploadedPackageID = response.body.metadata.ID;
      expect(response.body.metadata.Name).to.equal('cool-package');
    });

    it('should upload a new package using URL successfully', async () => {
      const response = await request(app)
        .post('/send/upload')
        .send({
          URL: testURL,
          JSProgram: testJSProgram,
          Name: 'cool-package-url',
          Version: '1.0.0'
        });

      expect(response.status).to.equal(201);
      expect(response.body).to.have.property('metadata');
      expect(response.body.metadata.Name).to.equal('cool-package-url');
    });

    it('should return 400 if no package content is provided', async () => {
      const response = await request(app)
        .post('/send/upload')
        .send({
          Name: 'missing-content-package',
          Version: '1.0.0'
        });

      expect(response.status).to.equal(400);
      expect(response.body).to.have.property('error', 'No package content provided.');
    });

    it('should return 409 if package already exists', async () => {
      const response = await request(app)
        .post('/send/upload')
        .send({
          Content: testPackageContent,
          JSProgram: testJSProgram,
          Name: 'cool-package',
          Version: '1.0.0'
        });

      expect(response.status).to.equal(409);
      expect(response.body).to.have.property('error', 'Package already exists.');
    });
  });

  // Test updating a package
  describe('POST /send/upload - Update package', () => {
    it('should update an existing package with a higher version', async () => {
      const response = await request(app)
        .post('/send/upload')
        .send({
          Content: testPackageContent,
          JSProgram: testJSProgram,
          Name: 'cool-package',
          Version: '1.1.0'
        });

      expect(response.status).to.equal(200);
      expect(response.body.metadata.Version).to.equal('1.1.0');
    });

    it('should append a lower version package', async () => {
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
  });

  // Test downloading a package
  describe('GET /receive/download/:id', () => {
    it('should download a package successfully by ID with content', async () => {
      const response = await request(app)
        .get(`/receive/download/${uploadedPackageID}`)
        .expect(200);

      expect(response.body).to.have.property('metadata');
      expect(response.body.metadata.Name).to.equal('cool-package');
      expect(response.body.data).to.have.property('Content');
    });

    it('should download a package successfully by ID with URL', async () => {
      const response = await request(app)
        .get('/receive/download/package-url-id') // Replace with actual ID if needed
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

  // Error handling tests
  describe('Error Handling', () => {
    it('should return 400 if no package ID is provided', async () => {
      const response = await request(app)
        .get('/receive/download/')
        .expect(400);

      expect(response.body).to.have.property('error', 'Package ID is required.');
    });
  });
});
