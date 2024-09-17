import simpleGit from 'simple-git';
import * as fs from 'fs';
import * as fsp from 'fs/promises'
import * as path from 'path';
import axios from 'axios';
import { Octokit } from "@octokit/core";

const GITHUB_API_URL = 'https://api.github.com/repos'; // GitHub API endpoint for repository data
const NPM_REGISTRY_URL = 'https://registry.npmjs.org/'; // NPM registry endpoint for package data
const PER_PAGE = 100; // GitHub API truncates certain number of contributors
const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // GitHub personal access token for authentication
const octokit = new Octokit({ auth: GITHUB_TOKEN }); // Create an authenticated Octokit instance

// Function to fetch the total number of contributors for a GitHub repository
export async function getGithubContributors(url: string): Promise<number> {
  //console.log(`Analyzying URL ${url}------1:`);
  const repoPath = url.replace('https://github.com/', ''); // Extract the repository path from the provided GitHub URL
  let totalContributors = 0;
  let page = 1; // Start with the first page of results as github APO truncates to 100 users per page

  try {
    // Loop through all available contributor pages from the GitHub API
    while (true) {
      // Send a GET request to the GitHub API to fetch contributors for the current page
      const response = await axios.get(`${GITHUB_API_URL}/${repoPath}/contributors`, {
        params: {
          per_page: PER_PAGE, // Request up to 100 contributors at a time (GitHub API limit)
          page: page, // Request the current page of contributors
        },
        headers: { 'Accept': 'application/vnd.github.v3+json' }, // Use the latest version of the GitHub API
      });

      const contributors = response.data; // Extract contributor data from the API response
      totalContributors += contributors.length; // Add the number of contributors on this page to the total count

      // If we get fewer contributors than the maximum allowed per page, we've reached the last page
      if (contributors.length < PER_PAGE) {
        break; // Exit the loop when no more pages of contributors are available
      }

      page++; // Increment the page number to fetch the next set of contributors
    }
    //console.log(`\nModule ${repoPath} has ${totalContributors} contributors!!!!!!!!!!!!!!!!!\n`);
    console.error(`Success fetching contributors for GitHub repo ${url}`);
    return totalContributors; // Return the total number of contributors
  } catch (error: any) {
    // Handle any errors that occur during the API request
    console.error(`Error fetching contributors for GitHub repo ${url}:`, error.message);
    return -1; // Return -1 to indicate failure
  }
}

