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
var testSchedule = new Schedule('follow', 'john', {
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
          console.log('successfully unfollowed: ' + userId);
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
    })
}
