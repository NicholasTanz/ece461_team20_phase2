import dotenv from 'dotenv';
dotenv.config();

import { getGithubContributors, getNpmContributors, cloneRepo, calculateRampUpMetric, checkLicenseCompatibility } from './metrics';
import * as performance from 'perf_hooks';
import * as path from 'path';
import * as fs from 'fs';
import axios from 'axios';

console.log('GITHUB_TOKEN:', process.env.GITHUB_TOKEN ? 'Set' : 'Not set');

async function processUrl(url: string) {
  const startTime = performance.performance.now();
  let results: any = { URL: url };

  if (url.startsWith('https://github.com/')) {
    // Process GitHub URL
    await processGithubUrl(url, results);
  } else if (url.startsWith('https://www.npmjs.com/package/')) {
    // Process npm package URL
    await processNpmUrl(url, results);
  } else {
    console.error(`Unsupported URL format: ${url}`);
    return;
  }

  results.NetScore_Latency = (performance.performance.now() - startTime).toFixed(3);

  // Calculate NetScore
  const netScore = (
    (parseFloat(results.BusFactor) * 0.2) +
    (parseFloat(results.RampUp) * 0.1) +
    (parseFloat(results.Correctness) * 0.1) +
    (parseFloat(results.ResponsiveMaintainer) * 0.1) +
    (parseFloat(results.License) * 0.5)
  );
  results.NetScore = netScore.toFixed(2);

  // Print human-readable summary to stdout
  console.log('\nSummary:');
  console.log(`URL: ${results.URL}`);
  console.log(`Bus Factor: ${results.BusFactor}`);
  console.log(`Ramp Up: ${results.RampUp}`);
  console.log(`Correctness: ${results.Correctness}`);
  console.log(`Responsive Maintainer: ${results.ResponsiveMaintainer}`);
  console.log(`License: ${results.License}`);
  console.log(`Net Score: ${results.NetScore}`);
  console.log(`Total System Latency: ${results.NetScore_Latency} ms\n`);

  // Print results as NDJSON
  console.log(JSON.stringify(results));
}

async function processGithubUrl(url: string, results: any) {
  // Get the contributor count from GitHub API
  const contributorsCount = await getGithubContributors(url);
  results.BusFactor = contributorsCount >= 0 ? (contributorsCount / 1000).toFixed(2) : '0.00';
  results.BusFactor_Latency = performance.performance.now().toFixed(3);
  console.log(`GitHub repo: ${url}, Contributors: ${contributorsCount}`);

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
  results.RampUp_Latency = (performance.performance.now() - rampUpStartTime).toFixed(3);
  console.log(`Total SLOC: ${sloc}, Total Comments: ${comments}, Comment-to-SLOC Ratio: ${ratio.toFixed(2)}`);

  // Check license compatibility
  const licenseStartTime = performance.performance.now();
  const licenseResult = await checkLicenseCompatibility(url);
  results.License = licenseResult.score.toFixed(2);
  results.License_Latency = ((performance.performance.now() - licenseStartTime) / 1000).toFixed(3);
  console.log(`License Compatibility: ${results.License} (${licenseResult.details})`);

  // Placeholder values for metrics not yet implemented
  results.Correctness = '0';
  results.Correctness_Latency = '0';
  results.ResponsiveMaintainer = '0';
  results.ResponsiveMaintainer_Latency = '0';
}

async function processNpmUrl(url: string, results: any) {
  const packageName = url.replace('https://www.npmjs.com/package/', '');

  // Get contributors count
  const contributorsCount = await getNpmContributors(packageName);
  results.BusFactor = contributorsCount >= 0 ? (contributorsCount / 1000).toFixed(2) : '0.00';
  results.BusFactor_Latency = performance.performance.now().toFixed(3);
  console.log(`npm package: ${url}, Contributors: ${contributorsCount}`);

  // For npm packages, we need to find the corresponding GitHub repository
  try {
    const npmResponse = await axios.get(`https://registry.npmjs.org/${packageName}`);
    const repository = npmResponse.data.repository;
    if (repository && repository.url) {
      const githubUrl = repository.url.replace('git+', '').replace('.git', '');
      
      // Calculate Ramp Up metric
      const repoName = githubUrl.replace('https://github.com/', '').replace('/', '_');
      const localPath = path.join(__dirname, '..', 'repos', repoName);
      
      // Ensure the repos directory exists
      if (!fs.existsSync(localPath)) {
        fs.mkdirSync(path.join(__dirname, '..', 'repos'), { recursive: true });
      }
      
      await cloneRepo(githubUrl, localPath);
      const rampUpStartTime = performance.performance.now();
      const { ratio, sloc, comments } = await calculateRampUpMetric(localPath);
      results.RampUp = ratio.toFixed(2);
      results.RampUp_Latency = (performance.performance.now() - rampUpStartTime).toFixed(3);
      console.log(`Total SLOC: ${sloc}, Total Comments: ${comments}, Comment-to-SLOC Ratio: ${ratio.toFixed(2)}`);

      // Check license compatibility
      const licenseResult = await checkLicenseCompatibility(githubUrl);
      results.License = licenseResult.score.toFixed(2);
      results.License_Latency = performance.performance.now().toFixed(3);
      console.log(`License Compatibility: ${results.License} (${licenseResult.details})`);
    } else {
      results.RampUp = '0';
      results.RampUp_Latency = '0';
      results.License = '0';
      results.License_Latency = '0';
      console.log(`Unable to find GitHub repository for npm package: ${packageName}`);
    }
  } catch (error) {
    results.RampUp = '0';
    results.RampUp_Latency = '0';
    results.License = '0';
    results.License_Latency = '0';
    console.log(`Error processing npm package ${packageName}:`, error);
  }

  // Placeholder values for metrics not yet implemented
  results.Correctness = '0';
  results.Correctness_Latency = '0';
  results.ResponsiveMaintainer = '0';
  results.ResponsiveMaintainer_Latency = '0.';
}

// Main function to handle CLI commands
async function main() {
  const command = process.argv[2];

  if (command === 'install') {
    console.log('Installing dependencies...');
    const { execSync } = require('child_process');
    execSync('npm install', { stdio: 'inherit' });
    process.exit(0);
  } else if (command && (command.startsWith('http') || command.endsWith('.txt'))) {
    if (command.endsWith('.txt')) {
      // Handle file input
      const fileContent = fs.readFileSync(command, 'utf-8');
      const urls = fileContent.split('\n').filter(url => url.trim() !== '');
      for (const url of urls) {
        await processUrl(url.trim());
      }
    } else {
      // Handle single URL input
      await processUrl(command);
    }
  } else {
    console.error('Usage: ./run install | ./run <URL> | ./run <FILE_PATH>');
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  console.error('An error occurred:', error);
  process.exit(1);
});