import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { expect } from 'chai';
import simpleGit from 'simple-git';
import * as sinon from 'sinon';
import axios from 'axios';
import { getBusFactor, calculateRampUpMetric, cloneRepo, checkLicenseCompatibility, calculateCorrectnessMetric, calculateResponsiveMaintainerMetric } from './metrics';
import Mocha from 'mocha';

export async function runMochaTests() {
    const mocha = new Mocha({
        ui: 'bdd',   // Behavior-driven development interface (describe, it)
        reporter: 'spec'  // You can choose a different reporter if you want
    });

    // Add test file
    mocha.addFile(path.join(__dirname, 'test.js')); // Ensure path is correct for the compiled test.js

    return new Promise((resolve, reject) => {
        mocha.run(failures => {
            if (failures) {
                reject(new Error(`Test suite failed with ${failures} failures.`));
            } else {
                resolve(true);
            }
        });
    });
}



export async function runtest() {
    //call currently made commands
    try { //tests the "install" command
        console.log('Test Start: checking fuckfuckfuckfuckfuck if "npm install" was run correctly');//We have to check for the files that would be installed by 'npm install'
    
        const packageLockPath = path.join(process.cwd(), 'package-lock.json');//Check if package-lock.json exists or has been updated
        if (!fs.existsSync(packageLockPath)) {
            throw new Error('Test failed: package-lock.json not found. "npm install" did not run correctly');
        }

    // Read and parse the package.json file
    const packageJson = JSON.parse(fs.readFileSync(packageLockPath, 'utf-8'));

    // Get the list of dependencies and devDependencies
    const dependencies = Object.keys(packageJson.dependencies || {});
    const devDependencies = Object.keys(packageJson.devDependencies || {});

    // Combine dependencies and devDependencies
    const allDependencies = [...dependencies, ...devDependencies];

    // Run 'npm list' command to get the installed dependencies
    const npmListOutput = execSync('npm list --depth=0 --json').toString();
    const installedPackages = JSON.parse(npmListOutput).dependencies || {};

    // Check if each dependency is listed in the installed packages
    for (const dependency of allDependencies) {
        if (!installedPackages[dependency]) {
            throw new Error(`Test failed: Dependency "${dependency}" is not installed. "npm install" did not run correctly.`);
        }
    }
    
        console.log('Test passed: All packages accounted for. "npm install" ran correctly');
    } catch (error) {
        console.error('Test failed:', error);
    }
}
    
