const passport      = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const db            = require('./db');

passport.serializeUser((user, done) => done(null, user.id));

passport.deserializeUser(async (id, done) => {
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
    done(null, rows[0] || false);
  } catch (err) { done(err); }
});

passport.use(new LocalStrategy({ usernameField: 'email' },
  async (email, password, done) => {
    try {
      const [rows] = await db.query('SELECT * FROM users WHERE email = ? AND is_active = 1', [email]);
      const user = rows[0];
      if (!user) return done(null, false, { message: 'No account found.' });
      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) return done(null, false, { message: 'Incorrect password.' });
      return done(null, user);
    } catch (err) { return done(err); }
  }
));
