const express = require('express');
const auth = require('../middleware/auth');

module.exports = (db) => {
  const router = express.Router();

  // 🔒 CREATE CHALLENGE
  router.post('/', auth, (req, res) => {
    const { to_user } = req.body;
    const from_user = req.user.id;

    db.run(
      `INSERT INTO challenges (from_user, to_user, status) VALUES (?, ?, ?)`,
      [from_user, to_user, 'pending'],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });

        res.json({ message: 'Challenge sent', id: this.lastID });
      }
    );
  });

  // 🔒 ACCEPT
  router.put('/:id/accept', auth, (req, res) => {
    db.run(
      `UPDATE challenges SET status = 'accepted' WHERE id = ? AND to_user = ?`,
      [req.params.id, req.user.id],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });

        if (this.changes === 0) {
          return res.status(403).json({ error: 'Not allowed' });
        }

        res.json({ message: 'Challenge accepted' });
      }
    );
  });

  return router;
};