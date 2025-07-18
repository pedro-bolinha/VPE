import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import router from './routes.js';
import Seed from './data/seeders.js';
 
const server = express();
 
server.use(morgan('tiny'));
 
server.use(
  cors({
    origin: '*',
    methods: 'GET,HEAD,OPTIONS,PUT,PATCH,POST,DELETE',
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    preflightContinue: false,
  })
);
 
server.use(express.json());
 
server.use(express.static('public'));
 
server.use('/api', router);
 
await Seed.up();
 
server.listen(3000, () => {
  console.log('Server is running on port 3000');
});
 