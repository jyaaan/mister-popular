var Schedule = require('./schedule').Schedule;

var Twitter = require('./twitter-client').Twitter;
var twitter = new Twitter();

var Database = require('./database').Database;
var database = new Database();

var tempFollowingDate = new Date(2017, 3, 15, 9, 0, 0);

var dateToday = new Date(Date.now());
var yearToday = dateToday.getFullYear();
var monthToday = dateToday.getMonth();
var dayToday = dateToday.getDate();
var testSchedule = new Schedule('unfollow', 'john', {
  startTime: new Date(yearToday, monthToday, dayToday, 9, 0, 0),
  stopTime: new Date(yearToday, monthToday, dayToday, 17, 30, 0),
  targetActions: 600, resolution: 50
});

testSchedule.assignBucketQuantities();
testSchedule.populateBuckets();
testSchedule.generateActionPlan();
testSchedule.schedulePos = testSchedule.getNextActionPos();
testSchedule.scheduleNextAction(() => {
  unfollowNext();
  console.log('unfollowing stats:');
  console.log((testSchedule.schedulePos + 1) + ' out of ' + testSchedule.actionSchedule.length);

});

var testFollowSchedule = new Schedule('Follow', 'john', {
  startTime: new Date(yearToday, monthToday, dayToday, 9, 0, 0),
  stopTime: new Date(yearToday, monthToday, dayToday, 17, 30, 0),
  targetActions: 500, resolution: 50
});
testFollowSchedule.assignBucketQuantities();
testFollowSchedule.populateBuckets();
testFollowSchedule.generateActionPlan();
testFollowSchedule.schedulePos = testFollowSchedule.getNextActionPos();
testFollowSchedule.scheduleNextAction(() => {
  checkPhil(twitter)
    .then((result) => {
      followNext(twitter)
        .then((result) => {
        })
    })
  console.log('following stats:');
  console.log((testFollowSchedule.schedulePos + 1) + ' out of ' + testFollowSchedule.actionSchedule.length);
});
// THIS FUNCTION TO BE ADDED INTO MAIN WHEN READY
function unfollowNext() {
  database.getNextUnfollow(twitter.clientId)
    .then((result) => {
      if(typeof result[0].user_id != undefined){
        var userId = result[0].user_id;
        database.lockRelationship(twitter.clientId, userId)
        .then((result) => {
          console.log('locked');
          return userId;
        })
        .then((userId) => {
          twitter.postUnfollow({ user_id: userId })
          .then((result) => {
            database.logAction(twitter.clientId, userId, 'unfollow')
            .then((result) => {
              console.log(result);
              console.log('successfully unfollowed: ' + userId);
            })
          })
          return userId;
        })
        .then((userId) => {
          database.updateUnfollow(twitter.clientId, userId)
          .then((result) => {
            console.log('unfollowed');
            database.unlockRelationship(twitter.clientId, userId)
            .then((result) => {
              console.log('unlocked');
            })
          })
          return 'complete';
        })
      } else {
        return 'no one to unfollow';
      }
    })
}

function followNext(twit) {
  var nextFollowId = [];
  nextFollowId.push(getNextFollow(twit));
  return new Promise((resolve, reject) => {
    if (nextFollowId[0] != -1) {
      return twitter.postFollow({ user_id: nextFollowId[0] })
      .then((result) => {
        return database.upsertUser(nextFollowId[0])
      })
      .then((result) => {
        return database.upsertRelationships(twit.clientId, nextFollowId, { following: true })
        resolve('added');
      })
    } else {
      resolve('nothing in list');
    }

  })
}

function getNextFollow(twit) {
  if (typeof twit.followList[0] == undefined) return -1;
  var id = twit.followList[0];
  twit.followList.splice(0, 1);
  return id;
}

function checkPhil(twit) {
  if (twitter.queryTerms.length == 0) return;
  return new  Promise((resolve, reject) => {
    if (twit.followList.length < 50) {
      buildFollowList(twit)
      .then((result) => {
        console.log('rebuilding list' + result);
        resolve('phil');
      })
    } else {
      resolve('done');
    }
  })
}

function buildFollowList(objTwitter) {
  return new Promise((resolve, reject) => {
    function cb(twit) {
      console.log('term to query: ' + twit.queryTerms[twit.queryPos]);
      twit.getSearch({ q: twit.queryTerms[twit.queryPos] })
      .then((result) => {
        var searchIds = [];
        result.statuses.forEach((status) => {
          if(!(status.user.following || status.user.follow_request_sent)) {
            var thisId = status.user.id.toString();
            if (thisId.substr(thisId.length - 2) != '00') {
              // console.log('pass');
              searchIds.push(status.user.id);
            }
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

function getUniqueIdsInA(arrA, arrB) {
  return arrA.filter((itemA) => {
    return arrB.findIndex((itemB) => {
      return itemB === itemA;
    }) == -1;
  })
}
