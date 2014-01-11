'use strict';

var path = require('path');
var fs = require('fs');
var _ = require('underscore');

exports.partials = function(req, res) {
  var stripped = req.url.split('.')[0];
  var requestedView = path.join('./', stripped);
  res.render(requestedView, function(err, html) {
    if(err) {
      res.render('404');
    } else {
      res.send(html);
    }
  });
};

var indexTemplate;
exports.index = function(req, res) {
  if (!indexTemplate) {
    var templatePath = path.join(req.app.get('views'), 'index.html');
    var templateContent = fs.readFileSync(templatePath, 'utf8');
    indexTemplate = _.template(templateContent);
  }
  // console.info('rendering index', req.headers['accept-language'], req.language, req.languages, req.region, req.regions, req.locale);
  res.locals({
    language: req.language,
    locale: req.locale,
    region: req.region,
    user: req.user || {displayName: 'Anonymous'},
    userJSON: JSON.stringify(req.user || {displayName: 'Anonymous'})})
  res.send(indexTemplate(res.locals));
  // res.render('index');
};
