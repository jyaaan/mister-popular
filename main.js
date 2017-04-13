var express = require('express');
var app = express();

var Twitter = require('./twitter-client').Twitter;
var twitter = new Twitter();

var Database = require('./database').Database;
var database = new Database();

function error(err, res, bod) {
  console.log('error: ' + err);
}

function success(data, limits) {
  console.log(data);
}

function showScreenName(data) {
  console.log(data.screen_name);
}

app.get('/limits', (req, res) => {
  twitter.getRateLimits(error, success);
})

app.get('/following', (req, res) => {
  twitter.getFollowing()
    .then((data) => {
      console.log(data[0]);
      // res.send(data);
    });
})

app.get('/settings', (req, res) => {
  twitter.getAccountSettings({}, error, success);
})

app.get('/follow', (req, res) => {
  twitter.postFollow({}, error, success);
})

app.get('/test', (req, res) => {
  twitter.getFollowing()
    .then((data) => {
      var userObj = pairKeyValue('id', data);
      database.insertUserIds('clients', userObj)
        .then((result) => {
          res.send(result);
        });
    });
})

app.get('/clear/:tableName', (req, res) => {
  database.clearTable(req.params.tableName)
    .then((result) => {
      res.send(result);
    });
})

app.listen(5760, () => {
  console.log('listening to port 5760');
})

function pairKeyValue(key, values) {
  return values.map((value) => {
    var obj = {};
    obj[key] = value;
    return obj;
  });
}
