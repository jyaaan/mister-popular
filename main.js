var express = require('express');
var app = express();

var Twitter = require('./twitter-client').Twitter;
var twitter = new Twitter();

var Database = require('./database').Database;
var database = new Database();

var tempFollowingDate = new Date(2017, 3, 15, 9, 0, 0);

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

app.get('/nextUnfollow', (req, res) => {
  database.getNextUnfollow(twitter.clientId)
    .then((result) => {
      res.send(result[0]);
    })
})

app.get('/initialize', (req, res) => {
  var allUserIds = [];
  getAllUserIds(twitter.clientId)
    .then((objIds) => {
      allUserIds = pairKeyValue('id', objIds.all);
      database.insertObjects('users', allUserIds)
        .then((result) => {

        });
      return objIds;
    })
    .then((objIds) => {
      var batchObj = generateRelationships(objIds, twitter.clientId);
      console.log(batchObj);
      database.insertObjects('relationships', batchObj)
        .then((result) => {
          res.send(result);
        })
    })
})

function generateRelationships(objIds, clientId) {
  var objRelationships = [];
  objIds.all.forEach((user) => {
    var tempRelationships = {};
    tempRelationships.client_id = clientId;
    tempRelationships.user_id = user;
    tempRelationships.locked = false;
    if (objIds.following.indexOf(user) > -1) tempRelationships.last_follow_ts = tempFollowingDate.toISOString();
    tempRelationships.following = (objIds.following.indexOf(user) > -1);
    tempRelationships.followed_by = (objIds.followedBy.indexOf(user) > -1);
    tempRelationships.unfollowed = false;
    objRelationships.push(tempRelationships);
  })
  return objRelationships;
}

function getAllUserIds(clientId) {
  var followingIds = [];
  var followedByIds = [];
  return new Promise((resolve, reject) => {
    twitter.getFollowing({ user_id: clientId })
    .then((data) => {
      followingIds = data;
      console.log('following: ' + followingIds.length);
      return 'ok';
    })
    .then(() => {
      twitter.getFollowedBy({ user_id: clientId })
      .then((data) => {
        followedByIds = data;
        console.log('followed by: ' + followedByIds.length);
        return 'ok';
      })
      .then(() => {
        var allIds = followingIds.concat(followedByIds);
        console.log('all ids before splicing: ' + allIds.length);
        allIds = spliceDupilcates(allIds);
        console.log('all ids after splicing: ' + allIds.length);
        var objIds = {
          following: followingIds,
          followedBy: followedByIds,
          all: allIds
        };
        resolve(objIds);
      })
    });
  });
}

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
