import express from 'express';
import packageSender from './packageSender';
import packageReceiver from './packageReceiver';
import packageSearcher from './packageSearcher';
import packageDeleter from './packageDeleter';
import packageIngestion from './packageIngestion';
const app = express();
app.use(express.json());

app.use('/send', packageSender);
app.use('/fetch', packageReceiver);
app.use('/search', packageSearcher);
app.use('/delete', packageDeleter);
app.use('/ingest', packageIngestion);

export default app;


