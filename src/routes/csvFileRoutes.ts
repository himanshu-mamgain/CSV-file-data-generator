import { Router } from "express";
import { generateCSVFile, downloadCSVFile } from "../controllers/csvFileControllers.js";

export default function csvFileRoutes(router: Router): void {

    router.post('/api/generate-csv-file', generateCSVFile);

    router.get('/api/download-csv-file', downloadCSVFile);

};