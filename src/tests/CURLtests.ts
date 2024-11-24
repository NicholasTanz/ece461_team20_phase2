import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

const uploadsDir = path.join(__dirname, '../uploads');
const remotetestDir = path.join(__dirname, '../../remotetest');
const testFilePath = path.join(remotetestDir, 'test-package-content-11.0.0.zip');

if (!fs.existsSync(uploadsDir)) {
  console.error('Uploads directory does not exist:', uploadsDir);
} else {
  console.log('Uploads directory found:', uploadsDir);
}

// Helper function to run curl commands
function runCurlCommand(command: string, description: string): Promise<void> {
  console.log(`\n### ${description} ###`);
  console.log(`Command: ${command}\n`);

  return new Promise((resolve, reject) => {
    exec(command, (error: Error | null, stdout: string, stderr: string) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        reject(error);
      } else if (stderr) {
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
const testJSProgram = `if (process.argv.length === 7) { console.log(\\\"Success\\\"); process.exit(0); } else { console.log(\\\"Failed\\\"); process.exit(1); }`;
const testURL = 'https://github.com/jashkenas/underscore';

async function apiTests() {
  try {
    // 1. Upload test-package-content-11.0.0.zip
  await runCurlCommand(
    `curl -X POST http://localhost:3000/ingest/package \
    -H "Content-Type: application/json" \
    -d "{\\"Name\\":\\"test-package-content\\",\\"Version\\":\\"11.0.0\\",\\"Content\\":\\"${testPackageContent}\\",\\"JSProgram\\":\\"${testJSProgram}\\"}"`,    
    'Upload to api test-package-content-11.0.0.zip'
  )
  } catch (error) {
  console.error('Test failed:', error);
  } 
}

async function runTests() {
  try {
    // 1. Upload test-package-content-11.0.0.zip
    await runCurlCommand(
      `curl -X POST http://localhost:3000/send/package \
      -H "Content-Type: multipart/form-data" \
      -F "Name=test-package-content" \
      -F "Version=11.0.0" \
      -F "content=@${testFilePath}"`,
      'Upload test-package-content-11.0.0.zip'
    );

    // 2. Upload a new package via URL
    await runCurlCommand(
      `curl -X POST http://localhost:3000/send/package \
      -H "Content-Type: application/json" \
      -d "{\\"Name\\":\\"test-package-url\\",\\"Version\\":\\"1.1.0\\",\\"URL\\":\\"https://github.com/jashkenas/underscore\\",\\"JSProgram\\":\\"if (process.argv.length === 7) { console.log(\\\\\\"Success\\\\\\"); process.exit(0); } else { console.log(\\\\\\"Failed\\\\\\"); process.exit(1); }\\"}"`,
      'Upload a new package via URL'
    );

    // Upload initial package for update testing
    await runCurlCommand(
      `curl -X POST http://localhost:3000/send/package \
      -H "Content-Type: multipart/form-data" \
      -F "Name=test-update-content" \
      -F "Version=" \
      -F "JSProgram=if (process.argv.length === 7) { console.log(\\\\\\"Success\\\\\\"); process.exit(0); } else { console.log(\\\\\\"Failed\\\\\\"); process.exit(1); }" \
      -F "content=@${path.join(remotetestDir, 'test-update-content.zip')}"`,
      'Upload initial package for update testing'
    );

    await runCurlCommand(
      `curl -X POST http://localhost:3000/send/package \
      -H "Content-Type: application/json" \
      -d "{\\"Name\\":\\"test-update-url\\",\\"Version\\":\\"1.0.0\\",\\"URL\\":\\"https://github.com/jashkenas/underscore\\",\\"JSProgram\\":\\"if (process.argv.length === 7) { console.log(\\\\\\"Success\\\\\\"); process.exit(0); } else { console.log(\\\\\\"Failed\\\\\\"); process.exit(1); }\\"}"`,
      'Upload a new package via URL'
    );

    // 3. Update content-based file to version 1.2.1
    await runCurlCommand(
      `curl -X PUT http://localhost:3000/send/package/test-update-content-ver-1-0-0 \
      -H "Content-Type: multipart/form-data" \
      -F "Name=test-update-content" \
      -F "Version=1.2.1" \
      -F "JSProgram=if (process.argv.length === 7) { console.log(\\\\\\"Success\\\\\\"); process.exit(0); } else { console.log(\\\\\\"Failed\\\\\\"); process.exit(1); }" \
      -F "content=@${path.join(remotetestDir, 'test-update-content-1.2.1.zip')}"`,
      'Update content-based file to version 1.2.1'
    );

    // 4. Update URL-based file to version 1.2.1
    await runCurlCommand(
      `curl -X PUT http://localhost:3000/send/package/test-update-url-ver-1-0-0 \
      -H "Content-Type: application/json" \
      -d "{\\"Name\\":\\"test-update-url\\",\\"Version\\":\\"1.2.1\\",\\"URL\\":\\"https://github.com/jashkenas/underscore\\",\\"JSProgram\\":\\"if (process.argv.length === 7) { console.log(\\\\\\"Success\\\\\\"); process.exit(0); } else { console.log(\\\\\\"Failed\\\\\\"); process.exit(1); }\\"}"`,
      'Update URL-based file to version 1.1.1'
    );

    // 5. Update content-based file to version 1.1.1
    await runCurlCommand(
      `curl -X PUT http://localhost:3000/send/package/test-update-content-ver-1-0-0 \
      -H "Content-Type: multipart/form-data" \
      -F "Name=test-update-content" \
      -F "Version=1.1.1" \
      -F "JSProgram=if (process.argv.length === 7) { console.log(\\\\\\"Success\\\\\\"); process.exit(0); } else { console.log(\\\\\\"Failed\\\\\\"); process.exit(1); }" \
      -F "content=@${path.join(remotetestDir, 'test-update-content-1.1.1.zip')}"`,
      'Update content-based file to version 1.1.1'
    );

    // 6. Update URL-based file to version 1.1.1
    await runCurlCommand(
      `curl -X PUT http://localhost:3000/send/package/test-update-url-ver-1-0-0 \
      -H "Content-Type: application/json" \
      -d "{\\"Name\\":\\"test-update-url\\",\\"Version\\":\\"1.1.1\\",\\"URL\\":\\"https://github.com/jashkenas/underscore\\",\\"JSProgram\\":\\"if (process.argv.length === 7) { console.log(\\\\\\"Success\\\\\\"); process.exit(0); } else { console.log(\\\\\\"Failed\\\\\\"); process.exit(1); }\\"}"`,
      'Update URL-based file to version 1.2.0'
    );

    // 7. Attempt to update content-based file to version 1.1.0 (should fail)
    await runCurlCommand(
      `curl -X PUT http://localhost:3000/send/package/test-update-content-ver-1-0-0 \
      -H "Content-Type: multipart/form-data" \
      -F "Name=test-update-content" \
      -F "Version=1.1.0" \
      -F "JSProgram=if (process.argv.length === 7) { console.log(\\\\\\"Success\\\\\\"); process.exit(0); } else { console.log(\\\\\\"Failed\\\\\\"); process.exit(1); }" \
      -F "content=@${path.join(remotetestDir, 'test-update-content-1.1.0.zip')}"`,
      'Attempt to update content-based file to version 1.1.0 (should fail)'
    );

    // 8. Update URL-based file to version 1.1.0 (should succeed)
    await runCurlCommand(
      `curl -X PUT http://localhost:3000/send/package/test-update-url-ver-1-0-0 \
      -H "Content-Type: application/json" \
      -d "{\\"Name\\":\\"test-update-url\\",\\"Version\\":\\"1.1.0\\",\\"URL\\":\\"https://github.com/jashkenas/underscore\\",\\"JSProgram\\":\\"if (process.argv.length === 7) { console.log(\\\\\\"Success\\\\\\"); process.exit(0); } else { console.log(\\\\\\"Failed\\\\\\"); process.exit(1); }\\"}"`,
      'Update URL-based file to version 1.1.0'
    );

    // 9. Fetch test-package-content
    await runCurlCommand(
      `curl -X GET ${BASE_URL}/fetch/package/test-package-content-ver-11-0-0`,
      'Download test-package-content version 11.0.0'
    );

    // 10. Fetch test-package-url
    await runCurlCommand(
      `curl -X GET ${BASE_URL}/fetch/package/test-package-url-ver-1-1-0`,
      'Download test-package-url version 1.1.0'
    );

    // 11. Fetch test-update-url (updated version)
    await runCurlCommand(
      `curl -X GET ${BASE_URL}/fetch/package/test-update-url-ver-1-2-1`,
      'Download test-update-url version 1.2.1'
    );

    // 12. Fetch test-update-content (updated version)
    await runCurlCommand(
      `curl -X GET ${BASE_URL}/fetch/package/test-update-content-ver-1-2-1`,
      'Download test-update-content version 1.2.1'
    );
    // 13. Search for packages with "URL" in their names
    await runCurlCommand(
      `curl -X POST http://localhost:3000/search/package/byRegEx \
      -H "Content-Type: application/json" \
      -H "X-Authorization: your-valid-token" \
      -d "{\\"RegEx\\": \\".*url.*\\"}"`,
      'Search for packages with "url" in their names'
    );
    
    // 14. Search for packages with "Content" in their names
    await runCurlCommand(
      `curl -X POST http://localhost:3000/search/package/byRegEx \
      -H "Content-Type: application/json" \
      -H "X-Authorization: your-valid-token" \
      -d "{\\"RegEx\\": \\".*content.*\\"}"`,
      'Search for packages with "content" in their names'
    );    

    // 15. Delete test-update-content-1.0.0
    await runCurlCommand(
      `curl -X DELETE http://localhost:3000/delete/package/test-update-url-ver-1-0-0 \
      -H "X-Authorization: your-valid-token"`,
      'Delete test-update-content-1.0.0'
    );

    // 16. Delete test-update-url-1.0.0
    await runCurlCommand(
      `curl -X DELETE http://localhost:3000/delete/package/test-update-content-ver-1-0-0 \
      -H "X-Authorization: your-valid-token"`,
      'Delete test-update-url-1.0.0'
    );

    // 17. Display all packages using "*"
    await runCurlCommand(
      `curl -X POST http://localhost:3000/search/packages \
      -H "Content-Type: application/json" \
      -H "X-Authorization: your-valid-token" \
      -d "[{\\"Name\\": \\"*\\"}"]"`,
      'Display all packages using "*"'
    );
    
    // // 18. Trigger the reset endpoint with a valid authentication token
    // await runCurlCommand(
    //   `curl -X DELETE http://localhost:3000/reset \
    //   'Trigger system reset'
    // );

    
} catch (error) {
  console.error('Test failed:', error);
}
}
// Run the tests
apiTests();
