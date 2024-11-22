"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const resetState_1 = require("./resetState");
const logger_1 = __importDefault(require("./logger"));
const router = (0, express_1.Router)();
/**
 * DELETE /reset - Reset the system state
 */
router.delete('/reset', async (req, res) => {
    const authToken = req.header('X-Authorization');
    // Check if the authentication token is present
    if (!authToken) {
        res.status(403).json({ error: 'Authentication failed due to invalid or missing AuthenticationToken.' });
        return;
    }
    // Verify the token (dummy check for this example; replace with real logic)
    const validToken = 'valid-auth-token'; // Replace with your actual authentication logic
    if (authToken !== validToken) {
        res.status(401).json({ error: 'You do not have permission to reset the registry.' });
        return;
    }
    try {
        (0, resetState_1.resetState)();
        res.status(200).send('Registry is reset.');
        logger_1.default.info('Registry reset triggered successfully.');
    }
    catch (error) {
        logger_1.default.error(`Failed to reset the registry: ${error.message}`);
        res.status(500).json({ error: 'Failed to reset the registry.' });
    }
});
exports.default = router;
