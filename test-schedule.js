var Schedule = require('./schedule').Schedule;

var dateToday = new Date(Date.now());
var yearToday = dateToday.getFullYear();
var monthToday = dateToday.getMonth();
var dayToday = dateToday.getDate();
var testSchedule = new Schedule('follow', 'john', {
  startTime: new Date(yearToday, monthToday, dayToday, 11, 0, 0),
  stopTime: new Date(yearToday, monthToday, dayToday, 16, 30, 0),
  targetActions: 1000, resolution: 50
});

testSchedule.assignBucketQuantities();
testSchedule.populateBuckets();
testSchedule.generateActionPlan();
testSchedule.schedulePos = testSchedule.getNextActionPos();
console.log(testSchedule.actionSchedule[testSchedule.schedulePos]);
var mission = testSchedule.scheduleActions(() => {
  console.log('blop');
  console.log(testSchedule.schedulePos + ' out of ' + testSchedule.actionSchedule.length);
});
