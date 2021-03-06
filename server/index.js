'use strict';

// debug ====================================================================
const debug = require('debug');
//debug.enable('server:*');
const log = debug('server:log');
const info = debug('server:info');
const error = debug('server:error');

// set up ===================================================================
const Promise = require('bluebird');
const fs = require('fs');
const path = require('path');
const express = require('express');
const expressSession = require('express-session');
const MongoStore = require('connect-mongo')(expressSession);
const passport = require('passport');
const flash = require('flash');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const LocalStrategy = require('passport-local').Strategy;
const mongoose = require('mongoose');
const db = require('./config/db.js');
const password = require('./config/secret.js');

const https = require('https');
const broadcasting = require('./broadcasting/broadcasting');

const port = process.env.PORT || 8443;

const app = express();

// configuration ============================================================

// db controllers
const User = require('../database/controllers/user.js');
const Record = require('../database/controllers/record.js');

// connect to mongoDB database
mongoose.connect(db.url);

// body parser setup
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// session management
app.use(cookieParser());
app.use(expressSession({
  secret: password.phrase,
  resave: true,
  saveUninitialized: false,
  cookie: {
    secure: false, // FIXME: change to true
    maxAge: 30 * 24 * 60 * 60
  },
  store: new MongoStore({
    mongooseConnection: mongoose.connection
  },
  function(err) {
    if (err) { return error('Failed Mongod Connection for Sessions', err); }
    return log('Connected mongostore for storing session data.');
  })
}));
app.use(passport.initialize());
app.use(passport.session());

// flash notifications
app.use(flash());

// routes =========================================================================
app.use(express.static(__dirname + '/../public'));

<<<<<<< HEAD
require('./routes/auth.js')(app);
require('./routes/kurento.js')(app);
=======
// login existing user
app.post('/api/login', (req, res, next) => {
  passport.authenticate('local', function(err, user, info) {
    if (user) {
      req.logIn(user, function(err) {
        if (err) { console.error('Login fail despite passing auth', err); }
        // res.redirect not working here, set up success property on login page to redirect
        // TODO: React Router with authentication
        return res.end('/recorder');
      });
    }
    if (info) {
      console.log('more information:', info);
    }
  })(req, res, next);
});

// create new user
app.post('/api/register', (req, res) => {
  User.findOne(req.body.username, function(err, data) {
    if (err) { console.error('Not able to search DB', err); }
    if (data.length > 0) {
      console.log('username already exists!');
      return res.end('/register');
    } else {
      User.addUser({
        username: req.body.username,
        password: req.body.password,
        email: req.body.email
      }, function(err, data) {
        if (err) { console.error('Error creating user', err); }
        console.log('created new user:', req.body.username);
        req.logIn(data, function(err) {
          if (err) { console.error('Error logging in', err); }
          console.log('logged in as', req.body.username);
          return res.end('/recorder');
        });
      });
    }
  });
});

// create new recording item with metadata, get back recording endpoint url
app.post('/api/recording', (req, res) =>
  mediaRepo.createItem(req.body).then(data => res.status(200).json(data)).catch(err => res.status(500).json(err))
);

// get recording url and metadata from id
app.get('/api/recording/:id', (req, res) =>
  mediaRepo.getItem(req.params.id).then(data => res.status(200).json(data)).catch(err => res.status(500).json(err))
);

// delete recording from id
app.delete('/api/recording/:id', (req, res) =>
  mediaRepo.deleteItem(req.params.id).then(data => res.status(200)).catch(err => res.status(500).json(err))
);

// update recording metadata from id
app.put('/api/recording/:id', (req, res) =>
  mediaRepo.updateItem(req.params.id, req.body).then(data => res.status(200)).catch(err => res.status(500).json(err))
);

// get list of recordings (returns list of recording IDs)
app.post('/api/recordings', (req, res) =>
  mediaRepo.findItems(req.body).then(data => res.status(200).json(data)).catch(err => res.status(500).json(err))
);

// get a list of users
app.get('/api/users', (req, res) => {

  console.log('get users')
  User.findAll((err, users) => {
    if (err) { return done(err); }
    console.log('users gotten', users)
    res.send(users);
  });
});

app.get('/login', (req, res) =>
  res.sendFile(path.resolve(__dirname, '../public', 'index.html'))
);

app.get('/register', (req, res) =>
  res.sendFile(path.resolve(__dirname, '../public', 'index.html'))
);

app.get('/logout', (req, res) => {
  req.logout();
  return res.end('/login');
});
>>>>>>> 3190c14c10dad7131647d09863c38e521c60401e

// handle every other route with index.html
app.get('*', (req, res, next) =>
  res.sendFile(path.resolve(__dirname, '../public', 'index.html'))
);

// key/certificate for https server
const sslPath = process.env.SSL_PATH || '/etc/letsencrypt/live/radradio.stream';
const options = {
  key: fs.readFileSync(sslPath + '/privkey.pem'),
  cert: fs.readFileSync(sslPath + '/fullchain.pem')
};

// secure server setup
const server = https.createServer(options, app);
broadcasting.startWss(server);

// start server
server.listen(port, err => {
  if (err) {
    error('Error while trying to start the server (port already in use maybe?)');
    return err;
  }
  info(`secure server listening on port ${port}`);
});

module.exports = app;
