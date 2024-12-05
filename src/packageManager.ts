import express from 'express';
import packageSender from './packageSender';
import packageReceiver from './packageReceiver';
import packageSearcher from './packageSearcher';
import packageDeleter from './packageDeleter';
import packageIngestion from './packageIngestion';
// import packageEvaulator from './packageEvaluator';
import packageCostDepends from './packageCostDepends';

const app = express();
app.use(express.json());

app.use('/send', packageSender);
app.use('/fetch', packageReceiver);
app.use('/search', packageSearcher);
app.use('/delete', packageDeleter);
app.use('/ingest', packageIngestion);
// app.use('/eval', packageEvaulator);
app.use('/cost', packageCostDepends);

export default app;


