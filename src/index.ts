import express from 'express';
import appRoutes from './appRoutes';
import startSessionScheduler from './utils/session-scheduler'
import { createServer } from 'http';
import { setupWebSocketServer } from './utils/websocket-server';


const app = express();
const server = createServer(app);

app.get('/', (req, res) => {
  const name = process.env.NAME || 'World';
  res.send(`Hello ${name}!`);
});

// Middleware
app.use(express.json());

// Register routes
app.use('/api', appRoutes);

// background jobs
startSessionScheduler()

setupWebSocketServer(server);

const port = parseInt(process.env.PORT || '3000');
app.listen(port, () => {
  console.log(`listening on port ${port}`);
});
