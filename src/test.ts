/*
File Name: 
  test.ts

Function: This code tests all of the metrics in metrics.ts and the ./run install command. All exported metrics functions and their smaller functions inside met

This test bed uses mocha describe/it blocks to describe a test suite, and each it is a different test. At the end, mocha sums up all passed test "it" cases and 
outputs a ## passed score for the output. To add more tests, use more describe/it blocks and test using the command "npx mocha dist/test.js" to get 
uninterrupted and detail test messages, with full error breakdowns. 

The version of mocha and and chai are down-graded from the latest version to be compatible with the rest of the code. The specific versions in the dependencies 
are necessary for the versions of other core dependencies. This has to do with ESModule handling in latest versions. When updating, consider these. 
*/

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { expect } from 'chai';
import simpleGit from 'simple-git';
import * as sinon from 'sinon';
import axios from 'axios';
import { getBusFactor, calculateRampUpMetric, cloneRepo, checkLicenseCompatibility, calculateCorrectnessMetric, calculateResponsiveMaintainerMetric } from './metrics';
import * as os from 'os';



// export async function runMochaTests() {
//   return new Promise((resolve, reject) => {
//       const mochaCommand = `npx mocha ${path.join(__dirname, 'test.js')}`;
//       exec(mochaCommand, (error, stdout, stderr) => {
//           if (error) {
//               console.error('Error running tests:', error);
//               reject(error);
//           } else {
//               console.log('Mocha output:', stdout);
//               if (stderr) console.error('Mocha stderr:', stderr);
//               resolve(true);
//           }
//       });
//   });
// }

describe('npm install command verification', () => {
  it('should correctly install all dependencies', () => {
    // console.log('Checking if "npm install" was run correctly');

    const packageLockPath = path.join(process.cwd(), 'package-lock.json');

    // Check if package-lock.json exists
    expect(fs.existsSync(packageLockPath), 'package-lock.json should exist').to.be.true;

    // Read and parse the package-lock.json file
    const packageJson = JSON.parse(fs.readFileSync(packageLockPath, 'utf-8'));

    // Get the list of dependencies and devDependencies
    const dependencies = Object.keys(packageJson.dependencies || {});
    const devDependencies = Object.keys(packageJson.devDependencies || {});
    const allDependencies = [...dependencies, ...devDependencies];

    // Run 'npm list' command to get the installed dependencies
    const npmListOutput = execSync('npm list --depth=0 --json').toString();
    const installedPackages = JSON.parse(npmListOutput).dependencies || {};

    // Check if each dependency is listed in the installed packages
    allDependencies.forEach(dependency => {
      expect(installedPackages).to.have.property(dependency, 
        `Dependency "${dependency}" should be installed`);
    });

    // console.log('All packages are accounted for. "npm install" ran correctly');
  });
});

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
    
//Test suite for calculateRampUpMetric
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
  


//license checker test suite
describe('checkLicenseCompatibility', () => {
  let originalToken: string | undefined;

  beforeEach(() => {
    originalToken = process.env.GITHUB_TOKEN;
    process.env.GITHUB_TOKEN = 'fake_token_for_testing';
  });

  afterEach(() => {
    process.env.GITHUB_TOKEN = originalToken;
    sinon.restore();
  });

  it('should return a compatible license from the LICENSE file', async () => {
    const mockLicenseResponse = {
      data: { content: Buffer.from('MIT License').toString('base64') }
    };
    sinon.stub(axios, 'get').resolves(mockLicenseResponse);

    const result = await checkLicenseCompatibility('https://github.com/some/repo');
    expect(result.score).to.equal(1);
    expect(result.details).to.include('MIT License');
  });

  it('should return a compatible license from package.json', async () => {
    const mockLicenseResponse = { response: { status: 404 } };
    const mockPackageJsonResponse = {
      data: { content: Buffer.from(JSON.stringify({ license: 'Apache-2.0' })).toString('base64') }
    };
    const axiosStub = sinon.stub(axios, 'get');
    axiosStub.onFirstCall().rejects(mockLicenseResponse);
    axiosStub.onSecondCall().resolves(mockPackageJsonResponse);

    const result = await checkLicenseCompatibility('https://github.com/some/repo');
    expect(result.score).to.equal(1);
    expect(result.details).to.include('Apache-2.0');
  });

  it('should return 0 if no license information is found', async () => {
    const mockResponse = { response: { status: 404 } };
    const axiosStub = sinon.stub(axios, 'get');
    axiosStub.onFirstCall().rejects(mockResponse); // LICENSE file not found
    axiosStub.onSecondCall().rejects(mockResponse); // package.json not found
    axiosStub.onThirdCall().rejects(mockResponse); // README not found

    const result = await checkLicenseCompatibility('https://github.com/some/repo');
    expect(result.score).to.equal(0);
    expect(result.details).to.equal('No license information found');
  });

  it('should handle GitHub token missing error', async () => {
    delete process.env.GITHUB_TOKEN;

    const result = await checkLicenseCompatibility('https://github.com/some/repo');
    expect(result.score).to.equal(0);
    expect(result.details).to.include('GitHub token not set');
  });

  it('should handle API failure gracefully', async () => {
    sinon.stub(axios, 'get').rejects(new Error('API failed'));

    const result = await checkLicenseCompatibility('https://github.com/some/repo');
    expect(result.score).to.equal(0);
    expect(result.details).to.include('Error checking license: API failed');
  });
});

//test suite for calculateCorrectnessMetric
describe('calculateCorrectnessMetric', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('should return 0 for a project with no test files or frameworks', async () => {
    sinon.stub(fs.promises, 'readFile').resolves('{}');
    sinon.stub(fs.promises, 'readdir').resolves([]);

    const result = await calculateCorrectnessMetric('./mock/path');
    expect(result).to.equal(0);
  });

  it('should return a score greater than 0 for a project with test files', async () => {
    sinon.stub(fs.promises, 'readFile').resolves(JSON.stringify({
      devDependencies: { jest: "^26.0.0" }
    }));
    sinon.stub(fs.promises, 'readdir').resolves([
      { name: 'test.js',
        isFile: () => true,
        isDirectory: () => false } as unknown as fs.Dirent]);
    sinon.stub(fs.promises, 'stat').resolves({
      isFile: () => true,
      isDirectory: () => false
    } as unknown as fs.Stats);

    const result = await calculateCorrectnessMetric('./mock/path');
    expect(result).to.be.greaterThan(0);
  });
});

//test suite for calculateResponsiveMaintainerMetric
describe('calculateResponsiveMaintainerMetric', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('should return 0 for a repository with no activity', async () => {
    sinon.stub(axios, 'get').resolves({ data: [] });

    const result = await calculateResponsiveMaintainerMetric('https://github.com/user/repo');
    expect(result).to.equal(0);
  });

  it('should return a score between 0 and 1 for a repository with mixed activity', async () => {
    const axiosStub = sinon.stub(axios, 'get');
    axiosStub.onFirstCall().resolves({ data: [{}, {}] }); // 2 closed issues
    axiosStub.onSecondCall().resolves({ data: [{ closed_at: new Date().toISOString() }] }); // 1 recent closed PR
    axiosStub.onThirdCall().resolves({ data: [{}] }); // 1 open issue

    const result = await calculateResponsiveMaintainerMetric('https://github.com/user/repo');
    expect(result).to.be.within(0, 1);
  });

  it('should handle API errors gracefully', async () => {
    sinon.stub(axios, 'get').rejects(new Error('API error'));

    const result = await calculateResponsiveMaintainerMetric('https://github.com/user/repo');
    expect(result).to.equal(0);
  });
});


