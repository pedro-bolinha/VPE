import express from 'express';
import { empresas } from './data/empresa.js'; 

const app = express();
app.use(express.json())

app.use(express.static('public'));
 
app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get('/empresas', (req, res) => {
  res.json(empresas);
});

app.listen(3000, () => {
  console.log('App running on port 3000');
});
 