export async function test() {

        // Test suite for getBusFactor
    describe('getBusFactor', () => {
        afterEach(() => {
            sinon.restore();
        });
  
    it('should return the correct bus factor score based on GitHub contributors', async () => {
        const mockResponse = { data: [{}, {}, {}] }; // Mock 3 contributors
        sinon.stub(axios, 'get').resolves(mockResponse);
  
        const busFactor = await getBusFactor('https://github.com/some/repo');
        expect(busFactor).to.equal(0.3); // Expect 0.3 based on contributor calculation
    });
  
    it('should return -1 if the API call fails', async () => {
        sinon.stub(axios, 'get').rejects(new Error('API failed'));
  
        const busFactor = await getBusFactor('https://github.com/some/repo');
        expect(busFactor).to.equal(-1);
    });
});
    
    // describe('calculateRampUpMetric', () => {
    //     afterEach(() => {
    //         sinon.restore();
    //     });
      
    //     it('should calculate the correct SLOC and comment ratio', async () => {
    //       const mockFileContent = `// This is a comment
    //         const x = 5; // Another comment
    //         /* Block comment */
    //         function test() { return x; }`;
      
    //       // Stub the fs.readFileSync to return the mock file content
    //       sinon.stub(fs, 'readFileSync').returns(mockFileContent);
      
    //       const result = await calculateRampUpMetric('./local/path');
    //       expect(result.sloc).to.equal(2); // Expect 2 lines of code
    //       expect(result.comments).to.equal(3); // Expect 3 comment lines
    //       expect(result.ratio).to.be.closeTo(1.5, 0.01); // Comment-to-SLOC ratio should be 1.5
    //     });
    // });
      
      // Test suite for cloneRepo
      describe('cloneRepo', () => {
        it('should successfully clone a repository', async () => {
            const mockGit = sinon.stub(simpleGit(), 'clone').resolves();
      
            await cloneRepo('https://github.com/some/repo', './local/path');
            expect(mockGit.calledOnce).to.be.true;
      
            mockGit.restore();
        });
      
        it('should log an error if cloning fails', async () => {
            
            const mockGit = sinon.stub(simpleGit(), 'clone').rejects(new Error('Clone failed')); //stuff being changed for compatibility (note for Nic)
            const consoleErrorSpy = sinon.spy(console, 'error');
      
            await cloneRepo('https://github.com/some/repo', './local/path');
            expect(consoleErrorSpy.calledWithMatch(/Clone failed/)).to.be.true;
      
            mockGit.restore();
            consoleErrorSpy.restore();
        });
    });
      
      // Test suite for checkLicenseCompatibility
      describe('checkLicenseCompatibility', () => {
        afterEach(() => {
          sinon.restore();
        });
      
        it('should return a compatible license score and details', async () => {
          const mockLicenseResponse = {
            data: { content: Buffer.from('MIT License').toString('base64') },
          };
          sinon.stub(axios, 'get').resolves(mockLicenseResponse);
      
          const result = await checkLicenseCompatibility('https://github.com/some/repo');
          expect(result.score).to.equal(1);
          expect(result.details).to.include('MIT License');
        });
      
        it('should return 0 if no license is found', async () => {
          sinon.stub(axios, 'get').rejects(new Error('LICENSE file not found'));
      
          const result = await checkLicenseCompatibility('https://github.com/some/repo');
          expect(result.score).to.equal(0);
          expect(result.details).to.include('No license information found');
        });
      });
      
      // Test suite for calculateCorrectnessMetric
      describe('calculateCorrectnessMetric', () => {
        let mockStat: sinon.SinonStubbedInstance<fs.Stats>;

        beforeEach(() => {
          // Create a stubbed instance of the Stats class and configure it
          mockStat = sinon.createStubInstance(fs.Stats);
      
          // Ensure isFile and isDirectory return correct boolean values
          mockStat.isFile.returns(true);        // Mock it as a file
          mockStat.isDirectory.returns(false);  // Mock it as not a directory
      
          // Stub fs.promises.stat to return the mockStat instance
          sinon.stub(fs.promises, 'stat').resolves(mockStat as unknown as fs.Stats);
        });
      
        afterEach(() => {
          // Restore the original fs.promises.stat after each test to avoid conflicts
          sinon.restore();
        });
      
        it('should calculate the test suite coverage correctly', async () => {
          // Mock fs.promises.readFile to simulate package.json and test files
          const mockReadFile = sinon.stub(fs.promises, 'readFile').resolves(JSON.stringify({
            devDependencies: {
              jest: "^26.0.0"
            }
          }));
          //const mockReaddir = sinon.stub(fs.promises, 'readdir').resolves(['test.js']);
          const mockReaddir = sinon.stub(fs.promises, 'readdir').resolves([
            { name: 'test.js', isFile: () => true, isDirectory: () => false } as unknown as fs.Dirent
          ]);
          //const mockStat = sinon.stub(fs.promises, 'stat').resolves({ isFile: () => true, isDirectory: () => false });
          const mockStat = sinon.stub(fs.promises, 'stat').resolves({
            isFile: () => true,
            isDirectory: () => false,
            atime: new Date(),
            mtime: new Date(),
            ctime: new Date(),
            birthtime: new Date(),
            // add any other properties as needed
          } as unknown as fs.Stats);
          
      
          const result = await calculateCorrectnessMetric('./local/path');
          expect(result).to.be.greaterThan(0.5); // Because we have a test suite (jest)
          
          mockReadFile.restore();
          mockReaddir.restore();
          mockStat.restore();
        });
      });
      
      // Test suite for calculateResponsiveMaintainerMetric
      describe('calculateResponsiveMaintainerMetric', () => {
        afterEach(() => {
          sinon.restore();
        });
      
        it('should calculate the correct responsive maintainer score', async () => {
          const mockIssuesResponse = {
            data: [{}, {}, {}] // 3 closed issues
          };
          const mockPullsResponse = {
            data: [{ closed_at: '2021-10-01T00:00:00Z' }] // 1 closed PR in the last month
          };
          const mockOpenIssuesResponse = {
            data: [{}] // 1 open issue
          };
      
          sinon.stub(axios, 'get')
            .onFirstCall().resolves(mockIssuesResponse) // Closed issues
            .onSecondCall().resolves(mockPullsResponse) // Closed PRs
            .onThirdCall().resolves(mockOpenIssuesResponse); // Open issues
      
          const score = await calculateResponsiveMaintainerMetric('https://github.com/some/repo');
          expect(score).to.be.closeTo(0.75, 0.01); // Responsive score based on mock data
        });
      });
      
}
