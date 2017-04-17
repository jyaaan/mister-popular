var OAuth = require('oauth').OAuth;
var qs = require('qs');
var fs = require('fs');

// MORE SECURE
var config = require('./user-config');

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

Twitter.prototype.getFollowing = function () {
  console.log('getting all following');
  var path = '/friends/ids.json';
  var url = this.baseUrl + path;
  console.log(url);
  return this.doRequests(url)
    .then((data) => {
      return data[0];
    })
}

Twitter.prototype.getAccountSettings = function (params, error, success) {
  console.log('getting account settings');
  var path = '/account/settings.json';
  var url = this.baseUrl + path;
  console.log(url);
    this.doRequest(url, error, success);
}

Twitter.prototype.getRateLimits = function (error, success) {
  console.log('getting limits');
  var path = '/application/rate_limit_status.json';
  var url = this.baseUrl + path;
  this.doRequest(url, error, success);
}
// POST

Twitter.prototype.postFollow = function (params) {
  console.log('posting follow');
  var path = '/friendships/destroy.json' + this.buildQS(params);
  var url = this.baseUrl + path;
  console.log(url);
  this.doPost(url, {})
    .then((result) => {
      return result;
    });
}

Twitter.prototype.postUnfollow = function (params) {
  console.log('posting unfollow');
  var path = '/friendships/create.json' + this.buildQS(params);
  var url = this.baseUrl + path;
  console.log(url);
  this.doPost(url, {})
    .then((result) => {
      return result;
    });
}

// DO FUNCTIONS

Twitter.prototype.doRequest = function (url, error, success) {
  url = formatUrl(url);
  this.oauth.get(url, this.accessToken, this.accessTokenSecret, (err, bod, res) => {
    if(!err && res.statusCode == 200) {
      success(bod);
    } else {
      console.error('do request error' + err);
    }
  })
}

Twitter.prototype.doRequests = function (url) {
  url = formatUrl(url);
  var users = [];
  return new Promise((resolve, reject) => {
    function cb(err, bod, res) {
      var jsonBod = JSON.parse(bod);
      var nextCursor = jsonBod['next_cursor'];
      if(!err) {
        console.log('success');
        users.push(jsonBod.ids);
      } else {
        console.error('do request error' + err);
        nextCursor = 0;
      }
      if (nextCursor != 0) {
        this.oauth.get(url + this.buildQS({ cursor: nextCursor }), this.accessToken, this.accessTokenSecret, cb.bind(this));
      } else {
        resolve(users);
      }
    }
    this.oauth.get(url, this.accessToken, this.accessTokenSecret, cb.bind(this));
  });
}

Twitter.prototype.doPost = function (url, post_body) {
  url = formatUrl(url);
  return new Promise((resolve, reject) => {
    function cb(err, bod, res) {
      if (!err) {
        resolve(JSON.parse(bod));
      } else {
        reject(err);
      }
    }
    this.oauth.post(url, this.accessToken, this.accessTokenSecret, post_body, 'application/x-www-form-urlencoded', cb);
  });
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
