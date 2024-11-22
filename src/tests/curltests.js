"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var child_process_1 = require("child_process");
// Helper function to run curl commands
function runCurlCommand(command, description) {
    console.log("\n### ".concat(description, " ###"));
    console.log("Command: ".concat(command, "\n"));
    return new Promise(function (resolve, reject) {
        (0, child_process_1.exec)(command, function (error, stdout, stderr) {
            if (error) {
                console.error("Error: ".concat(error.message));
                reject(error);
            }
            else if (stderr) {
                console.error("Stderr: ".concat(stderr));
            }
            console.log("Response: ".concat(stdout));
            resolve();
        });
    });
}
// Base URL of the API
var BASE_URL = 'http://localhost:3000';
// Example data
var testPackageContent = 'UEsDBAoAAAAAACAfUFkAAAAAAAAAAAAAAAASAAkAdW5kZXJzY29yZS1t';
var testJSProgram = "\nif (process.argv.length === 7) {\n  console.log('Success');\n  process.exit(0);\n} else {\n  console.log('Failed');\n  process.exit(1);\n}\n";
var testURL = 'https://github.com/jashkenas/underscore';
function runTests() {
    return __awaiter(this, void 0, void 0, function () {
        var error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 7, , 8]);
                    // 1. Upload a new package via Content
                    return [4 /*yield*/, runCurlCommand("curl -X POST ".concat(BASE_URL, "/sender/package -H \"Content-Type: application/json\" -d '").concat(JSON.stringify({
                            Name: 'test-package-content',
                            Version: '1.0.0',
                            Content: testPackageContent,
                            JSProgram: testJSProgram,
                        }), "'"), 'Upload a new package via Content')];
                case 1:
                    // 1. Upload a new package via Content
                    _a.sent();
                    // 2. Upload a new package via URL
                    return [4 /*yield*/, runCurlCommand("curl -X POST ".concat(BASE_URL, "/sender/package -H \"Content-Type: application/json\" -d '").concat(JSON.stringify({
                            Name: 'test-package-url',
                            Version: '1.0.0',
                            URL: testURL,
                            JSProgram: testJSProgram,
                        }), "'"), 'Upload a new package via URL')];
                case 2:
                    // 2. Upload a new package via URL
                    _a.sent();
                    // 3. Update an existing package via Content
                    return [4 /*yield*/, runCurlCommand("curl -X POST ".concat(BASE_URL, "/sender/package/1 -H \"Content-Type: application/json\" -d '").concat(JSON.stringify({
                            Name: 'test-package-content',
                            Version: '2.0.0',
                            Content: testPackageContent,
                            JSProgram: testJSProgram,
                        }), "'"), 'Update an existing package via Content')];
                case 3:
                    // 3. Update an existing package via Content
                    _a.sent();
                    // 4. Update an existing package via URL
                    return [4 /*yield*/, runCurlCommand("curl -X POST ".concat(BASE_URL, "/sender/package/2 -H \"Content-Type: application/json\" -d '").concat(JSON.stringify({
                            Name: 'test-package-url',
                            Version: '2.0.0',
                            URL: testURL,
                            JSProgram: testJSProgram,
                        }), "'"), 'Update an existing package via URL')];
                case 4:
                    // 4. Update an existing package via URL
                    _a.sent();
                    // 5. Download a package via Content
                    return [4 /*yield*/, runCurlCommand("curl -X GET ".concat(BASE_URL, "/receiver/download/1"), 'Download a package via Content')];
                case 5:
                    // 5. Download a package via Content
                    _a.sent();
                    // 6. Download a package via URL
                    return [4 /*yield*/, runCurlCommand("curl -X GET ".concat(BASE_URL, "/receiver/download/2"), 'Download a package via URL')];
                case 6:
                    // 6. Download a package via URL
                    _a.sent();
                    return [3 /*break*/, 8];
                case 7:
                    error_1 = _a.sent();
                    console.error('Tests failed:', error_1);
                    return [3 /*break*/, 8];
                case 8: return [2 /*return*/];
            }
        });
    });
}
// Run the tests
runTests();
