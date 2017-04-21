// CAUTION Manual unfollows will not be caught by app

var express = require('express');
var app = express();

var Twitter = require('./twitter-client').Twitter;
var twitter = new Twitter();

var Database = require('./database').Database;
var database = new Database();

var tempFollowingDate = new Date(2017, 3, 15, 9, 0, 0);

// var Schedule = require('./schedule').Schedule;
// var schedule = new Schedule();

function showScreenName(data) {
  console.log(data.screen_name);
}

function spliceDupilcates(arr) {
  return arr.filter((item, index, array) => {
    return array.indexOf(item) == index;
  });
}

function getUniqueIdsInA(arrA, arrB) {
  return arrA.filter((itemA) => {
    return arrB.findIndex((itemB) => {
      return itemB === itemA;
    }) == -1;
  })
}

app.get('/limits', (req, res) => {
  twitter.getRateLimits();
})

app.get('/following', (req, res) => {
  twitter.getFollowing({ user_id: twitter.userId })
    .then((data) => {
      res.send(data);
    });
})

app.get('/settings', (req, res) => {
  twitter.getAccountSettings({});
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

app.get('/hardreset', (req, res) => {
  database.clearTable('users')
    .then((result) => {
      database.clearTable('relationships')
      .then((result) => {
        database.clearTable('log')
        .then((result) => {
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
      })
    })
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
      var userId = result[0].user_id;
      database.lockRelationship(twitter.clientId, userId)
        .then((result) => {
          console.log('locked');
        })
      return userId;
    })
    .then((userId) => {
      twitter.postUnfollow({ user_id: userId })
        .then((result) => {
          database.logAction(twitter.clientId, userId, 'unfollow')
            .then((result) => {
              console.log('successfully unfollowed: ' + userId);
            })
        })
      return userId;
    })
    .then((userId) => {
      database.updateUnfollow(twitter.clientId, userId)
        .then((result) => {
          console.log('unfollowed');
        })
      return 'complete';
    })
    .then((message) => {
      res.send('complete');
    })
})

app.get('/buildFollowList', (req, res) => {
  if (twitter.queryTerms.length == 0) return;
  buildFollowList(twitter)
    .then((result) => {
      console.log(result + 'am i here?');
      console.log(twitter.followList.length + ' yesss');
    });
})

function buildFollowList(objTwitter) {
  console.log('term to query: ' + objTwitter.queryTerms[objTwitter.queryPos]);
  return new Promise((resolve, reject) => {
    function cb(twit) {
      twit.getSearch({ q: twit.queryTerms[objTwitter.queryPos] })
      .then((result) => {
        var searchIds = [];
        result.statuses.forEach((status) => {
          if(!(status.user.following || status.user.follow_request_sent)) {
            searchIds.push(status.user.id);
          }
        })
        return searchIds;
      })
      .then((searchIds) => {
        database.getFollowedBy(twit.clientId)
        .then((result) => {
          var trimmedSearchIds = getUniqueIdsInA(searchIds, result);
          twit.followList = twit.followList.concat(trimmedSearchIds);
          console.log('follow list length: ' + twit.followList.length);
          if(twit.followList.length > 199) {
            resolve('gee');
          } else {
            twit.incrementQuery();
            cb(twit);
          }
        })
      })
    }
    cb(objTwitter);
  })
}

app.get('/search/:query', (req, res) => {
  twitter.getSearch({ q: req.params.query })
    .then((result) => {
      var searchIds = [];
      result.statuses.forEach((status) => {
        if (!(status.user.following || status.user.follow_request_sent)) {
          searchIds.push(status.user.id);
        }
      })
      return searchIds;
    })
    .then((searchIds) => {
      database.getFollowedBy(twitter.clientId)
        .then((result) => {
          console.log(result);
          var trimmedSearchIds = getUniqueIdsInA(searchIds, result)
          res.send(trimmedSearchIds)
        })
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

app.get('/changes', (req, res) => {
  var clientId = twitter.clientId;
  getAllUserIds(clientId)
    .then((objIds) => {
      database.getUserIds('users')
        .then((result) => {
          var newIds = getUniqueIdsInA(objIds.all, result);
          if (newIds.length > 0) {
            var objNewIds = pairKeyValue('id', newIds);
            database.insertObjects('users', objNewIds)
              .then((result) => {

              });
            return 'ok';
          }
        })
      return objIds;
    })
    .then((objIds) => {
      database.getFollowing(clientId)
        .then((data) => {
          var newFollowing = getUniqueIdsInA(objIds.following, data);
          var newUnfollowing = getUniqueIdsInA(data, objIds.following);
          console.log('determining new following' + newFollowing.length);
          console.log('determining new unfollowing' + newUnfollowing.length)
          if (newUnfollowing.length > 0) {
            database.upsertRelationships(clientId, newUnfollowing, { following: false })
              .then((result) => {

              })
          }
          if (newFollowing.length > 0) {
            database.upsertRelationships(clientId, newFollowing, { following: true })
              .then((result) => {

              })
          }
          return 'hi';
        })
        .then((result) => {
          database.getFollowedBy(clientId)
          .then((data) => {
            var newFollowedBy = getUniqueIdsInA(objIds.followedBy, data);
            var newUnfollowedBy = getUniqueIdsInA(data, objIds.followedBy);
            console.log('determining new followed by' + newFollowedBy.length);
            console.log('determining new unfollowed by' + newUnfollowedBy.length);
            if (newFollowedBy.length > 0) {
              database.upsertRelationships(clientId, newFollowedBy, { followed_by: true })
              .then((result) => {

              });
            }
            if (newUnfollowedBy.length > 0) {
              database.upsertRelationships(clientId, newUnfollowedBy, { followed_by: false })
              .then((result) => {

              });
            }
          })
          return 'ok';
        })
      return objIds;
    })
    res.send('done');
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
    .then((result) => {
      twitter.getFollowedBy({ user_id: clientId })
      .then((data) => {
        followedByIds = data;
        console.log('followed by: ' + followedByIds.length);
        return 'ok';
      })
      .then((result) => {
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
