import simpleGit from 'simple-git';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

const GITHUB_API_URL = 'https://api.github.com/repos'; // GitHub API endpoint for repository data
const NPM_REGISTRY_URL = 'https://registry.npmjs.org/'; // NPM registry endpoint for package data
const PER_PAGE = 100; // GitHub API truncates certain number of contributors
const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // GitHub personal access token for authentication

// Function to fetch the total number of contributors for a GitHub repository
export async function getGithubContributors(url: string): Promise<number> {
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
      const repoUrl = repository.url.replace(/^git\+/, ''); // Remove any "git+" prefix from the repository URL
      const formattedUrl = repoUrl.replace(/\.git$/, ''); // Remove the ".git" suffix from the URL
      //All npm repostiroes have a github repo available
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
    console.log(`Successfully cloned ${url}`); // Log a success message after the clone
  } catch (error: any) {
    console.error(`Error cloning repo: ${error.message}`); // Log any errors that occur during cloning
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
  console.log(`Total SLOC: ${totalSloc}, Total Comments: ${totalComments}, Comment-to-SLOC Ratio: ${ratio.toFixed(2)}`);

  return { sloc: totalSloc, comments: totalComments, ratio }; // Return the calculated metric
}


export async function checkLicenseCompatibility(url: string): Promise<{ score: number, details: string }> {
  console.log('Checking license compatibility for:', url);

  if (!GITHUB_TOKEN) {
    console.error('GitHub token is not set. Please set the GITHUB_TOKEN environment variable.');
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
      console.log('LICENSE file not found, checking package.json');
      
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
  return compatibleLicenses.some(license => 
    licenseText.toLowerCase().includes(license.toLowerCase()) ||
    licenseText.toLowerCase().includes(license.toLowerCase().replace('-', ' '))
  );
}
