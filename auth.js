const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

module.exports = (db) => {
  const router = express.Router();

  // REGISTER
  router.post('/register', async (req, res) => {
    try {
      const { username, email, password } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json({ error: 'All fields required' });
      }

      const hash = await bcrypt.hash(password, 10);

      db.run(
        `INSERT INTO users (username, email, password) VALUES (?, ?, ?)`,
        [username, email, hash],
        function (err) {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          res.json({ message: 'User registered', userId: this.lastID });
        }
      );
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // LOGIN
  router.post('/login', (req, res) => {
    const { email, password } = req.body;

    db.get(
      `SELECT * FROM users WHERE email = ?`,
      [email],
      async (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(400).json({ error: 'User not found' });

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(400).json({ error: 'Invalid password' });

        const token = jwt.sign(
          { id: user.id },
          process.env.JWT_SECRET || 'secret',
          { expiresIn: '7d' }
        );

        res.json({ token, user });
      }
    );
  });

  return router;
};