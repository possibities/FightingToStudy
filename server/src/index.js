import express from 'express';

const app = express();
app.get('/api/ping', (req, res) => res.json({ ok: true, name: '星夜营地' }));
app.listen(3001, () => console.log('API on http://localhost:3001'));
