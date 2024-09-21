import dotenv from 'dotenv';
dotenv.config();

//console.log('GITHUB_TOKEN:', process.env.GITHUB_TOKEN);
import { getBusFactor, cloneRepo, calculateRampUpMetric, checkLicenseCompatibility, calculateCorrectnessMetric, calculateResponsiveMaintainerMetric } from './metrics';
import logger, { flushLogs } from './logger';
import { test, runMochaTests } from './test'; 
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

  logger.info("Processing URL: " + url);
  if (url.startsWith('https://github.com/')) {
    await processGithubUrl(url, results);
  } else if (url.startsWith('https://www.npmjs.com/package/')) {
    await processNpmUrl(url, results);
  } else {
    logger.debug("Invalid URL path provided: " + url);
    return null;
  }

  results.NetScore_Latency = ((performance.performance.now() - netScoreStartTime) / 1000).toFixed(3);

  // Calculate NetScore (Use -1 where metrics are not yet implemented)
  logger.info("Calculating NetScore for URL: " + url);
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
  logger.info("Finished processing URL: " + url + " with NetScore: " + results.NetScore);
  // Return results
  return results;
}

async function processGithubUrl(url: string, results: any) {
  // Calculate Bus factor
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
  logger.info("Cloning GitHub repo for Ramp Up calculation: " + repoName);  // Log repo cloning info

  try {
    await cloneRepo(url, localPath);
  } catch (error) {
    logger.debug("Failed to clone GitHub repository: " + repoName);
  }

  // Calculate Ramp Up metric
  const rampUpStartTime = performance.performance.now();
  const rampUpScore = await calculateRampUpMetric(localPath);
  results.RampUp = rampUpScore.toFixed(2);
  results.RampUp_Latency = (((performance.performance.now() - rampUpStartTime) / 1000).toFixed(3));

  //calculate corectness metric
  const CorrectnessStartTime = performance.performance.now();
  const test_ratio = await calculateCorrectnessMetric(localPath);
  results.Correctness = test_ratio.toFixed(2);
  results.Correctness_Latency = (((performance.performance.now() - CorrectnessStartTime) / 1000).toFixed(3));
  
  // Calculate Responsive Maintainer metric
  const responsiveMaintainerStartTime = performance.performance.now();
  const responsiveMaintainerScore = await calculateResponsiveMaintainerMetric(url);
  results.ResponsiveMaintainer = responsiveMaintainerScore.toFixed(2);
  results.ResponsiveMaintainer_Latency = ((performance.performance.now() - responsiveMaintainerStartTime) / 1000).toFixed(3);  

  // Check license compatibility
  const licenseStartTime = performance.performance.now();
  const licenseResult = await checkLicenseCompatibility(url);
  results.License = licenseResult.score.toFixed(2);
  results.License_Latency = ((performance.performance.now() - licenseStartTime) / 1000).toFixed(3);

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

      logger.info("Found GitHub URL for npm package: " + packageName);

      // Now call function with guthub corrected URL
      await processGithubUrl(githubUrl, results);

    } else {
      // Handle missing repository field
      logger.debug(`No repository field found for npm package ${packageName}`);
    }
  } catch (error) {
    logger.debug(`Error processing npm package ${packageName}: ${error}`);
  }
}


async function processAllUrls(urls: string[]) {
  const resultsArray: any[] = [];
  logger.debug("test");

  for (const url of urls) {
    const result = await processUrl(url.trim());
    if (result) {
      resultsArray.push(result);
    } 
  }

  // Sort results by NetScore from highest to lowest
  resultsArray.sort((a, b) => parseFloat(b.NetScore) - parseFloat(a.NetScore));

  logger.info("Finished processing all URLs. Displaying sorted results.");

  // Output sorted results
  resultsArray.forEach(result => console.log(JSON.stringify(result)));
}

async function main() {
  require('dotenv').config(); // Necessary for GITHUB_TOKEN
  const command = process.argv[2];

  if (command === 'install') {
    logger.info('Running "install" command');
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf-8'));
    const dependencies = packageJson.dependencies ? Object.keys(packageJson.dependencies) : [];
    console.log(`${dependencies.length} dependencies installed...`);
    process.exit(0);
  } else if (command && command.endsWith('.txt')) {
    logger.info('Running URL processing from file: ' + command);  // Log file processing info
    if (!fs.existsSync(command)) {
      logger.debug("Invalid file path provided: " + command);  // Log invalid path
      process.exit(1);
    }
    const fileContent = fs.readFileSync(command, 'utf-8');
    const urls = fileContent.split('\n').filter(url => url.trim() !== '');
    await processAllUrls(urls);
  } else if (command === 'test') { // "./run test" command is right here
    console.log('Test running...');
    // Call the exported Mocha test function from test.ts
    try {
        await runMochaTests();  // Run Mocha tests programmatically
        console.log('Test completed.');
    } catch (error) {
        console.error('Test failed:', error);
    }
    await flushLogs(); //makes sure logger finished writing
  } else {
    logger.info("Invalid command line input");
    logger.debug("Invalid command line input");
    process.exit(1);
  }
}

main().catch(error => {
  logger.debug('An error occurred:', error);
  process.exit(1);
});
