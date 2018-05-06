var express = require('express');
var passport = require('passport');
var cookieSession = require('cookie-session');
var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn();
var router = express.Router();

const env = {
  AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID,
  AUTH0_DOMAIN: process.env.AUTH0_DOMAIN,
  AUTH0_CALLBACK_URL:
    process.env.AUTH0_CALLBACK_URL
};

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', {
    title: 'SDG Site',
    lat: 37.3382,
    lng: -121.8863,
    key: 'pk.eyJ1Ijoic3RhbmZvcmRzdXMiLCJhIjoiY2pmcjhtenJ5MGh4ZzMycDd0ajkxMHZobiJ9.JU52RKwVG17CJx1Cyj9Siw'
  });
});

router.get('/login', passport.authenticate('auth0', {
  clientID: env.AUTH0_CLIENT_ID,
  domain: env.AUTH0_DOMAIN,
  redirectUri: env.AUTH0_CALLBACK_URL,
  responseType: 'code',
  audience: 'https://' + env.AUTH0_DOMAIN + '/userinfo',
  scope: 'openid profile'
  }),
  function(req, res) {
    res.redirect('/');
});

router.post('/login', passport.authenticate('local', { successReturnToOrRedirect: '/', failureRedirect: '/login' }));

router.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});

router.get('/callback',
  passport.authenticate('auth0', {
    failureRedirect: '/login'
  }),
  function(req, res) {
    if (!req.user) {
      throw new Error('user null');
    }
    req.session.user = req.user;
    res.redirect('/user');
  }
);

router.get('/user',
  //ensureLoggedIn('/login'),
  function(req, res, next) {
    res.render('user', {
      user: req.session.user,
      userProfile: JSON.stringify(req.session.user, null, '  ')
  });
});

module.exports = router;
