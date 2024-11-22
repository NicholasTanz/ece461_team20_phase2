"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const testUtils_1 = require("./testUtils");
const router = express_1.default.Router();
// DELETE /cleanup
router.delete('/', (req, res) => {
    try {
        (0, testUtils_1.cleanTestPackageFiles)();
        res.status(200).json({ message: 'Test package files cleaned up.' });
    }
    catch (error) {
        if (error instanceof Error) {
            console.error(`Error during cleanup: ${error.message}`);
            res.status(500).json({ error: `Error during cleanup: ${error.message}` });
        }
        else {
            console.error('An unknown error occurred during cleanup.');
            res.status(500).json({ error: 'Unknown error occurred during cleanup.' });
        }
    }
});
exports.default = router;
