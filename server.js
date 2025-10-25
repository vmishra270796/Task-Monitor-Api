import 'dotenv/config';
import http from 'http';
import { Server as SocketServer } from 'socket.io';
import { connectDB } from './src/config/db.js';
import { createApp } from './src/app.js';
import { registerSocketHandlers } from './src/sockets/index.js';

const port = process.env.PORT || 4000;

await connectDB(process.env.MONGO_URI);

const io = new SocketServer({
  cors: { origin: process.env.CORS_ORIGIN, methods: ['GET', 'POST', 'PUT', 'DELETE'] }
});
registerSocketHandlers(io);

const app = createApp(io);
const server = http.createServer(app);

io.attach(server, { cors: { origin: process.env.CORS_ORIGIN } });

server.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
