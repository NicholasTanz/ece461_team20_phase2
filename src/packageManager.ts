import express from 'express';
import packageIngestion from './packageIngestion';
import packageHandler from './packageHandler';
import packageSearcher from './packageSearcher';

const app = express();
app.use(express.json());

app.use('/package', packageHandler);
app.use('/packages', packageSearcher)
app.use('/ingest', packageIngestion);


export default app;


