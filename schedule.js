/*
ideas area!
hot spots
  - enter buckets that will get a higher number of actions upon distribution
  - off by default. can be set manually or randomly, given number of hot spots

PROCEDURE:
initialize buckets
populate buckets with actions at seconds after beginning of buckets
turn buckets into single array of schedule dates
find next schedule date (will be set to pending)
schedule action for pending date and buffer date
once scheduled action takes place, set previous buffer action to pending action and schedule new buffer action

*/
var scheduler = require('node-schedule');

var dateToday = new Date(Date.now());
var yearToday = dateToday.getFullYear();
var monthToday = dateToday.getMonth();
var dayToday = dateToday.getDate();
var testSchedule = new Schedule('follow', 'john', { startTime: new Date(yearToday, monthToday, dayToday, 16, 0, 0), stopTime: new Date(yearToday, monthToday, dayToday, 22, 30, 0), targetActions: 1000, resolution: 50 });

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
    var workingTime = 15 * 60 - this.minInterval * actionsInBucket; // in seconds
    var intervals = [];

    for (var i = 0; i <= actionsInBucket; i++) { // extra interval necessary to keep final action from always being at end
      intervals.push(Math.random());
    }

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

Schedule.prototype.scheduleActions = function (functionToBeDone) {
  console.log('scheduling...');
  if (this.schedulePos == -1) return console.log('not in range');
  var thisActionDate = this.actionSchedule[this.schedulePos];
  scheduler.scheduleJob(thisActionDate, () => {
    functionToBeDone();
    this.incrementAction();

    var schedulePromise = new Promise((resolve, reject) => {
      function cb(functionToBeDone, index) {
        if (index == -1) {
          resolve('done');
        } else {
          functionToBeDone();
          this.scheduleNextAction(functionToBeDone, cb.bind(this));
        }
      }
      this.scheduleNextAction(functionToBeDone, cb.bind(this));
    })
      .then((message) => {
        console.log(message);
        console.log('blip');
      });
  });

  // for (var i = this.getNextActionPos(); i < this.actionSchedule.length; i++) {
  //   var thisActionDate = this.actionSchedule[i];
  //   console.log('next action at: ' + thisActionDate);
  //   var nextAction = new Promise((resolve, reject) => {
  //     resolve(scheduler.scheduleJob(thisActionDate, functionToBeDone));
  //   })
  //     .then((job) => {
  //       console.log('successful loop for index: ' + i);
  //     })
  //     .catch(() => {
  //       console.log('unsuccessful loop');
  //     });
  // }

}
// you have to schedule a refresh at midnight of every day in time zone

Schedule.prototype.scheduleNextAction = function (functionToBeDone, cb) {
  var thisActionDate = this.actionSchedule[this.schedulePos];
  console.log('scheduling next');
  console.log(thisActionDate);
  scheduler.scheduleJob(thisActionDate, () => {
    functionToBeDone();
    this.incrementAction();
    cb(functionToBeDone, this.schedulePos);
  });
}

testSchedule.assignBucketQuantities();
testSchedule.populateBuckets();
testSchedule.generateActionPlan();
testSchedule.schedulePos = testSchedule.getNextActionPos();
console.log(testSchedule.actionSchedule[testSchedule.schedulePos]);
var mission = testSchedule.scheduleActions(() => {
  console.log('blop');
  console.log(testSchedule.schedulePos);
});


exports.Schedule = Schedule;

/*
create buckets > populate buckets with spacing > turn all buckets into array of date objects.
there will be an array of times as date objects
initial will look to find next action

randomizer:
take 15 mins - total_agg_min_time = what we have to work with
split ^ into actions_in_bucket random parts.

how do you break something into pieces that add up to a specific total?
take value and split into action_in_bucket parts. use this as ratio.

if you have x events, you need x + 1 random numbers, each with a minimum value of z
the working_time you have is total_time (15 minutes in our case) - (z * (x+1))
find the value of x + 1 random values of 0 to 1, and the sum should be made equal to working_time
value_to_add(q) = ( value / sum_of_randoms ) = ( q / working_time )
so
q = ( value * working_time / sum_of_randoms )
the random value will be made proportional to working_time and added to z
this is the spacing, store these values into an array
event[n] will happen AFTER interval[n]

function will always schedule action function and look for next action to schedule
*/
