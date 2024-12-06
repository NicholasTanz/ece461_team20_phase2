import express from 'express';
import packageSender from './packageSender';
import packageIngestion from './packageIngestion';
// import packageEvaulator from './packageEvaluator'; this is for rate... issues with before routing changes.
import packageHandler from './packageHandler';

const app = express();
app.use(express.json());

/*
TO HANDLE:
/packages (post)
/reset (delete) (DONE)

/package/:id (get, put, delete) (get IS DONE, delete is DONE)
/package (post)
/package/:id/rate (get)
/package/:id/cost (get) (DONE)
/package/byRegex (post) (DONE)
*/


app.use('/package', packageHandler);
app.use()

app.use('/send', packageSender);
app.use('/ingest', packageIngestion);
// app.use('/eval', packageEvaulator);


export default app;


