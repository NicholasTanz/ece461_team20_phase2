/*
File Name: 
  metrics.ts

Function: 
  - This function performs the calculations on each metric in order to calculate:

  = Bus Factor: This metric measures essentially how many people are working on the code. Basically, how many people
  can be "hit by a bus" and there still be enough people to update the repository. We elected to measure this by the total
  number of contributors, we used a exponential scale and used our personal engineering judgement to assign a score to
  each number of contributors. 

  = Ramp Up Time: This metrics measures essentially the amount of documentation surrounding the code. Basically, how
  quickly can you clone this reposity and understand how to implement it. We elected to calculate this metric by 4 sub-factors:
  the number of words in the readme, the ratio of comments to source lines of code, number of links in the readme that take you
  to a non GitHub/npm link, and if no readme was present assign the ramp up score a 0. We then assigned a multiplier to each factor
  by looking at a number of URLs and using our best engineering judgement to assign weights. 

  Correctness:

  Responsive Maintainer:

  License: 
*/

import simpleGit from 'simple-git';
import * as fs from 'fs';
import * as fsp from 'fs/promises'
import * as path from 'path';
import axios from 'axios';
import { Octokit } from "@octokit/core";
import logger from './logger';
import { marked } from 'marked';
import fetch from 'node-fetch';

const GITHUB_API_URL = 'https://api.github.com/repos'; // GitHub API endpoint for repository data
const NPM_REGISTRY_URL = 'https://registry.npmjs.org/'; // NPM registry endpoint for package data
const PER_PAGE = 100; // GitHub API truncates certain number of contributors
const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // GitHub personal access token for authentication
const octokit = new Octokit({ 
  auth: GITHUB_TOKEN,
  request: {
    fetch: fetch as any
  }
}); // Create an authenticated Octokit instance

export async function getBusFactor(url: string): Promise<number> {
  const repoPath = url.replace('https://github.com/', ''); // Extract the repository path from the provided GitHub URL
  let totalContributors = 0;
  let page = 1; // Start with the first page of results as github API truncates to 100 users per page

  logger.info(`Calculating Bus Factor for repository: ${url}`);

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

    logger.info(`Total contributors for ${url}: ${totalContributors}`);

    // Calculate the Bus Factor based on the total number of contributors
    let busFactorScore: number;
    if (totalContributors === 1) {
      busFactorScore = 0.1;
    } else if (totalContributors === 2) {
      busFactorScore = 0.2;
    } else if (totalContributors <= 4) {
      busFactorScore = 0.3;
    } else if (totalContributors <= 8) {
      busFactorScore = 0.4;
    } else if (totalContributors <= 16) {
      busFactorScore = 0.5;
    } else if (totalContributors <= 32) {
      busFactorScore = 0.6;
    } else if (totalContributors <= 64) {
      busFactorScore = 0.7;
    } else if (totalContributors <= 128) {
      busFactorScore = 0.8;
    } else if (totalContributors <= 256) {
      busFactorScore = 0.9;
    } else {
      busFactorScore = 1.0;
    }

    logger.info(`Calculated Bus Factor for ${url}: ${busFactorScore}`);

    return busFactorScore; // Return the calculated Bus Factor score
  } catch (error: any) {
    // Handle any errors that occur during the API request
    logger.debug(`Error fetching contributors for GitHub repo ${url}: ${error.message}`);
    return -1; // Return -1 to indicate failure
  }
}


// Function to clone a GitHub repository locally using simple-git
export async function cloneRepo(url: string, localPath: string): Promise<void> {
  const git = simpleGit();
  logger.info(`Cloning GitHub repo for Ramp Up calculation: ${url} into ${localPath}`);

  try {
    await git.clone(url, localPath, ['--depth', '1']);
    logger.info(`Cloning completed successfully for ${url}`);
  } catch (error: any) {
    logger.debug(`Error cloning repo ${url}: ${error.message}`);
  }
}

// Function to count Source Lines of Code (SLOC) and comments in a file (first 500 lines)
function countSlocAndCommentsLimited(fileContent: string): { sloc: number, comments: number } {
  const lines = fileContent.split('\n').slice(0, 500); // Limit to first 500 lines
  let sloc = 0;
  let comments = 0;
  let inBlockComment = false;

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Handle block comments (/* ... */)
    if (inBlockComment) {
      comments++;
      if (trimmedLine.endsWith('*/')) {
        inBlockComment = false;
      }
    } else if (trimmedLine.startsWith('//')) {
      comments++; // Single-line comment
    } else if (trimmedLine.startsWith('/*')) {
      comments++;
      inBlockComment = !trimmedLine.endsWith('*/');
    } else if (trimmedLine.length > 0) {
      sloc++; // Count lines of code
    }
  }

  return { sloc, comments };
}

// Function to walk through a directory and process only .js or .ts files
async function walkDirectoryLimited(dir: string, fileCallback: (filePath: string) => void) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      await walkDirectoryLimited(fullPath, fileCallback);
    } else if (file.endsWith('.ts') || file.endsWith('.js')) {
      fileCallback(fullPath);
    }
  }
}

// Function to read the README file and extract words and non-GitHub/npm links
function processReadme(readmeContent: string): { wordCount: number, nonGitHubLinksCount: number } {
  const wordCount = readmeContent.split(/\s+/).length;

  // Create a list to store the URLs found in the README
  const links: string[] = [];

  // Use a Markdown parser to find embedded links
  const renderer = new marked.Renderer();
  renderer.link = ({ href, title, tokens }) => {
    links.push(href); // Collect the href
    return ''; // Return an empty string since we just need to collect the links
  };

  marked(readmeContent, { renderer });

  // Filter out GitHub and npm links, and keep only valid HTTPS links
  const nonGitHubLinks = links.filter((link) => 
    link.startsWith('https://') && 
    !link.includes('github.com') && 
    !link.includes('npmjs.com')
  );

  return {
    wordCount,
    nonGitHubLinksCount: nonGitHubLinks.length,
  };
}