// Function to fetch the number of contributors for an npm package
export async function getNpmContributors(packageName: string): Promise<number> {
  try {
    // Send a GET request to the npm registry to get package details
    const response = await axios.get(`${NPM_REGISTRY_URL}${packageName}`);
    const repository = response.data.repository; // Extract the repository information from the package data

    // Check if the npm package has a GitHub repository link
    if (repository && repository.type === 'git' && repository.url) {
      let repoUrl = repository.url.replace(/^git\+/, '') // Remove any "git+" prefix from the repository URL
                                  .replace(/^ssh:\/\//, 'https://') // Fix ssh URL to https
                                  .replace(/^https:\/\/git@github.com\//, 'https://github.com/') // Fix incorrect URL starting with "https://git@github.com/"
                                  .replace(/^git\+ssh:\/\//, 'https://'); // Handle git+ssh

      const formattedUrl = repoUrl.replace(/\.git$/, ''); // Remove the ".git" suffix from the URL
      return getGithubContributors(formattedUrl); // Reuse the GitHub function to fetch contributors
    } else {
      console.log(`npm package: ${packageName} - Repository information not available.`);
      return -1; // Return -1 if there is no repository information
    }
  } catch (error: any) {
    // Handle any errors during the request
    console.error(`Error fetching data for npm package ${packageName}:`, error.message);
    return -1; // Return -1 to indicate failure
  }
}

// Function to clone a GitHub repository locally using simple-git
export async function cloneRepo(url: string, localPath: string): Promise<void> {
  const git = simpleGit(); // Create an instance of simple-git for performing git operations
  try {
    await git.clone(url, localPath); // Clone the GitHub repository into the specified local directory
  } catch (error: any) {
    //console.error(`Error cloning repo: ${error.message}`); // Log any errors that occur during cloning
  }
}

// Function to count Source Lines of Code (SLOC) and comments in a file
function countSlocAndComments(fileContent: string): { sloc: number, comments: number } {
  const lines = fileContent.split('\n'); // Split the file content into individual lines
  let sloc = 0; // Initialize SLOC count
  let comments = 0; // Initialize comment count
  let inBlockComment = false; // Keep track of whether we're inside a block comment

  // Iterate through each line of the file
  for (const line of lines) {
    const trimmedLine = line.trim(); // Trim whitespace from the line

    // Handle block comments (e.g., /* ... */)
    if (inBlockComment) {
      comments++; // Count each line inside a block comment
      if (trimmedLine.endsWith('*/')) {
        inBlockComment = false; // End the block comment
      }
    } else if (trimmedLine.startsWith('//')) {
      comments++; // Single-line comment (e.g., // Comment)
    } else if (trimmedLine.startsWith('/*')) {
      comments++; // Block comment start (e.g., /* Comment)
      inBlockComment = !trimmedLine.endsWith('*/'); // If the block comment doesn't end on the same line, continue
    } else if (trimmedLine.length > 0) {
      sloc++; // Count lines of code that aren't empty or comments
    }
  }

  return { sloc, comments }; // Return the SLOC and comment counts
}

// Recursive function to walk through a directory and apply a callback to each JavaScript or TypeScript file
async function walkDirectory(dir: string, fileCallback: (filePath: string) => void) {
  const files = fs.readdirSync(dir); // Read the directory contents

  for (const file of files) {
    const fullPath = path.join(dir, file); // Construct the full path of the file
    const stat = fs.statSync(fullPath); // Get file statistics to determine if it's a file or directory

    // If the item is a directory, recursively walk through its contents
    if (stat.isDirectory()) {
      await walkDirectory(fullPath, fileCallback);
    } else if (file.endsWith('.ts') || file.endsWith('.js')) {
      fileCallback(fullPath); // Apply the callback to JavaScript and TypeScript files
    }
  }
}

// Function to calculate the "Ramp Up" metric based on comment-to-SLOC ratio
export async function calculateRampUpMetric(localPath: string): Promise<{ sloc: number, comments: number, ratio: number }> {
  let totalSloc = 0; // Initialize total SLOC count
  let totalComments = 0; // Initialize total comment count

  // Walk through all files in the repository directory and sum up SLOC and comments
  await walkDirectory(localPath, (filePath) => {
    const fileContent = fs.readFileSync(filePath, 'utf8'); // Read the file content as a string
    const { sloc, comments } = countSlocAndComments(fileContent); // Count SLOC and comments in the file
    totalSloc += sloc; // Add to total SLOC count
    totalComments += comments; // Add to total comment count
  });

  const ratio = totalComments / totalSloc; // Calculate the ratio of comments to SLOC

  return { sloc: totalSloc, comments: totalComments, ratio }; // Return the calculated metric
}


export async function checkLicenseCompatibility(url: string): Promise<{ score: number, details: string }> {

  if (!GITHUB_TOKEN) {
    //GitHub token is not set. Set the GITHUB_TOKEN environment variable!!!!!!!!!!!!!!
    return { score: 0, details: 'GitHub token not set' };
  }

  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'Authorization': `token ${GITHUB_TOKEN}`,
    'User-Agent': 'Your-App-Name'
  };

  try {
    let repoPath;
    if (url.startsWith('https://www.npmjs.com/package/')) {
      const packageName = url.replace('https://www.npmjs.com/package/', '');
      const npmResponse = await axios.get(`${NPM_REGISTRY_URL}${packageName}`);
      const repository = npmResponse.data.repository;
      if (repository && repository.url) {
        repoPath = repository.url
          .replace('git+https://github.com/', '')
          .replace('git://github.com/', '')
          .replace('https://github.com/', '')
          .replace('.git', '');
      } else {
        return { score: 0, details: 'No GitHub repository found for npm package' };
      }
    } else {
      repoPath = url.replace('https://github.com/', '');
    }

    let licenseInfo = '';

    // Check LICENSE file
    try {
      const licenseResponse = await axios.get(`${GITHUB_API_URL}/${repoPath}/contents/LICENSE`, { headers });
      licenseInfo = Buffer.from(licenseResponse.data.content, 'base64').toString('utf-8');
    } catch (error) {
        //console.log(`LICENSE file not found for repository ${repoPath}, checking package.json...`);
      
      // Check package.json
      try {
        const packageJsonResponse = await axios.get(`${GITHUB_API_URL}/${repoPath}/contents/package.json`, { headers });
        const packageJsonContent = JSON.parse(Buffer.from(packageJsonResponse.data.content, 'base64').toString('utf-8'));
        licenseInfo = packageJsonContent.license || '';
      } catch (error) {
        console.log('package.json not found or does not contain license information');
      }
    }

    // If still no license info, check README
    if (!licenseInfo) {
      const readmeResponse = await axios.get(`${GITHUB_API_URL}/${repoPath}/readme`, { headers });
      const readmeContent = Buffer.from(readmeResponse.data.content, 'base64').toString('utf-8');
      licenseInfo = extractLicenseFromReadme(readmeContent) || '';
    }

    if (licenseInfo) {
      const compatible = isCompatibleWithLGPLv2_1(licenseInfo);
      return {
        score: compatible ? 1 : 0,
        details: `License found: ${licenseInfo.split('\n')[0]}. Compatible: ${compatible}`
      };
    }

    return { score: 0, details: 'No license information found' };
  } catch (error: any) {
    console.error(`Error checking license: ${error.message}`);
    return { score: 0, details: `Error checking license: ${error.message}` };
  }
}

function extractLicenseFromReadme(content: string): string | null {
  const licenseRegex = /#+\s*License\s*([\s\S]*?)(?=#+|$)/i;
  const match = content.match(licenseRegex);
  return match ? match[1].trim() : null;
}

function isCompatibleWithLGPLv2_1(licenseText: string): boolean {
  const compatibleLicenses = [
    'LGPL-2.1', 'LGPL-3.0',
    'GPL-2.0', 'GPL-3.0',
    'MIT', 'BSD-2-Clause', 'BSD-3-Clause',
    'Apache-2.0', 'ISC', 'Unlicense'
  ];

  if (licenseText.toUpperCase() === 'UNLICENSED') {
    return false;
  }

  return compatibleLicenses.some(license => 
    licenseText.toLowerCase().includes(license.toLowerCase()) ||
    licenseText.toLowerCase().includes(license.toLowerCase().replace('-', ' '))
  );
}

async function detectTestFrameworks(projectPath: string): Promise<string[]> {
  const frameworks: string[] = [];
  const knownTestFrameworks = ['jest', 'mocha', 'jasmine', 'ava', 'cypress'];

  try {
      // Read package.json to check for testing frameworks in dependencies or devDependencies
      const packageJsonPath = path.join(projectPath, 'package.json');
      const packageJson = JSON.parse(await fsp.readFile(packageJsonPath, 'utf-8'));
      const devDependencies = packageJson.devDependencies || {};
      const dependencies = packageJson.dependencies || {};

      // Check for known test frameworks in both dependencies and devDependencies
      for (const framework of knownTestFrameworks) {
          if (devDependencies[framework] || dependencies[framework]) {
              frameworks.push(framework);
          }
      }
  } catch (error: any) {
      console.error(`Error reading package.json for test frameworks: ${error.message}`);
  }

  return frameworks;
}

export async function calculateCorrectnessMetric(projectPath: string, sloc: number): Promise<number> {
  let totalLinesOfTestCode = 0;

  // Detect test frameworks to guide which files should be checked
  const detectedFrameworks = await detectTestFrameworks(projectPath);
  //console.log(`Detected test frameworks: ${detectedFrameworks.length > 0 ? detectedFrameworks.join(', ') : 'None'}`);

  // Define framework-specific test file patterns
  const frameworkSpecificPatterns: { [framework: string]: string[] } = {
      jest: ['.test.js', '.test.ts', '.spec.js', '.spec.ts', '__tests__/'],
      mocha: ['.test.js', '.spec.js', 'test/'],
      jasmine: ['.spec.js', 'spec/'],
      cypress: ['.cy.js', '.cy.ts', 'cypress/integration/'],
      ava: ['.test.js', 'test/']
  };

  // Default test file patterns to check if no frameworks are detected
  const defaultTestFilePatterns = ['.test.js', '.spec.js', 'test/', '__tests__/'];

  // Helper function to check if a file matches test file patterns for the detected frameworks
  function isTestFile(fileName: string, filePath: string): boolean {
      // If no frameworks are detected, fall back to default test patterns
      const patterns = detectedFrameworks.length > 0
          ? detectedFrameworks.reduce((acc, framework) => {
              if (frameworkSpecificPatterns[framework]) {
                  acc.push(...frameworkSpecificPatterns[framework]);
              }
              return acc;
          }, [] as string[])
          : defaultTestFilePatterns;

      // Check if the file matches any of the framework-specific or default patterns
      return patterns.some(pattern => fileName.endsWith(pattern) || filePath.includes(pattern));
  }

  // Helper function to count lines in a file asynchronously
  async function countLinesInFile(filePath: string): Promise<number> {
      try {
          const fileContent = await fsp.readFile(filePath, 'utf-8');
          return fileContent.split('\n').length;
      } catch (error: any) {
          console.error(`Error reading file ${filePath}: ${error.message}`);
          return 0; // Return 0 in case of error reading file
      }
  }

  // Asynchronously walk through directories
  async function walkTestDirectory(currentPath: string): Promise<void> {
      try {
          const files = await fsp.readdir(currentPath);

          const promises = files.map(async (file) => {
              const fullPath = path.join(currentPath, file);
              const stats = await fsp.stat(fullPath);

              if (stats.isDirectory()) {
                  // Recursively walk through subdirectories
                  await walkTestDirectory(fullPath);
              } else if (stats.isFile() && isTestFile(file, fullPath)) {
                  // If it's a test file, count the number of lines and add to the total
                  const lineCount = await countLinesInFile(fullPath);
                  totalLinesOfTestCode += lineCount;
              }
          });

          // Wait for all promises to complete
          await Promise.all(promises);
      } catch (error: any) {
          console.error(`Error walking directory ${currentPath}: ${error.message}`);
      }
  }

  // Start walking the project directory
  await walkTestDirectory(projectPath);

  // Return the ratio of SLOTC to SLOC, or 0 if SLOC is 0 to avoid division by zero
  return sloc === 0 ? 0 : totalLinesOfTestCode / sloc;
}

export async function calculateResponsiveMaintainerMetric(url: string): Promise<number> {
  try {
    const repoPath = url.replace('https://github.com/', '');
    const [owner, repo] = repoPath.split('/');

    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const dateFilter = oneMonthAgo.toISOString();

    // Get closed issues in last month
    const closedIssuesResponse = await octokit.request('GET /repos/{owner}/{repo}/issues', {
      owner,
      repo,
      state: 'closed',
      since: dateFilter,
    });
    const closedIssues = closedIssuesResponse.data;

    // Get closed pull requests in last month
    const closedPRsResponse = await octokit.request('GET /repos/{owner}/{repo}/pulls', {
      owner,
      repo,
      state: 'closed',
      sort: 'updated',
      direction: 'desc',
    });
    const closedPRs = closedPRsResponse.data;
    const recentClosedPRs = closedPRs.filter(pr => new Date(pr.closed_at!) >= oneMonthAgo);

    // Get total open issues and PRs
    const openIssuesResponse = await octokit.request('GET /repos/{owner}/{repo}/issues', {
      owner,
      repo,
      state: 'open',
    });
    const openIssues = openIssuesResponse.data;

    const totalClosed = closedIssues.length + recentClosedPRs.length;
    const totalOpen = openIssues.length;

    // Calculation for responsive maintainer
    const responsiveScore = totalOpen === 0 && totalClosed === 0 ? 0 : totalClosed / (totalClosed + totalOpen);

    return Math.min(responsiveScore, 1); // Make sure the score is between 0 and 1
  } catch (error: any) {
    console.error(`Error calculating Responsive Maintainer metric: ${error.message}`);
    return 0;
  }
}
