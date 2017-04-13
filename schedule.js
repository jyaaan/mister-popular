function Schedule(type) {
  this.type = type;
  this.buckets = [];

}


function initBuckets() {
  var objBuckets = [];
  for (var i = 0; i < 24; i++) {
    var bucket = new Object();
    bucket.hour = i;
    bucket.quarter = [];
    for (var j = 1; j <= 4; j++) {
      bucket.quarter[j] = new Object();
    }
    objBuckets.push(bucket);
  }
  return objBuckets;
}

exports.Schedule = Schedule;
