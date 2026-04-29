const express = require('express');

module.exports = (db) => {
  const router = express.Router();

  // CREATE CHALLENGE
  router.post('/', (req, res) => {
    const { from_user, to_user } = req.body;

    if (!from_user || !to_user) {
      return res.status(400).json({ error: 'Both users required' });
    }

    db.run(
      `INSERT INTO challenges (from_user, to_user, status) VALUES (?, ?, ?)`,
      [from_user, to_user, 'pending'],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });

        res.json({ message: 'Challenge sent', id: this.lastID });
      }
    );
  });

  // ACCEPT CHALLENGE
  router.put('/:id/accept', (req, res) => {
    db.run(
      `UPDATE challenges SET status = 'accepted' WHERE id = ?`,
      [req.params.id],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });

        res.json({ message: 'Challenge accepted' });
      }
    );
  });

  // GET ALL
  router.get('/', (req, res) => {
    db.all(`SELECT * FROM challenges`, [], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  });

  return router;
};