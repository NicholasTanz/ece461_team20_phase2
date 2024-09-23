import { exec, execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { expect } from 'chai';
import simpleGit from 'simple-git';
import * as sinon from 'sinon';
import axios from 'axios';
import { getBusFactor, calculateRampUpMetric, cloneRepo, checkLicenseCompatibility, calculateCorrectnessMetric, calculateResponsiveMaintainerMetric } from './metrics';
import * as os from 'os';



export async function runMochaTests() {
  return new Promise((resolve, reject) => {
      const mochaCommand = `npx mocha ${path.join(__dirname, 'test.js')}`;
      exec(mochaCommand, (error, stdout, stderr) => {
          if (error) {
              console.error('Error running tests:', error);
              reject(error);
          } else {
              console.log('Mocha output:', stdout);
              if (stderr) console.error('Mocha stderr:', stderr);
              resolve(true);
          }
      });
  });
}


    
        // Test suite for getBusFactor
describe('getBusFactor', () => {
        afterEach(() => {
            sinon.restore();
        });
  
        it('should return a bus factor score of 0.9 for 150 contributors', async () => {
          sinon.stub(axios, 'get')
            .onFirstCall().resolves({
              data: Array(100).fill({ login: 'contributor', id: 1, contributions: 5 })
            })
            .onSecondCall().resolves({
              data: Array(50).fill({ login: 'contributor', id: 101, contributions: 3 })
            });
        
          const busFactor = await getBusFactor('https://github.com/some/repo');
          expect(busFactor).to.equal(0.9);
        });
  
    it('should return -1 if the API call fails', async () => {
        sinon.stub(axios, 'get').rejects(new Error('API failed'));
  
        const busFactor = await getBusFactor('https://github.com/some/repo');
        expect(busFactor).to.equal(-1);
    });
});
    

describe('calculateRampUpMetric', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = path.join(__dirname, 'temp_test_dir');
    await fs.promises.mkdir(tempDir, { recursive: true }); // Create a temp directory for testing
  });

  afterEach(async () => {
    // Clean up the temp directory after each test
    await fs.promises.rmdir(tempDir, { recursive: true });
  });

  it('should calculate correct ramp-up score for a project with a README and code files', async () => {
    // Create a README.md file
    const readmePath = path.join(tempDir, 'README.md');
    const file1Path = path.join(tempDir, 'file1.js');
    
    await fs.promises.writeFile(readmePath, `# Project Title\n\nThis is a readme file.\n[Link](https://example.com)\n`);
    await fs.promises.writeFile(file1Path, `// Comment\nconst x = 10;\nfunction test() { return x; }\n/* Block comment */`);

    // Call the function
    const result = await calculateRampUpMetric(tempDir);
    
    // Make assertions
    expect(result).to.be.greaterThan(0); // Ensure the score is greater than 0
  });

  it('should return 0 if no README is present', async () => {
    // Create a file without README.md
    const file1Path = path.join(tempDir, 'file1.js');
    await fs.promises.writeFile(file1Path, `const x = 10;\n`);

    // Call the function
    const result = await calculateRampUpMetric(tempDir);
    
    // Make assertions
    expect(result).to.equal(0); // No README, so ramp-up score should be 0
  });

  it('should return similar ramp-up scores for files with 499 and 600 lines', async () => {
    // Create a file with 499 lines
    const file1Path = path.join(tempDir, 'file1.js');
    const fileWith499Lines = Array(499).fill('const x = 10;').join('\n');
    await fs.promises.writeFile(file1Path, fileWith499Lines);

    // Call the function for the file with 499 lines
    const result499 = await calculateRampUpMetric(tempDir);

    // Remove the file
    await fs.promises.unlink(file1Path);

    // Create a file with 600 lines
    const fileWith600Lines = Array(600).fill('const x = 10;').join('\n');
    await fs.promises.writeFile(file1Path, fileWith600Lines);

    // Call the function for the file with 600 lines
    const result600 = await calculateRampUpMetric(tempDir);

    // Make assertions: The ramp-up score for 499 and 600 lines should be very similar since the limit is 500
    expect(result499).to.be.closeTo(result600, 0.01); // Allow a small margin for any slight differences
  });

  it('should handle a README with non-GitHub/NPM links', async () => {
      // Create a README with non-GitHub/NPM links
      const readmePath = path.join(tempDir, 'README.md');
      const readmeContent = `# Project Title\n\nThis is a readme file with a [link](https://example.com)\nAnother [link](https://anotherexample.com)`;
      await fs.promises.writeFile(readmePath, readmeContent);

      const file1Path = path.join(tempDir, 'file1.js');
      await fs.promises.writeFile(file1Path, `// Comment\nconst x = 10;\nfunction test() { return x; }\n/* Block comment */`);

      // Call the function
      const result = await calculateRampUpMetric(tempDir);

      // Make assertions
      expect(result).to.be.greaterThan(0); // Score should increase due to non-GitHub/NPM links
  });
});

   // Test suite for cloneRepo
   describe('cloneRepo (real clone)', function () {
    this.timeout(10000); // Set a higher timeout if needed (cloning can take time)
  
    const tempDir = path.join(__dirname, 'tempRepoClone');
  
    beforeEach(async () => {
      // Ensure temp directory is clean before each test
      try {
        fs.promises.rmdir(tempDir, { recursive: true});
      } catch (error) {
        // Ignore if directory doesn't exist
      }
    });
  
    afterEach(async () => {
      // Clean up temp directory after each test
      fs.promises.rm(tempDir, { recursive: true});
    });
  
    it('should successfully clone a real repository', async () => {
      const repoUrl = 'https://github.com/LucidVR/lucidgloves'; // Replace with a valid repo URL
  
      // Call the real cloneRepo function (this will clone a real repo)
      await cloneRepo(repoUrl, tempDir);
  
      // Verify that the repo was cloned by checking if the tempDir exists and has contents
      const dirExists = await fs.promises.stat(tempDir).then(() => true).catch(() => false);
      expect(dirExists).to.be.true; // Make sure the directory exists after cloning
  
      const files = fs.promises.readdir(tempDir);
      expect((await files).length).to.be.greaterThan(0); // Make sure the directory isn't empty
    });
  });
  
  // // Test suite for checkLicenseCompatibility
  // describe('checkLicenseCompatibility', () => {
  //   afterEach(() => {
  //     sinon.restore();
  //   });
  
  //   it('should return a compatible license score and details', async () => {
  //     const mockLicenseResponse = {
  //       data: { content: Buffer.from('MIT License').toString('base64') },
  //     };
  //     sinon.stub(axios, 'get').resolves(mockLicenseResponse);
  
  //     const result = await checkLicenseCompatibility('https://github.com/some/repo');
  //     expect(result.score).to.equal(1);
  //     expect(result.details).to.include('MIT License');
  //   });
  
  //   it('should return 0 if no license is found', async () => {
  //     sinon.stub(axios, 'get').rejects(new Error('LICENSE file not found'));
  
  //     const result = await checkLicenseCompatibility('https://github.com/some/repo');
  //     expect(result.score).to.equal(0);
  //     expect(result.details).to.include('No license information found');
  //   });
  // });
  
  // // Test suite for calculateCorrectnessMetric
  // describe('calculateCorrectnessMetric', () => {
  //   let mockStat: sinon.SinonStubbedInstance<fs.Stats>;

  //   beforeEach(() => {
  //     // Create a stubbed instance of the Stats class and configure it
  //     mockStat = sinon.createStubInstance(fs.Stats);
  
  //     // Ensure isFile and isDirectory return correct boolean values
  //     mockStat.isFile.returns(true);        // Mock it as a file
  //     mockStat.isDirectory.returns(false);  // Mock it as not a directory
  
  //     // Stub fs.promises.stat to return the mockStat instance
  //     sinon.stub(fs.promises, 'stat').resolves(mockStat as unknown as fs.Stats);
  //   });
  
  //   afterEach(() => {
  //     // Restore the original fs.promises.stat after each test to avoid conflicts
  //     sinon.restore();
  //   });
  
  //   it('should calculate the test suite coverage correctly', async () => {
  //     // Mock fs.promises.readFile to simulate package.json and test files
  //     const mockReadFile = sinon.stub(fs.promises, 'readFile').resolves(JSON.stringify({
  //       devDependencies: {
  //         jest: "^26.0.0"
  //       }
  //     }));
  //     //const mockReaddir = sinon.stub(fs.promises, 'readdir').resolves(['test.js']);
  //     const mockReaddir = sinon.stub(fs.promises, 'readdir').resolves([
  //       { name: 'test.js', isFile: () => true, isDirectory: () => false } as unknown as fs.Dirent
  //     ]);
  //     //const mockStat = sinon.stub(fs.promises, 'stat').resolves({ isFile: () => true, isDirectory: () => false });
  //     const mockStat = sinon.stub(fs.promises, 'stat').resolves({
  //       isFile: () => true,
  //       isDirectory: () => false,
  //       atime: new Date(),
  //       mtime: new Date(),
  //       ctime: new Date(),
  //       birthtime: new Date(),
  //       // add any other properties as needed
  //     } as unknown as fs.Stats);
      
  
  //     const result = await calculateCorrectnessMetric('./local/path');
  //     expect(result).to.be.greaterThan(0.5); // Because we have a test suite (jest)
      
  //     mockReadFile.restore();
  //     mockReaddir.restore();
  //     mockStat.restore();
  //   });
  // });
  
  // // Test suite for calculateResponsiveMaintainerMetric
  // describe('calculateResponsiveMaintainerMetric', () => {
  //   afterEach(() => {
  //     sinon.restore();
  //   });
  
  //   it('should calculate the correct responsive maintainer score', async () => {
  //     const mockIssuesResponse = {
  //       data: [{}, {}, {}] // 3 closed issues
  //     };
  //     const mockPullsResponse = {
  //       data: [{ closed_at: '2021-10-01T00:00:00Z' }] // 1 closed PR in the last month
  //     };
  //     const mockOpenIssuesResponse = {
  //       data: [{}] // 1 open issue
  //     };
  
  //     sinon.stub(axios, 'get')
  //       .onFirstCall().resolves(mockIssuesResponse) // Closed issues
  //       .onSecondCall().resolves(mockPullsResponse) // Closed PRs
  //       .onThirdCall().resolves(mockOpenIssuesResponse); // Open issues
  
  //     const score = await calculateResponsiveMaintainerMetric('https://github.com/some/repo');
  //     expect(score).to.be.closeTo(0.75, 0.01); // Responsive score based on mock data
  //   });
  // });
  

