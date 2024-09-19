import dotenv from 'dotenv';
dotenv.config();

import { getBusFactor, cloneRepo, calculateRampUpMetric, checkLicenseCompatibility } from './metrics';
import * as performance from 'perf_hooks';
import * as path from 'path';
import * as fs from 'fs';
import axios from 'axios';

async function processUrl(url: string): Promise<any> {
  const netScoreStartTime = performance.performance.now();
  let results: any = { 
    URL: url,
    NetScore: '-1',
    NetScore_Latency: '-1',
    RampUp: '-1',
    RampUp_Latency: '-1',
    Correctness: '-1',
    Correctness_Latency: '-1',
    BusFactor: '-1',
    BusFactor_Latency: '-1',
    ResponsiveMaintainer: '-1',
    ResponsiveMaintainer_Latency: '-1',
    License: '-1',
    License_Latency: '-1'
  };

  if (url.startsWith('https://github.com/')) {
    await processGithubUrl(url, results);
  } else if (url.startsWith('https://www.npmjs.com/package/')) {
    await processNpmUrl(url, results);
  } else {
    return null; // Return null if URL isn't valid
  }

  results.NetScore_Latency = ((performance.performance.now() - netScoreStartTime) / 1000).toFixed(3);

  // Calculate NetScore (Use -1 where metrics are not yet implemented)
  if (
    parseFloat(results.License) === 0 || 
    results.License === '-1' ||   
    results.BusFactor === '-1' || 
    results.RampUp === '-1' || 
    results.Correctness === '-1' || 
    results.ResponsiveMaintainer === '-1'
  ) {
    results.NetScore = '0.00';
  } else {
    const netScore = (
      parseFloat(results.BusFactor) * 0.2 +
      parseFloat(results.RampUp) * 0.1 +
      parseFloat(results.Correctness) * 0.1 +
      parseFloat(results.ResponsiveMaintainer) * 0.1 +
      parseFloat(results.License) * 0.5
    );
    results.NetScore = netScore.toFixed(2);
  }

  // Return results
  return results;
}

async function processGithubUrl(url: string, results: any) {
  // Get the contributor count from GitHub API
  const busFactorStartTime = performance.performance.now();
  const contributorsCount = await getBusFactor(url);
  results.BusFactor = contributorsCount >= 0 ? (contributorsCount).toFixed(2) : '-1';
  results.BusFactor_Latency = ((performance.performance.now() - busFactorStartTime) / 1000).toFixed(3);

  // Clone the GitHub repository locally
  const repoName = url.replace('https://github.com/', '').replace('/', '_');
  const localPath = path.join(__dirname, '..', 'repos', repoName);

  // Ensure the repos directory exists
  if (!fs.existsSync(localPath)) {
    fs.mkdirSync(path.join(__dirname, '..', 'repos'), { recursive: true });
  }

  // Clone the repository and calculate the Ramp Up metric
  await cloneRepo(url, localPath);
  const rampUpStartTime = performance.performance.now();
  const { ratio, sloc, comments } = await calculateRampUpMetric(localPath);
  results.RampUp = ratio.toFixed(2);
  results.RampUp_Latency = ((performance.performance.now() - rampUpStartTime) / 1000).toFixed(3);

  // Check license compatibility
  const licenseStartTime = performance.performance.now();
  const licenseResult = await checkLicenseCompatibility(url);
  results.License = licenseResult.score.toFixed(2);
  results.License_Latency = ((performance.performance.now() - licenseStartTime) / 1000).toFixed(3);

  // Placeholder values for metrics not yet implemented
  results.Correctness = '-1';
  results.Correctness_Latency = '-1';
  results.ResponsiveMaintainer = '-1';
  results.ResponsiveMaintainer_Latency = '-1';
}

async function processNpmUrl(url: string, results: any) {
  const packageName = url.replace('https://www.npmjs.com/package/', '');

  try {
    // Fetch package data from the npm registry
    const npmResponse = await axios.get(`https://registry.npmjs.org/${packageName}`);
    const repository = npmResponse.data.repository;

    // Get other metric information
    if (repository && repository.url) {
      let githubUrl = repository.url;

      // Clean up the URL if it starts with 'git+', '.git', or 'ssh://git@github.com'
      githubUrl = githubUrl.replace('git+', '').replace('.git', '').replace('git://', '');
      githubUrl = githubUrl.replace('ssh://git@github.com', 'https://github.com');

      // Ensure the URL is a valid HTTPS URL
      if (!githubUrl.startsWith('https://')) {
        githubUrl = `https://${githubUrl}`;
      }

      // Now call processGithubUrl with the corrected URL
      await processGithubUrl(githubUrl, results);

    } else {
      // Handle missing repository field
      console.error(`No repository field found for npm package ${packageName}`);
      results.RampUp = '-1';
      results.RampUp_Latency = '-1';
      results.License = '-1';
      results.License_Latency = '-1';
    }
  } catch (error) {
    console.error(`Error processing npm package ${packageName}:`, error);
    results.RampUp = '-1';
    results.RampUp_Latency = '-1';
    results.License = '-1';
    results.License_Latency = '-1';
  }

  // Placeholder values for metrics not yet implemented
  results.Correctness = '-1';
  results.Correctness_Latency = '-1';
  results.ResponsiveMaintainer = '-1';
  results.ResponsiveMaintainer_Latency = '-1';
}


async function processAllUrls(urls: string[]) {
  const resultsArray: any[] = [];

  for (const url of urls) {
    const result = await processUrl(url.trim());
    if (result) {
      resultsArray.push(result);
    }
  }

  // Sort results by NetScore from highest to lowest
  resultsArray.sort((a, b) => parseFloat(b.NetScore) - parseFloat(a.NetScore));

  // Output sorted results
  resultsArray.forEach(result => console.log(JSON.stringify(result)));
}

async function main() {
  require('dotenv').config(); // Necessary for GITHUB_TOKEN
  const command = process.argv[2];

  if (command === 'install') {
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf-8'));
    const dependencies = packageJson.dependencies ? Object.keys(packageJson.dependencies) : [];
    console.log(`${dependencies.length} dependencies installed...`);
    process.exit(0);
  } else if (command && command.endsWith('.txt')) {
    const fileContent = fs.readFileSync(command, 'utf-8');
    const urls = fileContent.split('\n').filter(url => url.trim() !== '');
    await processAllUrls(urls);
  } else {
    console.error('Usage: ./run install | ./run <FILE_PATH>');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('An error occurred:', error);
  process.exit(1);
});
