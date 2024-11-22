"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetState = resetState;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const logger_1 = __importDefault(require("./logger"));
const uploadsDir = path_1.default.join(__dirname, 'uploads');
const downloadsDir = path_1.default.join(__dirname, '../downloads');
/**
 * Function to clear all files in a directory.
 * @param dirPath - The path to the directory to clear.
 */
function clearDirectory(dirPath) {
    if (fs_1.default.existsSync(dirPath)) {
        const files = fs_1.default.readdirSync(dirPath);
        files.forEach((file) => {
            const filePath = path_1.default.join(dirPath, file);
            try {
                if (fs_1.default.lstatSync(filePath).isDirectory()) {
                    // Recursively clear directories
                    clearDirectory(filePath);
                    fs_1.default.rmdirSync(filePath); // Remove the empty directory
                }
                else {
                    fs_1.default.unlinkSync(filePath); // Remove the file
                }
            }
            catch (error) {
                logger_1.default.error(`Error deleting ${filePath}: ${error.message}`);
            }
        });
    }
}
/**
 * Function to reset the system to its default state.
 * Clears uploads and downloads directories.
 */
function resetState() {
    logger_1.default.info('Starting system reset.');
    try {
        // Clear the uploads directory
        clearDirectory(uploadsDir);
        logger_1.default.info('Cleared uploads.');
        // Clear the downloads directory
        clearDirectory(downloadsDir);
        logger_1.default.info('Cleared downloads.');
        // Ensure directories exist after clearing them
        if (!fs_1.default.existsSync(uploadsDir)) {
            fs_1.default.mkdirSync(uploadsDir, { recursive: true });
        }
        if (!fs_1.default.existsSync(downloadsDir)) {
            fs_1.default.mkdirSync(downloadsDir, { recursive: true });
        }
        logger_1.default.info('System reset complete.');
    }
    catch (error) {
        logger_1.default.error(`Error during system reset: ${error.message}`);
    }
}
