// app.ts
import express from 'express';
import packageManager from './packageManager';

const app = express();

app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).send('Server is running!');
});

// Register main routes
app.use('/', packageManager);

export default app;
