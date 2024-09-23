Team Members: Alex Beuerle, Sayim Shazlee, Nicholas Viardo, Dhruv Chaudhary





# Purpose:
The main purpose of this project is to take in a number of URLs from a file of GitHub and npm repositories and assign 
a score to them based on 5 metrics we have elected to use. Below is documentation that includes how to set up the code,
how to interact with it onces it has been set up, the metrics we use to calculate netScore and their justification. 





## Set-up instruction:
Instructions to run on local:
1) "git clone https://github.com/abeuerle/ECE461.git"
2) cd into the ECE461/ directory.
3) Create a .env file with a GitHub Token, Log level, and Log verbosity.
2) "chmod +x ./run" to give permissions
3) "npm run build"                                 
5) "./run install" makes sure all the dependancies are installed
6) "./run Path/to/URL/File" this will run for all URL's within the txt at the path specified
7) "./run test" runs the test suite and returns coverage

## Example setup:
2 files you will need to setup in your own environment will be the txt file containing your URLS as well as your .env file. These 
should be stored within the ECE461/ directory and are unique between users. Here is an example on how to implement them:

-URL.txt: This file is stored within the project enviroment and acts as a very limited example of how you should
  set up your URL file so that it can be correctly parsed by the program. to run this example type "./run URL.txt" into
  the terminal.

-.env: Make sure this file has 3 arguments set like this:
  GITHUB_TOKEN="your_token"

  LOG_FILE=Path/to/Your/Log/File  # Path to the log file
  
  LOG_LEVEL=2     # Set verbosity level (0: silent, 1: info, 2: debug)


## How to interact with the project:
  - The function of this file is to take in the input from the command line (being ./run install, ./run URL, and ./run test).
  - For the install function it should install the the necessary dependanies needed in order for the code to run.
  - The URL function will take a path to a file that has URLs of GitHub and npm repositories. It will then perform calculations
  and make calls on these repostiories in order to print out a netscore. These calculations are dont in metrics.ts
  - The test function should run a series of tests on the code by inputing sample URLs to check the total coverage that this 
  project has.





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

  Responsive Maintainer:

  License: 
