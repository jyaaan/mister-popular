/*
ideas area!
hot spots
  - enter buckets that will get a higher number of actions upon distribution
  - off by default. can be set manually or randomly, given number of hot spots
*/
var scheduler = require('node-schedule');

function Schedule(type, clientId, params) {
  this.type = type;
  this.buckets = initBuckets();
  this.clientId = clientId;
  this.startTime = params.startTime;
  this.stopTime = params.stopTime;
  this.targetActions = params.targetActions; // this has to be less than resolution * active buckets
  this.actionSchedule = [];
  this.schedulePos = 0;
  this.resolution = params.resolution; // this shows how many actions can be done in a 15 min interval
  this.minInterval = 3; // in seconds, it's 900 / resolution
}

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

function timeToBucket(time) {
  var hour = time.getHours();
  var quarter = Math.floor(time.getMinutes() / 15);
  return (hour * 4 + quarter);
}

function bucketToTime(bucketIndex) {
  var hours = Math.floor(bucketIndex / 4);
  var minutes = (bucketIndex % 4) * 15;
  var newDate = new Date(Date.now());
  return new Date(newDate.getFullYear(), newDate.getMonth(), newDate.getDate(), hours, minutes, 0);
}

function getScheduleTime(baseTime, seconds) {
  return new Date(baseTime.getTime() + (seconds * 1000));
}

Schedule.prototype.populateBuckets = function () {
  this.buckets.forEach((bucket) => {
    var actionsInBucket = bucket.quantity;
    var intervals = [];
    for (var i = 0; i <= actionsInBucket; i++) { // extra interval necessary to keep final action from always being at end
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
  console.log(thisActionDate);

  function cb() {
    action();
    this.incrementAction();
    this.scheduleNextAction(action);
  }

  if (this.schedulePos !== -1){
    scheduler.scheduleJob(nextActionDate, cb.bind(this));
  }
}

exports.Schedule = Schedule;
