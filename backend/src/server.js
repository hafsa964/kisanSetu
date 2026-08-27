require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const connectDB = require('./configuration/db');
const errorHandler = require('./middleware/errorhandler');
const { initSocket } = require('./services/socketService');

const authRoutes = require('./routes/authRoutes');
const centreRoutes = require('./routes/centreRoutes');
const slotRoutes = require('./routes/slotRoutes');
const queueRoutes = require('./routes/queueRoutes');
const alertRoutes = require('./routes/alertRoutes');
const adminRoutes = require('./routes/adminRoutes');

connectDB();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/centres', centreRoutes);
app.use('/api/slots', slotRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/admin', adminRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use(errorHandler);

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
initSocket(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`KisanSetuAI backend running on port ${PORT}`));
