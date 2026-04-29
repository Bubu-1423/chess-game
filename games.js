const express = require('express');

module.exports = (db) => {
  const router = express.Router();

  // CREATE GAME
  router.post('/', (req, res) => {
    const { player1, player2, result } = req.body;

    if (!player1 || !player2) {
      return res.status(400).json({ error: 'Players required' });
    }

    db.run(
      `INSERT INTO games (player1, player2, result) VALUES (?, ?, ?)`,
      [player1, player2, result || 'pending'],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });

        res.json({ message: 'Game created', gameId: this.lastID });
      }
    );
  });

  // GET ALL GAMES
  router.get('/', (req, res) => {
    db.all(`SELECT * FROM games`, [], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  });

  return router;
};