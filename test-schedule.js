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
  targetActions: 1000, resolution: 50
});

testSchedule.assignBucketQuantities();
testSchedule.populateBuckets();
testSchedule.generateActionPlan();
testSchedule.schedulePos = testSchedule.getNextActionPos();
testSchedule.scheduleNextAction(() => {
  unfollowNext();
  console.log((testSchedule.schedulePos + 1) + ' out of ' + testSchedule.actionSchedule.length);

});

// var testFollowSchedule = new Schedule('Follow', 'john', {
//   startTime: new Date(yearToday, monthToday, dayToday, 9, 0, 0),
//   stopTime: new Date(yearToday, monthToday, dayToday, 17, 30, 0),
//   targetActions: 1000, resolution: 50
// });
// testFollowSchedule.assignBucketQuantities();
// testFollowSchedule.populateBuckets();
// testFollowSchedule.generateActionPlan();
// testFollowSchedule.schedulePos = testFollowSchedule.getNextActionPos();
// testFollowSchedule.scheduleNextAction(() => {
//   // check follow list quantity. fill if under 50
//   // take next id, splice out from array
//   // follow that id, create user if doesn't exist, create relationship if doesn't exist
//   // log the action
//   console.log((testFollowSchedule.schedulePos + 1) + ' out of ' + testFollowSchedule.actionSchedule.length);
//
// });
// THIS FUNCTION TO BE ADDED INTO MAIN WHEN READY
function unfollowNext() {
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
    .then((message) => {
    })
}

// function followNext(twit) {
//   var nextFollowId = getNextFollow(twit);
//   twitter.postFollow({ user_id: nextFollowId })
//     .then((result) => {
//       // upsert user
//     })
//     .then((result) => {
//       // upsert relationship // this should log
//     })
// }
//
// function getNextFollow(twit) {
//   var id = twit.followList[0];
//   twit.followList.splice(0, 1);
//   return id;
// }
