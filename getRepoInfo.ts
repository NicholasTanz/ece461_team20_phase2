import { execSync } from 'child_process';

const repoOwner = 'abeuerle';
const repoName = 'ECE461';

function getRepoInfo(owner: string, repo: string) {
    try {
        const result = execSync(`gh api repos/${owner}/${repo}`);
        const repoInfo = JSON.parse(result.toString());
        console.log('Repository Name:', repoInfo.name);
        console.log('Owner:', repoInfo.owner.login);
        console.log('Description:', repoInfo.description);
        console.log('Stars:', repoInfo.stargazers_count);
        console.log('Forks:', repoInfo.forks_count);
    } catch (error) {
        console.error('Error fetching repository information:', error);
    }
}

function listContributors(owner: string, repo: string) {
    try {
        const result = execSync(`gh api repos/${owner}/${repo}/contributors`);
        const contributors = JSON.parse(result.toString());
        console.log('\nContributors:');
        contributors.forEach((contributor: any) => {
            console.log(`${contributor.login}: ${contributor.contributions} contributions`);
        });
    } catch (error) {
        console.error('Error fetching contributors:', error);
    }
}

getRepoInfo(repoOwner, repoName);
listContributors(repoOwner, repoName);
getRepoInfo(repoOwner, repoName);
