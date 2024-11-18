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

  let uploadedContentPackageID: string;
  let uploadedURLPackageID: string;

  // Helper function to upload a new package
  async function uploadNewPackage(name: string, method: 'Content' | 'URL') {
    const payload = {
      Name: name,
      Version: '1.0.0',
      JSProgram: testJSProgram,
      Content: method === 'Content' ? testPackageContent : undefined,
      URL: method === 'URL' ? testURL : undefined,
    };

    const response = await request(app)
      .post('/send/package')
      .send(payload);

    if (response.status !== 201) {
      throw new Error(`Failed to upload package: ${name} - Status: ${response.status}`);
    }

    return response.body.metadata.ID;
  }

  describe('POST /send/package - Upload New Packages', () => {
    it('should upload a new package via Content successfully', async () => {
      const response = await request(app)
        .post('/send/package')
        .send({
          Name: 'test-package-upload-content',
          Version: '1.0.0',
          JSProgram: testJSProgram,
          Content: testPackageContent,
        });

      expect(response.status).to.equal(201);
      expect(response.body.metadata.Name).to.equal('test-package-upload-content');
      expect(response.body.metadata.Version).to.equal('1.0.0');
    });

    it('should upload a new package via URL successfully', async () => {
      const response = await request(app)
        .post('/send/package')
        .send({
          Name: 'test-package-upload-url',
          Version: '3.0.0',
          JSProgram: testJSProgram,
          URL: testURL,
        });
    
      expect(response.status).to.equal(201);
      expect(response.body.metadata.Name).to.equal('test-package-upload-url');
      expect(response.body.metadata.Version).to.equal('3.0.0');
    });
  });

  describe('POST /send/package/:id - Update Existing Packages', () => {
    // Pre-upload packages before running the update tests
    before(async () => {
      try {
        uploadedContentPackageID = await uploadNewPackage('test-cool-package-content', 'Content');
        uploadedURLPackageID = await uploadNewPackage('test-cool-package-url', 'URL');
      } catch (error) {
        console.error('Error in before hook:', error);
        throw error;
      }
    });

    it('should update a Content-based package with a higher version', async () => {
      const response = await request(app)
        .post(`/send/package/${uploadedContentPackageID}`)
        .send({
          Name: 'test-cool-package-content',
          Version: '2.0.0',
          Content: testPackageContent,
          JSProgram: testJSProgram,
        });

      expect(response.status).to.equal(201);
      expect(response.body.metadata.Version).to.equal('2.0.0');
    });

    it('should not update Content-based package with an older patch version', async () => {
      const response = await request(app)
        .post(`/send/package/${uploadedContentPackageID}`)
        .send({
          Name: 'test-cool-package-content',
          Version: '1.0.1',
          Content: testPackageContent,
          JSProgram: testJSProgram,
        });

      expect(response.status).to.equal(400);
      expect(response.body.error).to.include('Older Patch version not allowed');
    });

    it('should update a URL-based package with a lower patch version', async () => {
      const response = await request(app)
        .post(`/send/package/${uploadedURLPackageID}`)
        .send({
          Name: 'test-cool-package-url',
          Version: '0.9.0',
          URL: testURL,
          JSProgram: testJSProgram,
        });

      expect(response.status).to.equal(201);
      expect(response.body.metadata.Version).to.equal('0.9.0');
    });

    it('should not allow updating Content-based package with a URL', async () => {
      const response = await request(app)
        .post(`/send/package/${uploadedContentPackageID}`)
        .send({
          Name: 'test-cool-package-content',
          Version: '2.1.0',
          URL: testURL,
        });

      expect(response.status).to.equal(400);
      expect(response.body.error).to.include('Inconsistent update method');
    });

    it('should not allow updating URL-based package with Content', async () => {
      const response = await request(app)
        .post(`/send/package/${uploadedURLPackageID}`)
        .send({
          Name: 'test-cool-package-url',
          Version: '2.1.0',
          Content: testPackageContent,
        });

      expect(response.status).to.equal(400);
      expect(response.body.error).to.include('Inconsistent update method');
    });
  });

  describe('GET /receive/download/:id', () => {
    it('should download a Content-based package by ID', async () => {
      const response = await request(app)
        .get(`/receive/download/${uploadedContentPackageID}`)
        .expect(200);

      expect(response.body.metadata.Name).to.equal('test-cool-package-content');
      expect(response.body.data).to.have.property('Content');
    });

    it('should download a URL-based package by ID', async () => {
      const response = await request(app)
        .get(`/receive/download/${uploadedURLPackageID}`)
        .expect(200);

      expect(response.body.metadata.Name).to.equal('test-cool-package-url');
      expect(response.body.data).to.have.property('URL');
    });

    it('should return 404 if the package does not exist', async () => {
      const response = await request(app)
        .get('/receive/download/nonexistent-id')
        .expect(404);

      expect(response.body.error).to.equal('Package not found.');
    });
  });
});
