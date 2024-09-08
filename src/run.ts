// importing some functions from metrics.ts
import { getGithubContributors, getNpmContributors, cloneRepo, calculateRampUpMetric } from './metrics';
import * as performance from 'perf_hooks';
import * as path from 'path';
import * as fs from 'fs';

// Function to process a single URL and calls functions to calculate metrics
async function processUrl(url: string) {
  if (url.startsWith('https://github.com/')) {
    // Get the contributor count from GitHub API
    const contributorsCount = await getGithubContributors(url);
    if (contributorsCount >= 0) {
      console.log(`GitHub repo: ${url}, Contributors: ${contributorsCount}`);
    } else {
      console.log(`GitHub repo: ${url}, Unable to fetch contributors.`);
    }

    // Clone the GitHub repository locally
    const repoName = url.replace('https://github.com/', '').replace('/', '_'); // Format repository name for local storage
    const localPath = path.join(__dirname, '..', 'repos', repoName); // Define the local path for the cloned repo

    // Ensure the repos directory exists
    if (!fs.existsSync(localPath)) {
      fs.mkdirSync(path.join(__dirname, '..', 'repos'), { recursive: true }); // Create the repos directory if it doesn't exist
    }

    // Clone the repository and calculate the Ramp Up metric
    await cloneRepo(url, localPath);
    const { sloc, comments, ratio } = await calculateRampUpMetric(localPath);
    console.log(`Repository ${url} Ramp Up Metric: ${ratio.toFixed(2)} (Comments/SLOC)`);

  } else if (url.startsWith('https://www.npmjs.com/package/')) {
    // Handle npm package URLs
    const packageName = url.replace('https://www.npmjs.com/package/', ''); // Extract the package name from the URL
    const contributorsCount = await getNpmContributors(packageName); // Get the number of contributors
    if (contributorsCount >= 0) {
      console.log(`npm package: ${url}, Contributors: ${contributorsCount}`);
    } else {
      console.log(`npm package: ${url}, Unable to fetch contributors.`);
    }
  } else {
    console.error(`Unsupported URL format: ${url}`); // Handle unsupported URLs
  }
}

// main function to handle CLI commands
async function main() {
  const command = process.argv[2]; // Get the first command-line argument

  if (command === 'install') {
    console.log('Installing dependencies...');
    // Import child_prccess from Node.js
    // execSync runs shell comand and waits before continuing
    // npm install automatically looks for package.json
    const { execSync } = require('child_process');
    execSync('npm install', { stdio: 'inherit' });
  } else if (command && command.startsWith('http')) {
    // If a URL is provided, process it
    const startTime = performance.performance.now();
    await processUrl(command);
    const endTime = performance.performance.now();
    console.log(`Total System Latency: ${(endTime - startTime).toFixed(0)} ms`);
  } else {
    console.error('Usage: ./run install | ./run <URL>');
    process.exit(1);
  }
}

main();
