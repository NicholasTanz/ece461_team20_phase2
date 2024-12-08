import express from 'express';
import packageIngestion from './packageIngestion';
// import packageEvaulator from './packageEvaluator'; this is for rate... 
// we had issues with before routing changes.
import packageHandler from './packageHandler';
import packageSearcher from './packageSearcher';
import tracks from './tracks';

const app = express();
app.use(express.json());

/*
TO HANDLE:
/package/:id/rate (get) - we had issues with this endpoint before routing changes.
*/

app.use('/package', packageHandler);
app.use('/packages', packageSearcher)
app.use('/ingest', packageIngestion); // ??
app.use('/tracks', tracks);

// app.use('/eval', packageEvaulator); 


export default app;


