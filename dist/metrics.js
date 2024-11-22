"use strict";
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

  = Correctness: This Metric measures how correct a certain codebase is in terms of how tested it is. This looks primarily at the ratio
  of source lines of code to test lines of code. A study linked within our phase 1 doc (Github), shows that slotc / sloc correlates well
  enough with actual test coverage showing slotc / sloc shows how accurate a test suite may be. First Test suites are tested for and if
  found, part of the score is rewarded. The ratio of slotc/sloc is then also factored in later. This is done by walking the cloned repo for
  test lines of code as well as just file directories. Assumptions are made for total sloc and the ratio is added to the total correctness score.

  Responsive Maintainer:

  License:
*/
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBusFactor = getBusFactor;
exports.cloneRepo = cloneRepo;
exports.calculateRampUpMetric = calculateRampUpMetric;
exports.checkLicenseCompatibility = checkLicenseCompatibility;
exports.calculateCorrectnessMetric = calculateCorrectnessMetric;
exports.calculateResponsiveMaintainerMetric = calculateResponsiveMaintainerMetric;
exports.calculatePinnedDependenciesMetric = calculatePinnedDependenciesMetric;
exports.calculateCodeFromPRsMetric = calculateCodeFromPRsMetric;
const simple_git_1 = __importDefault(require("simple-git"));
const fs = __importStar(require("fs"));
const fsp = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const axios_1 = __importDefault(require("axios"));
const core_1 = require("@octokit/core");
const logger_1 = __importDefault(require("./logger"));
const marked_1 = require("marked");
const node_fetch_1 = __importDefault(require("node-fetch"));
const GITHUB_API_URL = 'https://api.github.com/repos'; // GitHub API endpoint for repository data
const NPM_REGISTRY_URL = 'https://registry.npmjs.org/'; // NPM registry endpoint for package data
const PER_PAGE = 100; // GitHub API truncates certain number of contributors
const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // GitHub personal access token for authentication
const octokit = new core_1.Octokit({
    auth: GITHUB_TOKEN,
    request: {
        fetch: node_fetch_1.default
    }
}); // Create an authenticated Octokit instance
async function getBusFactor(url) {
    const repoPath = url.replace('https://github.com/', ''); // Extract the repository path from the provided GitHub URL
    let totalContributors = 0;
    let page = 1; // Start with the first page of results as github API truncates to 100 users per page
    logger_1.default.info(`Calculating Bus Factor for repository: ${url}`);
    try {
        // Loop through all available contributor pages from the GitHub API
        while (true) {
            // Send a GET request to the GitHub API to fetch contributors for the current page
            const response = await axios_1.default.get(`${GITHUB_API_URL}/${repoPath}/contributors`, {
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
        logger_1.default.info(`Total contributors for ${url}: ${totalContributors}`);
        // Calculate the Bus Factor based on the total number of contributors
        let busFactorScore;
        if (totalContributors === 1) {
            busFactorScore = 0.1;
        }
        else if (totalContributors === 2) {
            busFactorScore = 0.2;
        }
        else if (totalContributors <= 4) {
            busFactorScore = 0.3;
        }
        else if (totalContributors <= 8) {
            busFactorScore = 0.4;
        }
        else if (totalContributors <= 16) {
            busFactorScore = 0.5;
        }
        else if (totalContributors <= 32) {
            busFactorScore = 0.6;
        }
        else if (totalContributors <= 64) {
            busFactorScore = 0.7;
        }
        else if (totalContributors <= 128) {
            busFactorScore = 0.8;
        }
        else if (totalContributors <= 256) {
            busFactorScore = 0.9;
        }
        else {
            busFactorScore = 1.0;
        }
        logger_1.default.info(`Calculated Bus Factor for ${url}: ${busFactorScore}`);
        return busFactorScore; // Return the calculated Bus Factor score
    }
    catch (error) {
        // Handle any errors that occur during the API request
        logger_1.default.debug(`Error fetching contributors for GitHub repo ${url}: ${error.message}`);
        return -1; // Return -1 to indicate failure
    }
}
// Function to clone a GitHub repository locally using simple-git
async function cloneRepo(url, localPath) {
    const git = (0, simple_git_1.default)();
    try {
        await git.clone(url, localPath, ['--depth', '1']);
        logger_1.default.info(`Cloning completed successfully for ${url}`);
    }
    catch (error) {
        logger_1.default.debug(`Error cloning repo ${url}: ${error.message}`);
    }
}
// Function to count Source Lines of Code (SLOC) and comments in a file (first 500 lines)
function countSlocAndCommentsLimited(fileContent) {
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
        }
        else if (trimmedLine.startsWith('//')) {
            comments++; // Single-line comment
        }
        else if (trimmedLine.startsWith('/*')) {
            comments++;
            inBlockComment = !trimmedLine.endsWith('*/');
        }
        else if (trimmedLine.length > 0) {
            sloc++; // Count lines of code
        }
    }
    return { sloc, comments };
}
// Function to walk through a directory and process only .js or .ts files
async function walkDirectoryLimited(dir, fileCallback) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            await walkDirectoryLimited(fullPath, fileCallback);
        }
        else if (file.endsWith('.ts') || file.endsWith('.js')) {
            fileCallback(fullPath);
        }
    }
}
// Function to read the README file and extract words and non-GitHub/npm links
function processReadme(readmeContent) {
    const wordCount = readmeContent.split(/\s+/).length;
    // Create a list to store the URLs found in the README
    const links = [];
    // Use a Markdown parser to find embedded links
    const renderer = new marked_1.marked.Renderer();
    renderer.link = ({ href, title, tokens }) => {
        links.push(href); // Collect the href
        return ''; // Return an empty string since we just need to collect the links
    };
    (0, marked_1.marked)(readmeContent, { renderer });
    // Filter out GitHub and npm links, and keep only valid HTTPS links
    const nonGitHubLinks = links.filter((link) => link.startsWith('https://') &&
        !link.includes('github.com') &&
        !link.includes('npmjs.com'));
    return {
        wordCount,
        nonGitHubLinksCount: nonGitHubLinks.length,
    };
}
// Function to calculate the "Ramp Up" metric
async function calculateRampUpMetric(localPath) {
    logger_1.default.info(`Calculating Ramp Up metric for repo at ${localPath}`);
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
        logger_1.default.info(`Calculated Ramp Up score for ${localPath}: ${rampUpScore}`);
    }
    else {
        // No README file, RampUpScore is 0
        logger_1.default.info('No README file found, Ramp Up score is 0');
        rampUpScore = 0;
    }
    return rampUpScore;
}
async function checkLicenseCompatibility(url) {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
        logger_1.default.debug('GitHub token not set');
        return { score: 0, details: 'GitHub token not set' };
    }
    const headers = {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `token ${token}`,
        'User-Agent': 'Your-App-Name'
    };
    try {
        let repoPath = url.replace('https://github.com/', '');
        let licenseInfo = '';
        // Check LICENSE file
        try {
            const licenseResponse = await axios_1.default.get(`${GITHUB_API_URL}/${repoPath}/contents/LICENSE`, { headers });
            licenseInfo = Buffer.from(licenseResponse.data.content, 'base64').toString('utf-8');
        }
        catch (error) {
            if (error.response && error.response.status === 404) {
                logger_1.default.info(`LICENSE file not found for repository ${repoPath}, checking package.json...`);
                // Check package.json
                try {
                    const packageJsonResponse = await axios_1.default.get(`${GITHUB_API_URL}/${repoPath}/contents/package.json`, { headers });
                    const packageJsonContent = JSON.parse(Buffer.from(packageJsonResponse.data.content, 'base64').toString('utf-8'));
                    licenseInfo = packageJsonContent.license || '';
                }
                catch (packageError) {
                    if (packageError.response && packageError.response.status === 404) {
                        logger_1.default.info('package.json not found or does not contain license information');
                    }
                    else {
                        throw packageError;
                    }
                }
            }
            else {
                throw error;
            }
        }
        // If still no license info, check README
        if (!licenseInfo) {
            try {
                const readmeResponse = await axios_1.default.get(`${GITHUB_API_URL}/${repoPath}/readme`, { headers });
                const readmeContent = Buffer.from(readmeResponse.data.content, 'base64').toString('utf-8');
                licenseInfo = extractLicenseFromReadme(readmeContent) || '';
            }
            catch (readmeError) {
                if (readmeError.response && readmeError.response.status === 404) {
                    logger_1.default.info('README not found');
                }
                else {
                    throw readmeError;
                }
            }
        }
        if (licenseInfo) {
            const compatible = isCompatibleWithLGPLv2_1(licenseInfo);
            logger_1.default.info(`License found for ${url}: ${licenseInfo.split('\n')[0]}. Compatible: ${compatible}`);
            return {
                score: compatible ? 1 : 0,
                details: `License found: ${licenseInfo.split('\n')[0]}. Compatible: ${compatible}`
            };
        }
        logger_1.default.info(`No license information found for ${url}`);
        return { score: 0, details: 'No license information found' };
    }
    catch (error) {
        logger_1.default.debug(`Error checking license for ${url}: ${error.message}`);
        return { score: 0, details: `Error checking license: ${error.message}` };
    }
}
function extractLicenseFromReadme(content) {
    const licenseRegex = /#+\s*License\s*([\s\S]*?)(?=#+|$)/i;
    const match = content.match(licenseRegex);
    return match ? match[1].trim() : null;
}
function isCompatibleWithLGPLv2_1(licenseText) {
    const compatibleLicenses = [
        'LGPL-2.1', 'LGPL-3.0',
        'GPL-2.0', 'GPL-3.0',
        'MIT', 'BSD-2-Clause', 'BSD-3-Clause',
        'Apache-2.0', 'ISC', 'Unlicense'
    ];
    if (licenseText.toUpperCase() === 'UNLICENSED') {
        return false;
    }
    return compatibleLicenses.some(license => licenseText.toLowerCase().includes(license.toLowerCase()) ||
        licenseText.toLowerCase().includes(license.toLowerCase().replace('-', ' ')));
}
async function detectTestFrameworks(projectPath) {
    const frameworks = [];
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
    }
    catch (error) {
        console.error(`Error reading package.json for test frameworks: ${error.message}`);
    }
    return frameworks;
}
async function calculateCorrectnessMetric(projectPath) {
    let totalLinesOfTestCode = 0;
    let totalFiles = 0; // Count of all files
    let estimatedTotalLines = 0; //this will be an estimated value of the total files.it is estimated for sake of runtime
    let hasTestSuite = 0; // created as number instead of boolean for sake of ease of addition to calculations
    // Detect test frameworks to guide which files should be checked
    const detectedFrameworks = await detectTestFrameworks(projectPath);
    if (detectedFrameworks.length > 0) {
        hasTestSuite = 0.5; //half the battle is if the test suite is even there because we may not walk all the lines
        logger_1.default.info("Frameworks Detected: " + detectedFrameworks);
    }
    // Define framework-specific test file patterns
    const frameworkSpecificPatterns = {
        jest: ['.test.js', '.test.ts', '.spec.js', '.spec.ts', '__tests__/'],
        mocha: ['.test.js', '.spec.js', 'test/'],
        jasmine: ['.spec.js', 'spec/'],
        cypress: ['.cy.js', '.cy.ts', 'cypress/integration/'],
        ava: ['.test.js', 'test/']
    };
    // Default test file patterns to check if no frameworks are detected
    const defaultTestFilePatterns = ['.test.js', '.spec.js', 'test/', '__tests__/'];
    // Helper function to check if a file matches test file patterns for the detected frameworks
    function isTestFile(fileName, filePath) {
        const patterns = detectedFrameworks.length > 0
            ? detectedFrameworks.reduce((acc, framework) => {
                if (frameworkSpecificPatterns[framework]) {
                    acc.push(...frameworkSpecificPatterns[framework]);
                }
                return acc;
            }, [])
            : defaultTestFilePatterns;
        return patterns.some(pattern => fileName.endsWith(pattern) || filePath.includes(pattern));
    }
    // Helper function to count lines in a file asynchronously
    async function countLinesInFile(filePath) {
        try {
            const fileContent = await fsp.readFile(filePath, 'utf-8');
            return fileContent.split('\n').length;
        }
        catch (error) {
            logger_1.default.debug(`Error reading file ${filePath}: ${error.message}`);
            return 0; // Return 0 in case of error reading file
        }
    }
    // Asynchronously walk through directories, limited to depth of 1 for all files and test files
    async function walkDirectory(currentPath, depth = 0) {
        try {
            const files = await fsp.readdir(currentPath);
            const promises = files.map(async (file) => {
                const fullPath = path.join(currentPath, file);
                let stats;
                try {
                    stats = await fsp.stat(fullPath);
                }
                catch (error) {
                    logger_1.default.debug(`Error reading stats for file ${fullPath}: ${error.message}`);
                    return; // Skip this file and continue
                }
                if (stats.isDirectory()) {
                    // Only walk through directories to a depth of 1
                    if (depth < 1) {
                        await walkDirectory(fullPath, depth + 1);
                    }
                }
                else if (stats.isFile()) {
                    totalFiles++; // Count every file
                    const lineCount = await countLinesInFile(fullPath);
                    if (isTestFile(file, fullPath)) {
                        totalLinesOfTestCode += lineCount; // Count lines of test code
                    }
                }
            });
            await Promise.all(promises);
        }
        catch (error) {
            logger_1.default.debug(`Error walking directory ${currentPath}: ${error.message}`);
        }
    }
    // Start by walking the project directory
    await walkDirectory(projectPath);
    //logger.info("Calculate Correctness Ran");
    if (totalLinesOfTestCode > 0 && totalFiles > 0) {
        hasTestSuite = 0.5; //force value in case test files were discovered outside of detect test frameworks.
        //This shows evidence of testing therefore score is >0.5 per rubric
        estimatedTotalLines = totalFiles * 100; //assume 100 sloc per file for decent range within correctness value for most packages
        let lineRatio = 0.5 * (totalLinesOfTestCode / estimatedTotalLines);
        lineRatio = lineRatio > 0.5 ? 0.5 : lineRatio; // make line ratio have a max of 0.5
        return hasTestSuite + lineRatio;
    }
    else {
        return hasTestSuite;
    }
}
async function calculateResponsiveMaintainerMetric(url) {
    try {
        const repoPath = url.replace('https://github.com/', '');
        const [owner, repo] = repoPath.split('/');
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        const dateFilter = oneMonthAgo.toISOString();
        logger_1.default.info(`Calculating Responsive Maintainer metric for ${url}`);
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
        const recentClosedPRs = closedPRs.filter(pr => new Date(pr.closed_at) >= oneMonthAgo);
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
        logger_1.default.info(`Responsive Maintainer score for ${url}: ${Math.min(responsiveScore, 1)}`);
        return Math.min(responsiveScore, 1); // Make sure the score is between 0 and 1
    }
    catch (error) {
        logger_1.default.debug(`Error calculating Responsive Maintainer metric for ${url}: ${error.message}`);
        return 0;
    }
}
async function calculatePinnedDependenciesMetric(url) {
    const repoPath = url.replace('https://github.com/', '');
    const [owner, repo] = repoPath.split('/');
    try {
        // Step 1: Fetch the package.json file from the repository
        const { data } = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
            owner,
            repo,
            path: 'package.json',
        });
        // Check if data is an array (directory listing) or an object (single file)
        let packageJsonContent;
        if (Array.isArray(data)) {
            throw new Error('Expected a file, but received a directory listing.');
        }
        else if ('content' in data) {
            // Decode the base64 content of the file
            packageJsonContent = Buffer.from(data.content, 'base64').toString('utf8');
        }
        else {
            throw new Error('Received unexpected data format.');
        }
        const packageJson = JSON.parse(packageJsonContent);
        const dependencies = packageJson.dependencies || {};
        const devDependencies = packageJson.devDependencies || {};
        const allDependencies = { ...dependencies, ...devDependencies };
        // If there are no dependencies, return 1.0
        if (Object.keys(allDependencies).length === 0) {
            return 1.0;
        }
        // Count the number of pinned dependencies to at least a major and minor version
        const pinnedCount = Object.values(allDependencies).filter(version => typeof version === 'string' && ( // Ensure version is a string
        /^(?:\^|~)?(\d+)\.(\d+)(\.\d+)?$/.test(version) || // Matches versions like 2.3.0, 2.3, ^2.3.0, ~2.3
            /^(?:\^|~)?(\d+)\.(\d+)$/.test(version) // Matches versions like 2.3, ^2.3
        )).length;
        // Return the fraction of pinned dependencies
        return pinnedCount / Object.keys(allDependencies).length;
    }
    catch (error) {
        console.error(`Error fetching package.json from ${owner}/${repo}: ${error.message}`);
        return 0; // Return early in case of error
    }
}
async function calculateCodeFromPRsMetric(url) {
    const repoPath = url.replace('https://github.com/', '');
    const [owner, repo] = repoPath.split('/');
    let totalLines = 0;
    let prLines = 0;
    try {
        const commitsResponse = await octokit.request('GET /repos/{owner}/{repo}/commits', {
            owner,
            repo,
            per_page: PER_PAGE
        });
        // Search for PRs based on the commit message
        const prsResponse = await octokit.request('GET /repos/{owner}/{repo}/pulls', {
            owner,
            repo,
            state: 'closed', // Consider closed PRs
        });
        for (const commit of commitsResponse.data) {
            // Step 2: Check if this commit has an associated PR
            const commitMessage = commit.commit.message;
            // Find PRs that contain this commit (some PRs have commit messages that include the SHA)
            const associatedPR = prsResponse.data.find(pr => pr.merge_commit_sha === commit.sha || commitMessage.includes(`#${pr.number}`) // Check if the commit message references the PR
            );
            if (associatedPR) {
                // Step 3: Get the diff for the PR to count the lines changed
                const diffResponse = await octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}/files', {
                    owner,
                    repo,
                    pull_number: associatedPR.number,
                });
                const linesChanged = diffResponse.data.reduce((sum, file) => sum + file.changes, 0);
                prLines += linesChanged; // Count lines introduced through PRs
            }
            // Always count total lines for reference
            const commitDiff = await octokit.request('GET /repos/{owner}/{repo}/commits/{ref}', {
                owner,
                repo,
                ref: commit.sha,
            });
            if (commitDiff.data.files) {
                const totalLinesChanged = commitDiff.data.files.reduce((sum, file) => sum + file.changes, 0);
                totalLines += totalLinesChanged;
            }
            else {
                totalLines += prLines;
            }
        }
        // Calculate the fraction of lines introduced via PRs
        return totalLines > 0 ? prLines / totalLines : 0;
    }
    catch (error) {
        console.error(`Error calculating metric for ${owner}/${repo}: ${error.message}`);
        return 0; // Return early in case of error
    }
}
