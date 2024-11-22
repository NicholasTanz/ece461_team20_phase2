"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
// Helper function to run curl commands
function runCurlCommand(command, description) {
    console.log(`\n### ${description} ###`);
    console.log(`Command: ${command}\n`);
    return new Promise((resolve, reject) => {
        (0, child_process_1.exec)(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error: ${error.message}`);
                reject(error);
            }
            else if (stderr) {
                console.error(`Stderr: ${stderr}`);
            }
            console.log(`Response: ${stdout}`);
            resolve();
        });
    });
}
// Base URL of the API
const BASE_URL = 'http://localhost:3000';
// Example data
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
async function runTests() {
    try {
        // 1. Upload a new package via Content
        await runCurlCommand(`curl -X POST ${BASE_URL}/sender/package -H "Content-Type: application/json" -d '${JSON.stringify({
            Name: 'test-package-content',
            Version: '1.0.0',
            Content: testPackageContent,
            JSProgram: testJSProgram,
        })}'`, 'Upload a new package via Content');
        // 2. Upload a new package via URL
        await runCurlCommand(`curl -X POST ${BASE_URL}/sender/package -H "Content-Type: application/json" -d '${JSON.stringify({
            Name: 'test-package-url',
            Version: '1.0.0',
            URL: testURL,
            JSProgram: testJSProgram,
        })}'`, 'Upload a new package via URL');
        // 3. Update an existing package via Content
        await runCurlCommand(`curl -X POST ${BASE_URL}/sender/package/1 -H "Content-Type: application/json" -d '${JSON.stringify({
            Name: 'test-package-content',
            Version: '2.0.0',
            Content: testPackageContent,
            JSProgram: testJSProgram,
        })}'`, 'Update an existing package via Content');
        // 4. Update an existing package via URL
        await runCurlCommand(`curl -X POST ${BASE_URL}/sender/package/2 -H "Content-Type: application/json" -d '${JSON.stringify({
            Name: 'test-package-url',
            Version: '2.0.0',
            URL: testURL,
            JSProgram: testJSProgram,
        })}'`, 'Update an existing package via URL');
        // 5. Download a package via Content
        await runCurlCommand(`curl -X GET ${BASE_URL}/receiver/download/1`, 'Download a package via Content');
        // 6. Download a package via URL
        await runCurlCommand(`curl -X GET ${BASE_URL}/receiver/download/2`, 'Download a package via URL');
    }
    catch (error) {
        console.error('Tests failed:', error);
    }
}
// Run the tests
runTests();
