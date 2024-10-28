// app.ts
import express from 'express';
import packageRoutes from './routes/packageRoutes';
import packageManager from './packageManager';
import logger from './logger';

const app = express();

app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).send('Server is running!');
});

// Register main routes
app.use('/', packageRoutes);
app.use('/', packageManager);

export default app;
