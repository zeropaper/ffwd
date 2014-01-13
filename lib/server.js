'use strict';

// Module dependencies.
var express = require('express'),
    path = require('path'),
    fs = require('fs'),
    i18n = require('i18n'),
    passport = require('passport'),
    schemaOrg = require('./db/schema'),
    mongoose,
    supergoose
;



function server(configuration, options) {
  configuration = configuration || {};
  options = options || {};
  var app = express();

  schemaOrg(configuration.resources || ['Thing'], {}, function(err) {
    if (err) {
      throw err;
    }

    var environment = options.environment || 'development';

    var appPath = configuration.appPath || 'app';
    var appBaseUrl = configuration.appUrl || 'http://localhost:9000';
    var viewsPath = configuration.viewsPath || appPath + '/views';

    mongoose = options.mongoose || schemaOrg.mongoose;
    supergoose = options.supergoose || schemaOrg.supergoose;

    var projectDir = configuration.projectDir || process.env.PROJECT_DIR || path.resolve(__dirname+'/../');

    var _credentials = configuration.credentials || require(path.join(projectDir, '.credentials'));
    

    var PassportUser = require('./db/passport-user');

    /************************************************\
     *
     *
     *
     *
    \************************************************/

    passport.serializeUser(function(user, done) {
      done(null, user._id);
    });
    passport.deserializeUser(function(id, done) {
      PassportUser.findById(id, function (err, user) {
        done(err, user);
      });
    });


    i18n.configure({
      // setup some locales - other locales default to en silently
      locales: ['en', 'de', 'it', 'fr'],
     
      // sets a custom cookie name to parse locale settings from
      cookie: 'language',
     
      // where to store json files - defaults to './locales'
      directory: projectDir + '/locales'
    });

    /************************************************\
     *
     *
     *
     *
    \************************************************/


    // Express Configuration
    app.configure('development', function(){
      app.use(require('connect-livereload')());
      app.use(express.static(path.join(projectDir, '.tmp')));
      app.use(express.static(path.join(projectDir, 'app')));
      app.use(express.errorHandler());
      app.set('views', viewsPath);
    });

    app.configure('production', function(){
      app.use(express.favicon(path.join(projectDir, 'public', 'favicon.ico')));
      app.use(express.static(path.join(projectDir, 'public')));
      app.set('views', viewsPath);
    });

    app.configure(function(){
      app.engine('html', require('ejs').renderFile);
      app.set('view engine', 'html');
      app.use(express.cookieParser());
      app.use(express.logger('dev'));
      app.use(express.bodyParser());
      // app.use(express.methodOverride());

      app.use(express.session({secret: 'K3yb04rdK4t'}));
      app.use(passport.initialize());
      app.use(passport.session());


      // i18n init parses req for language headers, cookies, etc.
      app.use(i18n.init);

      // Router needs to be last
      app.use(app.router);
    });

    /************************************************\
     *
     *
     *
     *
    \************************************************/

    // Controllers
    var api = require('./controllers/api/v1/index'),
        controllers = require('./controllers');

    for (var name in api.params) {
      app.param(name, api.params[name]);
    }

    /******************************************************************/
    if (_credentials.GOOGLE_CLIENT_ID && _credentials.GOOGLE_CLIENT_SECRET) {
      var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

      passport.use(new GoogleStrategy({
          clientID: _credentials.GOOGLE_CLIENT_ID,
          clientSecret: _credentials.GOOGLE_CLIENT_SECRET,
          callbackURL: appBaseUrl+'/auth/google/callback',
          scope: 'profile'
        },
        function(accessToken, refreshToken, profile, done) {
          User.findOrCreate({ googleId: profile.id }, function (err, user) {
            return done(err, user);
          });
        }
      ));
    }
    else {
      var GoogleStrategy = require('passport-google').Strategy;

      passport.use(new GoogleStrategy({
          returnURL: appBaseUrl+'/auth/google/return',
          realm: appBaseUrl+'/'
        },
        function(identifier, profile, done) {
          console.info('google profile', identifier, profile);
          profile.provider = 'openId';
          profile.id = identifier;
          User.findOrCreate({
            provider: profile.provider,
            id:       profile.id
          }, profile, function(err, user) {
            console.info('User document', user);
            done(err, user);
          });
        }
      ));
    }
    /******************************************************************/
    if (_credentials.FACEBOOK_APP_ID && _credentials.FACEBOOK_APP_SECRET) {
      var FacebookStrategy = require('passport-facebook').Strategy;

      passport.use(new FacebookStrategy({
          clientID: _credentials.FACEBOOK_APP_ID,
          clientSecret: _credentials.FACEBOOK_APP_SECRET,
          callbackURL:appBaseUrl +'/auth/facebook/callback'
        },
        function(accessToken, refreshToken, profile, done) {
          console.info('facebook profile', profile);
          User.findOrCreate({facebook: profile.id}, function(err, user) {
            if (err) { return done(err); }
            done(null, user);
          });
        }
      ));
    }
    /******************************************************************/
    if (_credentials.TWITTER_CONSUMER_KEY && _credentials.TWITTER_CONSUMER_SECRET) {
      var TwitterStrategy = require('passport-twitter').Strategy;

      passport.use(new TwitterStrategy({
          consumerKey: _credentials.TWITTER_CONSUMER_KEY,
          consumerSecret: _credentials.TWITTER_CONSUMER_SECRET,
          callbackURL: appBaseUrl +'/auth/twitter/callback'
        },
        function(token, tokenSecret, profile, done) {
          console.info('twitter profile', profile);
          User.findOrCreate({twitter: profile.id}, function(err, user) {
            if (err) { return done(err); }
            done(null, user);
          });
        }
      ));
    }
    /************************************************\
     *
     *
     *
     *
    \************************************************/


    /******************************************************************/
    var authOptions = {
      successRedirect: '/',
      failureRedirect: '/login'
    };

    // Redirect the user to Google for authentication.  When complete, Google
    // will redirect the user back to the application at
    //     /auth/google/return
    app.get('/auth/google', passport.authenticate('google'));

    // Google will redirect the user to this URL after authentication.  Finish
    // the process by verifying the assertion.  If valid, the user will be
    // logged in.  Otherwise, authentication has failed.
    app.get('/auth/google/return', 
      passport.authenticate('google', authOptions));

    /******************************************************************/

    // Redirect the user to Facebook for authentication.  When complete,
    // Facebook will redirect the user back to the application at
    //     /auth/facebook/callback
    app.get('/auth/facebook', passport.authenticate('facebook'));

    // Facebook will redirect the user to this URL after approval.  Finish the
    // authentication process by attempting to obtain an access token.  If
    // access was granted, the user will be logged in.  Otherwise,
    // authentication has failed.
    app.get('/auth/facebook/callback', 
      passport.authenticate('facebook', authOptions));

    /******************************************************************/

    // Redirect the user to Twitter for authentication.  When complete, Twitter
    // will redirect the user back to the application at
    //   /auth/twitter/callback
    app.get('/auth/twitter', passport.authenticate('twitter'));

    // Twitter will redirect the user to this URL after approval.  Finish the
    // authentication process by attempting to obtain an access token.  If
    // access was granted, the user will be logged in.  Otherwise,
    // authentication has failed.
    app.get('/auth/twitter/callback', 
      passport.authenticate('twitter', authOptions));

    /******************************************************************/

    // API definition
    app.get('/api/v1/definition/:thingType/:thingPath', api.defineThingType);
    app.get('/api/v1/definition/:thingType', api.defineThingType);
    app.get('/api/v1/definition', api.defineThingType);



    // Thing resources
    app.post('/api/v1/:thingType', api.post);

    app.get('/api/v1/:thingType/:thingId/:thingPath', api.list);
    app.get('/api/v1/:thingType/:thingId', api.get);
    app.get('/api/v1/:thingType', api.list);

    app.put('/api/v1/:thingType/:thingId', api.put);

    app.delete('/api/v1/:thingType/:thingId', api.delete);



    // Angular Routes
    app.get('/partials/*', controllers.partials);
    app.get('/*', controllers.index);
  });

  
  return app;
}
module.exports = server;
