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

function Schedule(type, clientId, params) {
  this.type = type;
  this.buckets = initBuckets();
  this.clientId = clientId;
  this.startTime = params.startTime;
  this.endTime = params.endTime;
  this.targetActions = params.targetActions;
  this.actionSchedule = [];
  this.activeBuckets = [];
  this.resolution = params.resolution; // this shows how many actions can be done in a 15 min interval
  this.minInterval = 3; // in seconds
}

function initBuckets() {
  // change this so that it's just bucket[absolute_quarter]
  var objBuckets = [];
  for (var i = 0; i < 24; i++) {
    var bucket = new Object();
    bucket.hour = i;
    bucket.quarter = [];
    for (var j = 0; j < 4; j++) {
      bucket.quarter[j] = new Object();
      bucket.quarter[j].quantity = 0;
    }
    objBuckets.push(bucket);
  }
  return objBuckets;
}

function timeToBucket(time) {
  var hour = time.getHours();
  var quarter = Math.floor(time.getMinutes() / 15);
  console.log('hour: ' + hour + ' quarter: ' + quarter);
  // maybe experiment with using absolute quarter timing. that way it's all in one array
  console.log('absolute quarter: ' + (hour * 4 + quarter));
}

function bucketToTime(bucketIndex) {
  var hours = Math.floor(bucketIndex / 4);
  var minutes = (bucketIndex % 4) * 15;
  console.log('hours: ' + hours + ', minutes: ' + minutes);
}

// need to get active buckets from start/end times\
// - convert time into bucket coordinate
// - count buckets inclusively from start to end bucket
// - save number as active buckets

// need to know how many actions to be done in the day
// need to know max actions per bucket
// need to randomly distribute actions into bucket


Schedule.prototype.assignBucketQuantities() {
  // get the number of buckets included in time range
  var numberOfBuckets;
  // get the number of actions to be done
  var actionsToBeDone;
  // set up function so that random placement will populate buckets
  // with ceiling values for each bucket.

  for (var i = 0; var i < actionsToBeDone; i++) {
    do {
      var targetBucket = Math.floor(Math.random() * numberOfBuckets);

    } while (bucket.quarter[targetBucket].quantity < this.resolution)
    // increment quantity of actions in this bucket
    buckets.quarter[targetBucket].quantity++;
  }

}

Schedule.prototype.populateBuckets() {
  // turn this into a pure function some day
  // go through each bucket and take the quantity and turn them into dates

  // for each bucket
  this.buckets.forEach((bucket) => {
    var actionsInBucket = bucket.quantity;
    var workingTime = 15 * 60 - this.minInterval * actionsInBucket;
    var intervals = [];
    for (var i = 0; i < actionsInBucket; i++) {
      intervals.push(Math.random());
    }
    var sumRandom = intervals.reduce((tot, val) => { return tot + val; });
    var bucket.actions = [];
    for (var i = 0; i < actionsInBucket; i++) {
      bucket.actions[i] = intervals[i] * workingTime / sumRandom;
    }
  });
  // now each bucket should have a list of actions that should be in seconds from the start of the bucket
}

Schedule.prototype.generateActionSchedule() {
  // go through each bucket, convert actions in buckets to time and push to Schedule
  // convert bucket number into hours + minutes and then add the content of buckets[i].actions[]
  var schedule = this.buckets.filter();
}

function getNextAction() {
  // this will get the
  // each action object will have a boolean to determine if it's been read

  // set bool to read

}

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
