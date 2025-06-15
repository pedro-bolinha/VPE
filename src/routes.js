import express from 'express';
import Empresa from './models/empre.js';

class HTTPError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code;
  }
}

const router = express.Router();

router.post('/empresas', async (req, res) => {
  try {
    const created = await Empresa.create(req.body);
    res.json(created);
  } catch {
    throw new HTTPError('Unable to create empresa', 400);
  }
});

router.get('/empresas', async (req, res) => {
  try {
    const { name } = req.query;
    const results = await Empresa.read('name', name);
    res.json(results);
  } catch {
    throw new HTTPError('Unable to read empresas', 400);
  }
});

router.get('/empresas/:id', async (req, res) => {
  try {
    const item = await Empresa.readById(req.params.id);
    res.json(item);
  } catch {
    throw new HTTPError('Unable to find empresa', 400);
  }
});

router.put('/empresas/:id', async (req, res) => {
  try {
    const updated = await Empresa.update({ ...req.body, id: req.params.id });
    res.json(updated);
  } catch {
    throw new HTTPError('Unable to update empresa', 400);
  }
});

router.delete('/empresas/:id', async (req, res) => {
  try {
    await Empresa.remove(req.params.id);
    res.sendStatus(204);
  } catch {
    throw new HTTPError('Unable to remove empresa', 400);
  }
});

router.use((req, res) => res.status(404).json({ message: 'Content not found!' }));
router.use((err, req, res) => {
  if (err instanceof HTTPError) {
    res.status(err.code).json({ message: err.message });
  } else {
    res.status(500).json({ message: 'Something broke!' });
  }
});

export default router;
