require('dotenv').config();
var express = require('express');
var path = require('path');
var expressHandlebars = require('express-handlebars');
var favicon = require('serve-favicon');
var cookieParser = require('cookie-parser');
var cookieSession = require('cookie-session');
var logger = require('morgan');
var passport = require('passport');
const Auth0Strategy = require('passport-auth0');

var indexRouter = require('./routes/index');
var censusRouter = require('./routes/census-calls');
var compactsRouter = require('./routes/compacts');

/*var hbs = expressHandlebars.create({
  helpers: require("./public/javascripts/handlebars.js").helpers,
  defaultLayout: 'layout',
  extname: '.hbs'
});*/
//var handlebars = require('./public/javascripts/handlebars.js')(expressHandlebars);

//use Passport for Auth0
const strategy = new Auth0Strategy(
  {
    domain: process.env.AUTH0_DOMAIN,
    clientID: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    callbackURL:
      process.env.AUTH0_CALLBACK_URL
  },
  function(accessToken, refreshToken, extraParams, profile, done) {
    // accessToken is the token to call Auth0 API (not needed in the most cases)
    // extraParams.id_token has the JSON Web Token
    // profile has all the information from the user
    return done(null, profile);
  }
);

passport.use(strategy);

// This can be used to keep a smaller payload
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

var app = express();

/* View stuff */

app.engine("hbs", expressHandlebars({
  extname: '.hbs'
}));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', "hbs");
var hbs = require('handlebars');
hbs.registerHelper("compactFn", function(context, options) {
      var ret = "<ul>";
      console.log(context.length);
      for (var i = 0, j = context.length; i < j; i++) {
        ret = ret + "<li>" + options.fn(context[i]) + "</li>";
      }
      return ret + "</ul>";
});


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieSession({secret: process.env.SECRET}));
app.use(favicon(__dirname + '/public/images/favicon.ico'));

// Check logged in
app.use(function(req, res, next) {
  res.locals.loggedIn = false;
  if (req.session.passport && typeof req.session.passport.user != 'undefined') {
    res.locals.loggedIn = true;
  }
  next();
});

app.use('/', indexRouter);
app.use('/census/', censusRouter);
app.use('/compacts/', compactsRouter);

app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.render('error');
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

module.exports = app;
