"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// app.ts
const express_1 = __importDefault(require("express"));
const packageRoutes_1 = __importDefault(require("./routes/packageRoutes"));
const packageManager_1 = __importDefault(require("./packageManager"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.get('/health', (req, res) => {
    res.status(200).send('Server is running!');
});
// Register main routes
app.use('/', packageRoutes_1.default);
app.use('/', packageManager_1.default);
exports.default = app;
