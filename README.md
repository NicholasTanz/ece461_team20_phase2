Team Members: Nicholas Tanzillo, Akash Amalarasan, Charlie Kim, Alison Liang.

# Purpose:
The main purpose of this project is to take in a number of URLs from a file of GitHub and npm repositories and assign 
a score to them based on 5 metrics we have elected to use. Below is documentation that includes how to set up the code,
how to interact with it onces it has been set up, the metrics we use to calculate netScore and their justification. 


## Setup Instructions
> **Note**: Develop on eceprog, this is the environment that our project will be tested on. 

1. **Set environment variables:**
  ```bash
  export GITHUB_TOKEN=your_github_token_here
  export LOG_FILE=your_log_file_path_here
  export LOG_LEVEL=your_log_level_here
  ```

2. **Clone the Repository:**
   ```bash
   git clone https://github.com/NicholasTanz/ece461_team20_phase2
   ```

3. **Change Directory:**
   Navigate into the project directory:
   ```bash
   cd ece461_team20_phase2
   ```

4. **Install Dependencies:**
   Run the following command to install all necessary dependencies:
   ```bash
   ./run install
   ```

5. **Run Individual Tests:**
   To run a specific test, use:
   ```bash
   ./run <file_name>.txt
   ```

6. **Run the Test Suite:**
   To execute the entire test suite, use:
   ```bash
   ./run test
   ```

7. **Syntax Checker:**
   Refer to the [syntax checker](#) for ensuring correctness.

## How to interact with the project:
* add a design of our project here, along with repo structure.


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

pinned Dependencies Metric: this metric is measured as described in the [spec](https://purdue.brightspace.com/d2l/le/content/1096370/viewContent/17430283/View). We locate the package.json file which contains dependencies and then check which ones are tied to specific major+minor version.

Code Introduced Via PRS and code review: This metric is measured by taking a sample of the last 100 commits and seeing how many of those commits came from a pull request. We measure the specific number of lines modified from a given commit and compare to the total amount of lines modified. (could possibily optimize by reducing api calls.)

