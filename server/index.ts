import express from 'express';
import cors from 'cors';
import path from 'path';
import { initDatabase } from './database';
import userRoutes from './routes/userRoutes';
import serviceRoutes from './routes/serviceRoutes';
import requestRoutes from './routes/requestRoutes';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/requests', requestRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend — resolve path whether running via ts-node or compiled JS
// ts-node: __dirname = .../skillswap/server → ../client/dist works
// compiled: __dirname = .../skillswap/dist/server → ../../client/dist works
const clientDist = path.resolve(__dirname, '..', 'client', 'dist');
const clientDistAlt = path.resolve(__dirname, '..', '..', 'client', 'dist');
const fs = require('fs');
const servePath = fs.existsSync(clientDist) ? clientDist : clientDistAlt;
app.use(express.static(servePath));
app.get('*', (_req, res) => {
  res.sendFile(path.join(servePath, 'index.html'));
});

// Initialize database then start server
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Boomerang server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
