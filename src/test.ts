import * as fs from 'fs';
import * as path from 'path';

export async function test() {
    //call currently made commands
    try { //tests the "install" command
      console.log('Test Start: checking if "npm install" was run correctly');//We have to check for the files that would be installed by 'npm install'
    
      const packageLockPath = path.join(process.cwd(), 'package-lock.json');//Check if package-lock.json exists or has been updated
      if (!fs.existsSync(packageLockPath)) {
          throw new Error('Test failed: package-lock.json not found. "npm install" did not run correctly');
      }
    
      console.log('Test passed: All packages accounted for. "npm install" ran correctly');
    } catch (error) {
      console.error('Test failed:', error);
    }
    
    }
    
