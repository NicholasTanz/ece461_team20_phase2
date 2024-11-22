"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const packageSender_1 = __importDefault(require("./packageSender"));
const packageReceiver_1 = __importDefault(require("./packageReceiver"));
const packageSearcher_1 = __importDefault(require("./packageSearcher"));
const packageDeleter_1 = __importDefault(require("./packageDeleter"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use('/send', packageSender_1.default);
app.use('/fetch', packageReceiver_1.default);
app.use('/search', packageSearcher_1.default);
app.use('/delete', packageDeleter_1.default);
exports.default = app;
