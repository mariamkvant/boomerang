import express from 'express';
import cors from 'cors';
import path from 'path';
import { initDatabase } from './database';
import userRoutes from './routes/userRoutes';
import serviceRoutes from './routes/serviceRoutes';
import requestRoutes from './routes/requestRoutes';
import availabilityRoutes from './routes/availabilityRoutes';
import trustRoutes from './routes/trustRoutes';
import notificationRoutes from './routes/notificationRoutes';
import groupRoutes from './routes/groupRoutes';
import helpWantedRoutes from './routes/helpWantedRoutes';
import dmRoutes from './routes/dmRoutes';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/users', userRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/trust', trustRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/help-wanted', helpWantedRoutes);
app.use('/api/dm', dmRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend
const clientDist = path.resolve(__dirname, '..', 'client', 'dist');
const clientDistAlt = path.resolve(__dirname, '..', '..', 'client', 'dist');
const fs = require('fs');
const servePath = fs.existsSync(clientDist) ? clientDist : clientDistAlt;
app.use(express.static(servePath));
app.get('*', (_req, res) => {
  res.sendFile(path.join(servePath, 'index.html'));
});

initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Boomerang server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