// Function to calculate the "Ramp Up" metric
export async function calculateRampUpMetric(localPath: string): Promise<number> {
  logger.info(`Calculating Ramp Up metric for repo at ${localPath}`);
  let totalSloc = 0;
  let totalComments = 0;

  // Walk through JavaScript and TypeScript files
  await walkDirectoryLimited(localPath, (filePath) => {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const { sloc, comments } = countSlocAndCommentsLimited(fileContent);
    totalSloc += sloc;
    totalComments += comments;
  });

  const ratioOfSloc = totalSloc > 0 ? totalComments / totalSloc : 0;

  // Process README file if it exists
  const readmePath = path.join(localPath, 'README.md');
  let rampUpScore = 0;

  if (fs.existsSync(readmePath)) {
    const readmeContent = fs.readFileSync(readmePath, 'utf8');
    const { wordCount, nonGitHubLinksCount } = processReadme(readmeContent);

    // Apply the formula for RampUpScore    
    const nonGitHubLinksCountScore = (nonGitHubLinksCount / 3) * 0.1;
    const readMeWordCountScore = ((wordCount / 80) * 0.1);
    const SLOCRatioScore = (ratioOfSloc * 2);
    rampUpScore = SLOCRatioScore + readMeWordCountScore + nonGitHubLinksCountScore;
    rampUpScore = Math.min(rampUpScore, 1.0);
    logger.info(`Calculated Ramp Up score for ${localPath}: ${rampUpScore}`);
  } else {
    // No README file, RampUpScore is 0
    logger.info('No README file found, Ramp Up score is 0');
    rampUpScore = 0;
  }

  return rampUpScore;
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
    let repoPath = url.replace('https://github.com/', '');

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

export async function calculateCorrectnessMetric(projectPath: string): Promise<number> {
  let totalLinesOfTestCode = 0;
  let totalFiles = 0; // Count of all files
  let estimatedTotalLines = 0; //this will be an estimated value of the total files.it is estimated for sake of runtime
  let hasTestSuite = 0; // created as number instead of boolean for sake of ease of addition to calculations
  // Detect test frameworks to guide which files should be checked
  const detectedFrameworks = await detectTestFrameworks(projectPath);

  if (detectedFrameworks.length > 0) {
    hasTestSuite = 0.5; //half the battle is if the test suite is even there because we may not walk all the lines
    logger.info("Frameworks Detected: " + detectedFrameworks);
  }
  

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
      const patterns = detectedFrameworks.length > 0
          ? detectedFrameworks.reduce((acc, framework) => {
              if (frameworkSpecificPatterns[framework]) {
                  acc.push(...frameworkSpecificPatterns[framework]);
              }
              return acc;
          }, [] as string[])
          : defaultTestFilePatterns;

      return patterns.some(pattern => fileName.endsWith(pattern) || filePath.includes(pattern));
  }

  // Helper function to count lines in a file asynchronously
  async function countLinesInFile(filePath: string): Promise<number> {
      try {
          const fileContent = await fsp.readFile(filePath, 'utf-8');
          return fileContent.split('\n').length;
      } catch (error: any) {
          logger.debug(`Error reading file ${filePath}: ${error.message}`);
          return 0; // Return 0 in case of error reading file
      }
  }

  // Asynchronously walk through directories, limited to depth of 1 for all files and test files
  async function walkDirectory(currentPath: string, depth: number = 0): Promise<void> {
      try {
          const files = await fsp.readdir(currentPath);

          const promises = files.map(async (file) => {
              const fullPath = path.join(currentPath, file);
              let stats;
              try {
                  stats = await fsp.stat(fullPath);
              } catch (error: any) {
                  logger.debug(`Error reading stats for file ${fullPath}: ${error.message}`);
                  return; // Skip this file and continue
              }

              if (stats.isDirectory()) {
                  // Only walk through directories to a depth of 1
                  if (depth < 1) {
                      await walkDirectory(fullPath, depth + 1);
                  }
              } else if (stats.isFile()) {
                  totalFiles++; // Count every file
                  const lineCount = await countLinesInFile(fullPath);

                  if (isTestFile(file, fullPath)) {
                      totalLinesOfTestCode += lineCount; // Count lines of test code
                  }
              }
          });

          await Promise.all(promises);
      } catch (error: any) {
          logger.debug(`Error walking directory ${currentPath}: ${error.message}`);
      }
  }

  // Start by walking the project directory
  await walkDirectory(projectPath);

  //logger.info("Calculate Correctness Ran");
  if(totalLinesOfTestCode > 0 && totalFiles > 0) {
    hasTestSuite = 0.5; //force value in case test files were discovered outside of detect test frameworks.
    //This shows evidence of testing therefore score is >0.5 per rubric
    estimatedTotalLines = totalFiles*100; //assume 100 sloc per file for decent range within correctness value for most packages
    let lineRatio = 0.5*(totalLinesOfTestCode / estimatedTotalLines);
    lineRatio = lineRatio > 0.5 ? 0.5 : lineRatio; // make line ratio have a max of 0.5
    return hasTestSuite + lineRatio;
  } else {
    return hasTestSuite;
  }
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