// app.ts: Sets up the Express app, integrates routes for package handling, searching, ingestion, and tracks.

import express from 'express';
import packageIngestion from './packageIngestion';
import packageHandler from './packageHandler';
import packageSearcher from './packageSearcher';
import tracks from './tracks';

const app = express();
app.use(express.json());


app.use('/package', packageHandler);
app.use('/packages', packageSearcher)
app.use('/ingest', packageIngestion); 
app.use('/tracks', tracks);


export default app;


