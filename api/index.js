import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());

app.get('/api/health', (req, res) => {
  res.json({ status: 'minimal-ok', version: '4.1.7' });
});

export default app;
