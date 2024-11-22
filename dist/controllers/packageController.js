"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPackages = void 0;
exports.getPackageRating = getPackageRating;
const run_1 = require("../run");
// Controller for handling package data
const getPackages = (req, res) => {
    res.json({ message: 'Fetching packages...' });
};
exports.getPackages = getPackages;
async function getPackageRating(req, res) {
    const { id } = req.params; // Get the package ID from the path
    const authToken = req.header('X-Authorization'); // Get the auth token from the header
    // Check for missing fields
    if (!id) {
        res.status(400).json({ error: 'Missing field(s) in the PackageID' });
        return;
    }
    if (!authToken) {
        res.status(403).json({ error: 'Authentication failed due to invalid or missing AuthenticationToken.' });
        return;
    }
    try {
        // Validate the package ID and authorization token here...
        // change later. 
        const packageUrlFromId = ['https://github.com/mrdoob/three.js/'];
        // Fetch the package rating
        const packageRating = await (0, run_1.processAllUrls)(packageUrlFromId);
        /*
  
        if (!packageRating) {
          return res.status(404).json({ error: 'Package does not exist.' });
        }*/
        // Return the package rating
        res.status(200).json(packageRating);
        return;
    }
    catch (error) {
        console.error('Error fetching package rating:', error);
        res.status(500).json({ error: 'The package rating system choked on at least one of the metrics.' });
        return;
    }
}
