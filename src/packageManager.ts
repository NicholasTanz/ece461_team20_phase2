import express from 'express';
import packageSender from './packageSender';
import packageReceiver from './packageReceiver';

const app = express();
app.use(express.json());

app.use('/sender', packageSender);
app.use('/receiver', packageReceiver);

export default app;
