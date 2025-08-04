import express from "express";
import cors from "cors";

import dotenv from "dotenv";

import bodyParser from "body-parser";
import portfolioRoutes from "./routes/portfolio.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use("/portfolio", portfolioRoutes);

const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
