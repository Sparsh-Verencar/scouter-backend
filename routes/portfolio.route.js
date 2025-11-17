// routes/portfolio.js
import express from "express";
import { getPortfolio, createPortfolio } from "../controllers/portfolio.controller.js";

const portfolioRoutes = express.Router();

portfolioRoutes.get("/me", getPortfolio);
portfolioRoutes.post("/create", createPortfolio);

export default portfolioRoutes;
