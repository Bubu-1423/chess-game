const express = require('express');
const auth = require('../middleware/auth');

module.exports = (db) => {
  const router = express.Router();

  // 🔒 CREATE GAME
  router.post('/', auth, (req, res) => {
    const { player2 } = req.body;
    const player1 = req.user.id; // 🔥 from token

    db.run(
      `INSERT INTO games (player1, player2, result) VALUES (?, ?, ?)`,
      [player1, player2, 'pending'],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });

        res.json({ message: 'Game created', gameId: this.lastID });
      }
    );
  });

  // 🔒 GET GAMES
  router.get('/', auth, (req, res) => {
    db.all(
      `SELECT * FROM games WHERE player1 = ? OR player2 = ?`,
      [req.user.id, req.user.id],
      (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
      }
    );
  });

  return router;
};