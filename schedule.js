/*
ideas area!
hot spots
  - enter buckets that will get a higher number of actions upon distribution
  - off by default. can be set manually or randomly, given number of hot spots
time zone specification

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
var testSchedule = new Schedule('follow', 'john', { startTime: new Date(yearToday, monthToday, dayToday, 9, 0, 0), stopTime: new Date(yearToday, monthToday, dayToday, 17, 30, 0), targetActions: 500, resolution: 50 });

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
  this.minInterval = 3; // in seconds
  this.bucketQuantity = getBucketQuantity(this.startTime, this.stopTime);
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
  // turn this into a pure function some day
  // go through each bucket and take the quantity and turn them into dates
  this.buckets.forEach((bucket) => {
    var actionsInBucket = bucket.quantity;
    var workingTime = 15 * 60 - this.minInterval * actionsInBucket; // in seconds
    var intervals = [];
    for (var i = 0; i <= actionsInBucket; i++) { // extra interval necessary to keep final action from always being at end
      intervals.push(Math.random());
    }
    // intervals.sort((a, b) => {
    //   return parseFloat(a) - parseFloat(b);
    // });
    var sumRandom = intervals.reduce((tot, val) => { return tot + val; });
    var actions = [];
    for (var i = 0; i < actionsInBucket; i++) {
      actions[i] = intervals[i] * workingTime / sumRandom + 3; // replace with min interval
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
  // now we can step through the array returned here to schedule stuff
}

testSchedule.assignBucketQuantities();
testSchedule.populateBuckets();
testSchedule.generateActionPlan();

Schedule.prototype.getNextAction = function () {
  // this will get the index position of the plan
  // each action object will have a boolean to determine if it's been read
  var now = new Date(Date.now());
  // this might not work
  var futureActions = this.plan.filter((action) => {
    return action > now;
  })
  if (futureActions.length > 0) {
    return
  }
  // set bool to read
}

Schedule.prototype.scheduleNextAction = function (functionToBeDone, params) {
  // whenever this is run, it will check to see if there is a future action to schedule
  // if there is, schedule it and return the schedule object.

  // function to get the next action
  return scheduler.scheduleJob( , () => {
    //function to mark this action as done
    this.scheduleNextAction();
    functionToBeDone();
  })
}
// you have to schedule a refresh at midnight of every day in time zone

// you need a function to initialize everything to put into the daily schedule

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
