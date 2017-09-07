/*
Scheduler is used to schedule the day's follow and unfollow events.
Since twitter appears to monitor usage on 15-minute intervals, Mr. Pop breaks the day into
96, 15-minute "buckets" (indexed at 0).

The scheduler takes in a start and stop time (GMT) and the number of actions to take.
It will then randomly distribute these actions into the buckets, working under two limits: resolution and minInterval

Resolution will limit the number of actions per bucket while minInterval denotes the minimum spacing between actions.

Follow and unfollow actions are scheduled separately in their own actionSchedules.

actionSchedules do not directly perform the action! the npm package node schedule is what's actually performing the action at
a future date. The actionSchedule is only used as reference to schedule future actions using node schedule.

App also checks followers and following  to see if people followed back.
*/
var scheduler = require('node-schedule');

function Schedule(type, clientId, params) {
  this.type = type;
  this.buckets = initBuckets(); // results in an array of 96 buckets indexed at 0
  this.clientId = clientId;
  this.startTime = params.startTime; // Time of day to start actions. Can be placed in the past
  this.stopTime = params.stopTime; // Time of day to stop actions. Must be in future.
  this.targetActions = params.targetActions; // this has to be less than resolution * active buckets
  this.actionSchedule = []; // 
  this.schedulePos = 0;
  this.resolution = params.resolution; // this shows how many actions can be done in a 15 min interval
  this.minInterval = 3; // in seconds
}


// Method to iterate through actions in schedule
Schedule.prototype.incrementAction = function () {
  this.schedulePos = this.getNextActionPos();
}

function initBuckets() {
  var objBuckets = [];
  for (var i = 0; i < 96; i++) {
    var bucket = new Object();
    bucket.absQuarter = i;
    bucket.quantity = 0;
    bucket.actions = [];
    objBuckets.push(bucket);
  }
  return objBuckets;
}

Schedule.prototype.assignBucketQuantities = function () {
  var numberOfBuckets = getBucketQuantity(this.startTime, this.stopTime);
  var startBucket = timeToBucket(this.startTime);
  var actionsToBeDone = this.targetActions;
  for (var i = 0; i < actionsToBeDone; i++) {
    var targetBucket;
    do {
      targetBucket = startBucket + Math.floor(Math.random() * numberOfBuckets);
    } while (this.buckets[targetBucket].quantity >= this.resolution)
    this.buckets[targetBucket].quantity++;
  }
}

function getBucketQuantity(startTime, stopTime) {
  return timeToBucket(stopTime) - timeToBucket(startTime);
}

// returns index number of bucket correlating to input time.
function timeToBucket(time) {
  var hour = time.getHours();
  var quarter = Math.floor(time.getMinutes() / 15);
  return (hour * 4 + quarter);
}

// returns time when bucket with provided index number will become active.
function bucketToTime(bucketIndex) {
  var hours = Math.floor(bucketIndex / 4);
  var minutes = (bucketIndex % 4) * 15;
  var newDate = new Date(Date.now());
  return new Date(newDate.getFullYear(), newDate.getMonth(), newDate.getDate(), hours, minutes, 0);
}

// returns time to schedule specified action
function getScheduleTime(baseTime, seconds) {
  return new Date(baseTime.getTime() + (seconds * 1000));
}

// randomly fills buckets with actions
Schedule.prototype.populateBuckets = function () {
  this.buckets.forEach((bucket) => {
    var actionsInBucket = bucket.quantity;
    var intervals = [];
    for (var i = 0; i < actionsInBucket + 1; i++) { // extra interval necessary to keep final action from always being at end
      intervals.push(Math.random());
    }

    var workingTime = 15 * 60 - this.minInterval * actionsInBucket; // in seconds
    var sumRandom = intervals.reduce((tot, val) => { return tot + val; });
    var actions = [];
    for (var i = 0; i < actionsInBucket; i++) {
      actions[i] = intervals[i] * workingTime / sumRandom + this.minInterval;
    }

    var absActions = [];
    actions.reduce((tot, val, index) => {
      return absActions[index] = (tot + val);
    }, 0);

    bucket.actions = absActions;
  });
}

// combines all buckets and the actions they contain into a single array of action objects called the actionSchedule
Schedule.prototype.generateActionPlan = function () {
  var plan = [];
  this.buckets.forEach((bucket) => {
    if (bucket.quantity > 0) {
      var baseTime = bucketToTime(bucket.absQuarter);
      bucket.actions.map((action) => {
        plan.push(getScheduleTime(baseTime, action)); // adding action seconds to the time returned as date object
      });
    }
  })
  this.actionSchedule = plan;
}

// returns index number of next action in queue. -1 if none remaining
Schedule.prototype.getNextActionPos = function () {
  var now = new Date(Date.now());
  if (this.schedulePos != -1) {
    for (var i = this.schedulePos; i < this.actionSchedule.length; i++) {
      if (this.actionSchedule[i] > now) {
        return i;
      }
    }
    return -1;
  }
}


Schedule.prototype.scheduleNextAction = function (action) {
  var nextActionDate = this.actionSchedule[this.schedulePos];
  console.log('scheduling next');
  console.log(nextActionDate);

  function cb() {
    action();
    this.incrementAction();
    this.scheduleNextAction(action);
  }

  if (this.schedulePos !== -1){
    scheduler.scheduleJob(nextActionDate, cb.bind(this));
  }
}

Schedule.prototype.scheduleRecurring = function (interval, action) {
  var nextActionDate = new Date(getNextRecurring(interval));
  console.log('scheduling next recurring');
  console.log(nextActionDate);
  function cb() {
    action();
    this.scheduleRecurring(interval, action);
  }
  scheduler.scheduleJob(nextActionDate, cb.bind(this));
}

function getNextRecurring(interval) {
  // get time now.
  // push to previous 15. so if it's :07, go back to :00, if it's :19, go back to 15 etc
  var timeNow = new Date(Date.now());
  var minuteNow = Math.floor(timeNow.getMinutes());
  var prevMarker = Math.floor(minuteNow / interval) * interval;
  var timeNext = new Date(timeNow.setMinutes(prevMarker + interval));
  timeNext = timeNext.setSeconds(0);
  return timeNext;
}
exports.Schedule = Schedule;