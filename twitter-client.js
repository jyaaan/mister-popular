var OAuth = require('oauth').OAuth;
var qs = require('qs');
var fs = require('fs');

// NOT SECURE
var config = {
   consumerKey: "fBCYy7We2pk8Yj8JlgfafLxsm",
   consumerSecret: "1UyUroQt3NaWjqSgIkfgiSnWjikwT8JsszfIjjsh6oZUSiRF2N",
   accessToken: "862332097-3dn8t0TrRgFueWsURvI9zxYHSyIP6Pk3RZdUol2H",
   accessTokenSecret: "QN8Fa1dBd2YP91NrsOT2Ob7WurvPXA9ZrX0b80JZ7tkMO",
   callBackUrl: "http://localhost:5760/index.html"
}

// CONSTRUCTOR

function Twitter() {
  var configPath = 'data/twitter_config';
  try {
    this.consumerKey = config.consumerKey;
    this.consumerSecret = config.consumerSecret;
    this.accessToken = config.accessToken;
    this.accessTokenSecret = config.accessTokenSecret;
    this.callBackUrl = config.callBackUrl;
    this.baseUrl = 'https://api.twitter.com/1.1';
    this.oauth = new OAuth(
      'https://api.twitter.com/oauth/request_token',
      'https://api.twitter.com/oauth/access_token',
      this.consumerKey,
      this.consumerSecret,
      '1.0',
      this.callBackUrl,
      'HMAC-SHA1'
    );
  } catch (err) {
    console.log('missing config file');
  }
}

// AUTHENTICATION FUNCTIONS

Twitter.prototype.getOAuthRequestToken = function (next) {
  this.oauth.getOAuthRequestToken((err, oauthToken, oauthTokenSecret, results) => {
    if (err) {
      console.error(err);
      next();
    } else {
      var oauth = {};
      oauth.token = oauthToken;
      oauth.tokenSecret = oauthTokenSecret;
      next(oauth);
    }
  });
};

Twitter.prototype.getOAuthAccessToken = function (oauth, next) {
  this.oauth.getOAuthAccessToken(oauth.token, oauth.tokenSecret, oauth.verifier,
    (err, oauthAccessToken, oauthAccessTokenSecret, results) => {
      if (err) {
        console.error(err);
        next();
      } else {
        oauth.accessToken = oauthAccessToken;
        oauth.accessTokenSecret = oauthAccessTokenSecret;
        next(oauth);
      }
    });
};

// TWITTER API FUNCTIONS

// GET

Twitter.prototype.getFollowers = function (params, error, success) {
  console.log('getting all followers');
  var path = ''
}

Twitter.prototype.getFollowing = function (params, error, success) {
  console.log('getting all following');
  var path = '/friends/list.json' + this.buildQS(params);
  var url = this.baseUrl + path;
  console.log(url);
  this.doRequest(url, error, success);
}

Twitter.prototype.getAccountSettings = function (params, error, success) {
  console.log('getting account settings');
  var path = '/account/settings.json';
  var url = this.baseUrl + path;
  console.log(url);
    this.doRequest(url, error, success);
}

// POST

Twitter.prototype.postFollow = function (params, error, success) {
  console.log('posting follow');
  var path = '/friendships/create.json' + this.buildQS(params);
  var url = this.baseUrl + path;
  console.log(url);
  this.doPost(url, {}, error, success);
}


// DO FUNCTIONS

Twitter.prototype.doRequest = function (url, error, success) {
  url = formatUrl(url);
  var aggregate = [];
  var nextCursor = -1;
  // THIS IS A SCOPE ERROR. TURN INTO CALLBACK FUNCTION
  do {
    var cursorUrl = url + '&cursor=' + nextCursor;
    console.log(cursorUrl);
    this.oauth.get(cursorUrl, this.accessToken, this.accessTokenSecret, (err, bod, res) => {
      if(!err && res.statusCode == 200) {
        limits = {
          "x-rate-limit-limit": res.headers['x-rate-limit-limit'],
          "x-rate-limit-remaining": res.headers['x-rate-limit-remaining'],
          "x-rate-limit-reset": res.headers['x-rate-limit-reset']
        };
        var jsonBod = JSON.parse(bod);
        aggregate.push(jsonBod);
        console.log('cursor is' + bod['next_cursor']);
        nextCursor = 0;
      } else {
        console.error('do request error' + err);
        nextCursor = 0;
      }
    });
  }while (nextCursor != 0);
  success(aggregate);
}

Twitter.prototype.doPost = function (url, post_body, error, success) {
  url = formatUrl(url);

  this.oauth.post(url, this.accessToken, this.accessTokenSecret, post_body, 'application/x-www-form-urlencoded', (err, bod, res) => {
    if (!err && res.statusCode == 200) {
      success(JSON.parse(bod));
    } else {
      console.error('doPost error' + err);
      // error(err, res, bod);
    }
  })
}

Twitter.prototype.buildQS = function (params) {
  if (params && Object.keys(params).length > 0) {
    return '?' + qs.stringify(params);
  }
  return;
};

// UTILITY FUNCTIONS

function formatUrl(url) {
  return url.replace(/\!/g, "%21")
       .replace(/\'/g, "%27")
       .replace(/\(/g, "%28")
       .replace(/\)/g, "%29")
       .replace(/\*/g, "%2A");
}

// EXPORT
exports.Twitter = Twitter;
