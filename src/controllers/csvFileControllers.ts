import { Request, Response } from "express";
import * as fs from 'fs';
import body from "../types/bodyInterface.js";
import generateCSVFileUsingAPI from "../services/generateCSVFileUsingAPI.js";

export const generateCSVFile = async (req: Request, res: Response): Promise<void> => {
    try {
        const apiKey = req.query?.apiKey as string;
        const { fileName, fields, numRows }: body = req.body;

        if (fileName && fields) {
            const namesArray: string[] = Object.keys(fields);

            const payload: object[] = namesArray.map((value: string) => {
                return Object.assign({ name: value }, fields[value]);
            });

            const outputFilePath: string = `data/${fileName}-data-file.csv`;

            // generate CSV file
            await generateCSVFileUsingAPI(apiKey, numRows, payload, fileName, outputFilePath);
            
            res.send({
                message: 'CSV file generated successfully!'
            });

        } else {
            res.send({
                message: 'Either fileName, fields and type value missing'
            });
        }
    } catch (error) {
        res.send({
            error: error
        });
    }
}

export const downloadCSVFile = async (req: Request, res: Response): Promise<void> => {
    try {
        const fileName = req.query?.fileName as string;

        if (fileName) {
            const fileToDownload: string = `${fileName}-data-file.csv`;

            if (fs.existsSync(`data/${fileToDownload}`)) {
                const file: string = `data/${fileToDownload}`;
                const fileStream = fs.createReadStream(file);

                res.setHeader('Content-disposition', `attachment; filename=${fileToDownload}`);
                res.setHeader('Content-type', 'text/csv');

                fileStream.pipe(res);
            } else {
                res.send({
                    message: `File ${fileName} doesn't exist!`
                });
            }
        } else {
            res.send({
                message: 'fileName paramater missing'
            });
        }
    } catch (error) {
        res.send({
            error: error
        });
    }
}
