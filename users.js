const express = require('express');

module.exports = (db) => {
  const router = express.Router();

  // GET ALL USERS
  router.get('/', (req, res) => {
    db.all(`SELECT id, username, email FROM users`, [], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  });

  // GET SINGLE USER
  router.get('/:id', (req, res) => {
    db.get(
      `SELECT id, username, email FROM users WHERE id = ?`,
      [req.params.id],
      (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'User not found' });
        res.json(row);
      }
    );
  });

  return router;
};