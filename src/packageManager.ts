import express from 'express';
import packageIngestion from './packageIngestion';
// import packageEvaulator from './packageEvaluator'; this is for rate... issues with before routing changes.
import packageHandler from './packageHandler';
import packageSearcher from './packageSearcher';

const app = express();
app.use(express.json());

/*
TO HANDLE:
/packages (post) (DONE)
/reset (delete) (DONE)

/package/:id (get, post, delete) (DONE -> get, post, delete)
/package (post) (DONE)
/package/:id/rate (get)
/package/:id/cost (get) (DONE)
/package/byRegex (post) (DONE)
*/


app.use('/package', packageHandler);
app.use('/packages', packageSearcher)
app.use('/ingest', packageIngestion); // ??
// app.use('/eval', packageEvaulator); 


export default app;


