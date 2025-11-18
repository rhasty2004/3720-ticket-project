const db = require('../../shared-db/database');

class User {
  static async create(email, password, role = 'client') {
    return new Promise((resolve, reject) => {
      const sql = 'INSERT INTO users (email, password, role) VALUES (?, ?, ?)';
      db.run(sql, [email, password, role], function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, email, role });
      });
    });
  }

  static async findByEmail(email) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM users WHERE email = ?';
      db.get(sql, [email], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  static async findById(id) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT id, email, role FROM users WHERE id = ?';
      db.get(sql, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }
}

module.exports = User;