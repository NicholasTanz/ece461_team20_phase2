"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const packageController_1 = require("../controllers/packageController");
const router = (0, express_1.Router)();
// Define your routes
router.get('/packages', packageController_1.getPackages);
router.get('/package/:id/rate', packageController_1.getPackageRating);
exports.default = router;
