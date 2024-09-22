/*
File Name: 
  run.ts

Function: 
  - The function of this file is to take in the input from the command line (being ./run install, ./run URL, and ./run test).
  - For the install function it should install the the necessary dependanies needed in order for the code to run.
  - The URL function will take a path to a file that has URLs of GitHub and npm repositories. It will then perform calculations
  and make calls on these repostiories in order to print out a netscore. These calculations are dont in metrics.ts
  - The test function should run a series of tests on the code by inputing sample URLs to check the total coverage that this 
  project has. This code is in test.ts.
*/


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

  //Checking for INVALIDTOKEN before continuing with 
  try {
    const token = process.env.GITHUB_TOKEN;
    if (!token || token === 'INVALIDTOKEN') {
      console.error("Error: Invalid GitHub token provided.");
      process.exit(1); // Exit with rc 1 for invalid token
    }
    // continue normally
  } catch (error) {
    console.error("Error while processing GitHub URL:", error);
    process.exit(1); // Exit on any errors
  }


  // Clone the GitHub repository locally
  const repoName = url.replace('https://github.com/', '').replace('/', '_');
  const localPath = path.join(__dirname, '..', 'repos', repoName);

  // Ensure the repos directory exists
  if (!fs.existsSync(localPath)) {
    fs.mkdirSync(path.join(__dirname, '..', 'repos'), { recursive: true });
  }
  
  logger.info("Cloning GitHub repo for metrics calculation: " + repoName);
  try {
    await cloneRepo(url, localPath);
  } catch (error) {
    logger.debug("Failed to clone GitHub repository: " + repoName);
  }

  // Start measuring latencies
  const startTimes = {
    busFactor: performance.performance.now(),
    rampUp: performance.performance.now(),
    correctness: performance.performance.now(),
    responsiveMaintainer: performance.performance.now(),
    license: performance.performance.now(),
  };

  // Run all metrics in parallel
  const [
    contributorsCount,
    rampUpScore,
    test_ratio,
    responsiveMaintainerScore,
    licenseResult
  ] = await Promise.all([
    getBusFactor(url).then(count => {
      results.BusFactor = count >= 0 ? count.toFixed(2) : '-1';
      results.BusFactor_Latency = ((performance.performance.now() - startTimes.busFactor) / 1000).toFixed(3);
      return results.BusFactor;
    }),
    calculateRampUpMetric(localPath).then(score => {
      results.RampUp = score.toFixed(2);
      results.RampUp_Latency = ((performance.performance.now() - startTimes.rampUp) / 1000).toFixed(3);
      return results.RampUp;
    }),
    calculateCorrectnessMetric(localPath).then(test_ratio => {
      results.Correctness = test_ratio.toFixed(2);
      results.Correctness_Latency = ((performance.performance.now() - startTimes.correctness) / 1000).toFixed(3);
      return results.Correctness;
    }),
    calculateResponsiveMaintainerMetric(url).then(score => {
      results.ResponsiveMaintainer = score.toFixed(2);
      results.ResponsiveMaintainer_Latency = ((performance.performance.now() - startTimes.responsiveMaintainer) / 1000).toFixed(3);
      return results.ResponsiveMaintainer;
    }),
    checkLicenseCompatibility(url).then(licenseResult => {
      results.License = licenseResult.score.toFixed(2);
      results.License_Latency = ((performance.performance.now() - startTimes.license) / 1000).toFixed(3);
      return results.License;
    })
  ]);
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
    try {
      logger.info('Running "install" command');
      const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf-8'));
      const dependencies = packageJson.dependencies ? Object.keys(packageJson.dependencies) : [];
      console.log(`${dependencies.length} dependencies installed...`);
      process.exit(0); // Exit with 0 on success
    } catch (error) {
      console.error("Installation error:", error);
      process.exit(1); // Exit with 1 on failure
    }
  } else if (command && command.endsWith('.txt')) {
    logger.info('Running URL processing from file: ' + command);  // Log file processing info
    if (!fs.existsSync(command)) {
      logger.debug("Invalid file path provided: " + command);  // Log invalid path
      console.error("Error: File does not exist.");
      process.exit(1); // Exit with 1 on failure
    }
    const fileContent = fs.readFileSync(command, 'utf-8');
    const urls = fileContent.split('\n').filter(url => url.trim() !== '');
    
    try {
      await processAllUrls(urls);
      process.exit(0); // Exit with 0 on successful URL processing
    } catch (error) {
      console.error("Error processing URLs:", error);
      process.exit(1); // Exit with 1 if any errors occur during URL processing
    }
  } else if (command === 'test') { // "./run test" command is right here
    console.log('Test running...');
    // Call the exported Mocha test function from test.ts
    try {
        await runMochaTests();  // Run Mocha tests programmatically
        console.log('Test completed.');
        process.exit(0); // Exit with 0 on successful test completion
    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1); // Exit with 1 if tests fail
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
