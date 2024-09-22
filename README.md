Team Members: Alex Beuerle, Sayim Shazlee, Nicholas Viardo, Dhruv Chaudhary





Purpose:
The main purpose of this project is to take in a number of URLs from a file of GitHub and npm repositories and assign 
a score to them based on 5 metrics we have elected to use. Below is documentation that includes how to set up the code,
how to interact with it onces it has been set up, the metrics we use to calculate netScore and their justification. 





# Set-up instruction:
Instructions to run on local:
1) "git clone https://github.com/abeuerle/ECE461.git"
2) chmod +x ./run                                          //To give executing permision to the run file
3) "npm run build"
4) "npm i"                                                 //Should it work without this?
5) ./run install //to get neccesary dependacies (try "npm run build" if not working at first)
6) "./run Path/to/URL/File"
7) "./run test"

Instructions to run on ecenprog:
1) "git clone https://github.com/abeuerle/ECE461.git"
2) 2) chmod +x ./run                                       //To give executing permision to the run file
3) "npm run build"
4) "npm i"                                                 //Should it work without this?
5) "./run install"
6) "./run Path/to/URL/File"
7) "./run test"





How to interact with the project:
  - The function of this file is to take in the input from the command line (being ./run install, ./run URL, and ./run test).
  - For the install function it should install the the necessary dependanies needed in order for the code to run.
  - The URL function will take a path to a file that has URLs of GitHub and npm repositories. It will then perform calculations
  and make calls on these repostiories in order to print out a netscore. These calculations are dont in metrics.ts
  - The test function should run a series of tests on the code by inputing sample URLs to check the total coverage that this 
  project has.





What metrics we use to calcualte NetScore and our justifiication:
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
