import * as path from 'path';
const ENV_FILE = path.join(__dirname, '..', '.env');
import { config } from 'dotenv';
config({ path: ENV_FILE });
import * as express from 'express';
import { Application } from 'express'
const cluster = require('cluster');
import * as os from 'os';
import csvFileRoutes from './routes/csvFileRoutes.js';

const app: Application = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

csvFileRoutes(app.use(express.Router()));

if (cluster.isPrimary) {
    let numCPUs: number = os.cpus().length;

    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
        cluster.on('exit', (worker) => {
            console.info(`Worker ${worker.process.pid} died`);
            console.info('Forking another worker process in place of that!');
            cluster.fork();
        });
    }
} else {
    const port = process.env.port || process.env.PORT || 3000;
    
    app.listen(port, () => {
        console.info(`Server listening to port: ${port}`);
    });
}