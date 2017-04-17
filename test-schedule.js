var Schedule = require('./schedule').Schedule;

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
  console.log('blop');
  console.log((testSchedule.schedulePos + 1) + ' out of ' + testSchedule.actionSchedule.length);
});
