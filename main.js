var express = require('express');
var app = express();

var Twitter = require('./twitter-client').Twitter;
var twitter = new Twitter();

var Database = require('./database').Database;
var database = new Database();

// var Schedule = require('./schedule').Schedule;
// var schedule = new Schedule();

function error(err, res, bod) {
  console.log('error: ' + err);
}

function success(data, limits) {
  console.log(data);
}

function showScreenName(data) {
  console.log(data.screen_name);
}

function spliceDupilcates(arr) {
  return arr.filter( (item, index, array) => {
    return array.indexOf(item) == index;
  });
}

app.get('/limits', (req, res) => {
  twitter.getRateLimits(error, success);
})

app.get('/following', (req, res) => {
  twitter.getFollowing({ user_id: twitter.userId })
    .then((data) => {
      res.send(data);
    });
})

app.get('/settings', (req, res) => {
  twitter.getAccountSettings({}, error, success);
})

app.get('/follow/:userId', (req, res) => {
  twitter.postFollow({ userId: req.params.userId })
    .then((result) => {
      res.send(result);
    });
})

app.get('/unfollow/:userId', (req, res) => {
    twitter.postUnfollow({ user_id: req.params.userId })
      .then((result) => {
        res.send(result);
      })
      .catch((err) => {
        console.error(err);
        res.send(err);
      })
})

app.get('/ids', (req, res) => {
  database.getUserIds('clients')
    .then((result) => {
      console.log(result[1].id);
      res.send(result[1].id);
    })
})

app.get('/insert-ids', (req, res) => {
  twitter.getFollowing({ user_id: twitter.userId })
    .then((data) => {
      var userObjs = pairKeyValue('id', data);
      database.insertObjects('clients', userObjs)
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

app.get('/getFollowedBy', (req, res) => {
  twitter.getFollowedBy({ user_id: twitter.userId })
    .then((data) => {
      res.send(data);
    });
})

app.get('/getAllUserIds', (req, res) => {
  var followingIds = [];
  var followedByIds = [];
  twitter.getFollowing({ user_id: twitter.userId })
    .then((data) => {
      followingIds = data;
      console.log('following: ' + followingIds.length);
    })
    .then(() => {
      twitter.getFollowedBy({ user_id: twitter.userId })
      .then((data) => {
        followedByIds = data;
        console.log('followed by: ' + followedByIds.length);
      })
      .then(() => {
        var allIds = followingIds.concat(followedByIds);
        console.log('all ids before splicing: ' + allIds.length);
        allIds = spliceDupilcates(allIds);
        console.log('all ids after splicing: ' + allIds.length);
        res.send('OK');
      })
    })
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
