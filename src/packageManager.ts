import express from 'express';
import packageIngestion from './packageIngestion';
import packageHandler from './packageHandler';
import packageSearcher from './packageSearcher';

const app = express();
app.use(express.json());

/*
TO HANDLE:
/package/:id/rate (get) -> if issues arise, remove this route... 
had issues before changing routes.
*/

app.use('/package', packageHandler); 
app.use('/packages', packageSearcher)
app.use('/ingest', packageIngestion); // ??

export default app;


