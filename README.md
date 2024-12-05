Team Members: Nicholas Tanzillo, Akash Amalarasan, Charlie Kim, Alison Liang.

# Package Manager

A web-based package management system that allows users to **rate**, **upload**, **update**, and **remove** packages from the system. The application consists of both a **frontend** and a **backend**, developed using **TypeScript** and deployed using **AWS**.

## Tech Stack

- **Frontend**: Vue.js with TypeScript
- **Backend**: Node.js with Express
- **Deployed on**: AWS

## What metrics we use to calculate NetScore and our justification:
  Bus Factor: This metric measures essentially how many people are working on the code. Basically, how many people
  can be "hit by a bus" and there still be enough people to update the repository. We elected to measure this by the total
  number of contributors, we used a exponential scale and used our personal engineering judgement to assign a score to
  each number of contributors. 

  Ramp Up Time: This metrics measures essentially the amount of documentation surrounding the code. Basically, how
  quickly can you clone this reposity and understand how to implement it. We elected to calculate this metric by 4 sub-factors:
  the number of words in the readme, the ratio of comments to source lines of code, number of links in the readme that take you
  to a non GitHub/npm link, and if no readme was present assign the ramp up score a 0. We then assigned a multiplier to each factor
  by looking at a number of URLs and using our best engineering judgement to assign weights. 

  Correctness: This Metric measures how correct a certain codebase is in terms of how tested it is. This looks primarily at the ratio
  of source lines of code to test lines of code. A study linked within our phase 1 doc (Github), shows that slotc / sloc correlates well
  enough with actual test coverage showing slotc / sloc shows how accurate a test suite may be. First Test suites are tested for and if
  found, part of the score is rewarded. The ratio of slotc/sloc is then also factored in later. This is done by walking the cloned repo for
  test lines of code as well as just file directories. Assumptions are made for total sloc and the ratio is added to the total correctness score.

  Responsive Maintainer: This Metric measures how responsive and maintained the package is. This is based on the number of open issues and open 
  pull requests and compared to the number of closed issues and pull requests. We look at the frequency and the ratio between them to determine if it's
  a well-maintained package or not. This will help give us an idea on how often a package is updated. 

  License: This Metric measures if a license is compatible with the company license which uses a GNU LGPLv2.1 licsense. We'll check
  through a packages README or package.json and check to see if their license is compatible. Once we have this information we'll output with a 
  0 or 1 based on if the license is compatible or not.

   GoodPinningPractice: this metric is measured as described in the [spec](https://purdue.brightspace.com/d2l/le/content/1096370/viewContent/17430283/View). We locate the package.json file which contains dependencies and then check which ones are tied to specific major+minor version.

   pullRequest: This metric is measured by taking a sample of the last 100 commits and seeing how many of those commits came from a pull request. We measure the specific number of lines modified from a given commit and compare to the total amount of lines modified. (could possibily optimize by reducing api calls.)

