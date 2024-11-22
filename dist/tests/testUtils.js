"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanTestPackageFiles = cleanTestPackageFiles;
// tests/testUtils.ts
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Define the directory where test package files are stored
const uploadsDir = path_1.default.join(__dirname, '../uploads');
// Function to clean up test package files
function cleanTestPackageFiles() {
    const files = fs_1.default.readdirSync(uploadsDir);
    files.forEach((file) => {
        if (file.startsWith('test-')) {
            fs_1.default.unlinkSync(path_1.default.join(uploadsDir, file));
            console.log(`Deleted: ${file}`);
        }
    });
    console.log('Cleanup completed.');
}
