"use strict";

var _ = require('lodash');
var cheerio = require('cheerio');
var request = require('request');
var async = require('async');
var util = require('util');
var userAgent = require('./List-UA');

var URL = 'https://incloak.com/proxy-list/?type=%s&start=%s';

var protocol = process.env.PROTOCOL;

function randomWaiting(second) {
  var rand = _.random(1, second);
  return (rand * 1000);
}

exports.proxies = function(callback) {
  var idx = 0;
  var nbPage = 1
  var proxies = [];
  var options = {
    headers: {
      'User-Agent': _.sample(userAgent)
    }
  };

  console.log('Scraping starded...');
  async.whilst(function() {
    return (idx < nbPage);
  }, function(next) {

      request(util.format(URL, protocol, (idx * 64)), options, function(err, res, body) {

        if (err) return next(err);
        if (res.statusCode !== 200) return next(res.statusCode);

        var $ = cheerio.load(body);
        var rows = $('tbody tr').toArray();

        rows.forEach(function(row) {
          var proxy = {}
          var columns = $(row).find('td').toArray();

          proxy.ip = $(columns[0]).text();
          proxy.port = $(columns[1]).text();
          proxy.protocol = $(columns[4]).text();
          proxy.source = util.format(URL, protocol, (idx * 64));

          proxies.push(proxy);
        });
        nbPage = $('div.proxy__pagination ul li a').toArray().length - 1;
        idx++;
        setTimeout(function() {
          next();
        }, randomWaiting(4));
      });
  }, function(err) {
    if (err) return callback(err);
    return callback(null, proxies);
  });
};
