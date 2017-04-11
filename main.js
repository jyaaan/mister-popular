var express = require('express');
var app = express();

var Twitter = require('./twitter-client').Twitter;
var twitter = new Twitter();

function error(err, res, bod) {
  console.log('error: ' + err);
}

function success(data) {
  var objTwitterBody = data;
  console.log(objTwitterBody.users);
}

app.get('/retweet', (req, res) => {
  console.log(twitter);
  twitter.getReTweetsOfMe({ count: '1' }, error, success);
});

app.get('/following', (req, res) => {
  twitter.getFollowing({ count: '1' }, error, success);
})

app.get('/settings', (req, res) => {
  console.log('settings');
  twitter.getAccountSettings({}, error, success);
})

app.get('/follow', (req, res) => {
  console.log('follow');
  twitter.postFollow({ user_id: '851576666941825024' }, error, success);
})

app.listen(5760, () => {
  console.log('listening to port 5760');
})
