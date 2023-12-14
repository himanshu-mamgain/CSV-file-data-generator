import axios from "axios";
import * as fs from "fs";
import addFormula from "./addFormula.js";

const mockaroo_url: string = "https://api.mockaroo.com/api/generate.csv";

async function makeRequest(
  apiKey: string,
  payload: object[],
  num: number,
  header: boolean = true,
  numRequests: number = 1000
): Promise<Buffer> {
  try {
    // if iteration number is not 0 header will be false

    const response = await axios.post(mockaroo_url, payload, {
      params: {
        key: apiKey || process.env.MOCKAROO_API_KEY,
        count: numRequests,
        include_header: num === 0 ? header : !header,
      },
    });

    if (response.data?.error) {
      console.error(response.data.error);

      return response.data.error;
    }

    return response.data;
  } catch (error) {
    console.error(`Error`, error);
    return;
  }
}

async function writeFile(fileName: string, data: Buffer): Promise<void> {
  try {
    return new Promise<void>((resolve, reject) => {
      fs.writeFile(`data/${fileName}`, data, "utf-8", (error) => {
        if (error) {
          console.error(`Error writing to file ${fileName}:`, error);
          reject(error);
        } else {
          console.log(`File ${fileName} created successfully.`);
          resolve();
        }
      });
    });
  } catch (error) {
    return error;
  }
}

function joinFiles(filePaths: string[], outputFilePath: string): void {
  try {
    const outputStream = fs.createWriteStream(outputFilePath);
    outputStream.setMaxListeners(15);

    filePaths.forEach((filePath) => {
      const fileReadStream = fs.createReadStream(filePath);
      fileReadStream.pipe(outputStream, { end: false });
      fileReadStream.on("end", () => {
        fs.unlink(filePath, (error) => {
          if (error) {
            console.error(`Error deleting file: ${filePath}`, error);
          } else {
            console.info(`File ${filePath} deleted successfully!`);
          }
        });
      });
    });

    outputStream.on("finish", () => {
      console.info(`All files joined successfully into ${outputFilePath}`);
    });
  } catch (error) {
    return error;
  }
}

export default async function generateCSVFileUsingAPI(
  apiKey: string,
  numRows: number = 0,
  payload: object[],
  fileName: string,
  outputFilePath: string
): Promise<void> {
  try {
    const numRequests: number = Number(numRows / 1000);
    const filePromises: object[] = [];

    let rowNum: number = 0;

    for (let i: number = 0; i < numRequests; i++) {
      if (payload.some((item: object | any) => item?.type === "Row Number")) {
        const keyIndex = payload.findIndex(
          (item: object | any) => item.name === "user_id" || "post_id"
        );

        Object.assign(payload[keyIndex], addFormula(payload[keyIndex], rowNum));

        rowNum += 1000;
      }

      const requestPromise = makeRequest(apiKey, payload, i)
        .then((data) => writeFile(`${fileName}-${i}-data-file.csv`, data))
        .catch((error) =>
          console.error(`Error processing request ${i}:`, error)
        );

      filePromises.push(requestPromise);
    }

    Promise.all(filePromises)
      .then(() => {
        const filePaths = Array.from(
          { length: numRequests },
          (_, i) => `data/${fileName}-${i}-data-file.csv`
        );
        joinFiles(filePaths, outputFilePath);
      })
      .catch((error) => console.error("Error creating files:", error));
  } catch (error) {
    return error;
  }
}
