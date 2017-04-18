/*
EXCEPT: following except followers = users not following back

functions:
initialize all users (FIRST TIME ONLY)
  -get all following
  -get all followedby
  -combine two and splice duplicates into all userids
  -insert these ids into users table
  -for all userids, create relationships
    -for each, check to see if userId is is in following and followedby, update accordingly
    -if followed by, set followedby to true
    -if following, set following to true and date to today

15 minute refresh
  -get all following
    -check for changes against user list.
      -if a person is new, add to user list
      -then create relationship
        -following = true
        -set timestamp to now
      -create log of action
  -get all followedby
    -check for changes against user list
      -if a person is new, add to user list
      -then create relationship
        -followedby = true
      -create log of action
  -compare newly created list of following (A) against database query of following (B)
    -those in A but not in B,
      -update or create relationship
        -following = true
        -set following to time now
      -create log of action
    -those in B but not in A,
      -update relationship
        -following = false
        -unfollowed = true
      -create log of action
  -compare newly created list of followedby(A) against database query of followedby (B)
    -those in A but not in B
      -update or create relationship
        -followedby = true
      -create log of action
    -those in B but not in A
      -update or create relationship
        -followedby = false;

unfollow someone
  -on action, get one id to unfollow
  -if there  isn't anything, do nothing for this turn
  -if there is an id, lock that relationship and attempt to unfollow that person
  -on success, update relationship
    -following = false;
    -unfollowed = true;
    -locked = false;
  -log action;

get unfollow userid
  -query relationships table for a user for client where:
    -client_id = clientId;
    -followed_by = false;
    -following = true;
    -follow_timestamp < now - 72 hours
    -locked = false
  -return user id of match

*/

var knex = require('knex')({
  client: 'postgresql',
  connection: {
    user: 'jyaaan',
    database: 'mister-popular'
  }
});

function Database() {

}

Database.prototype.clearTable = function (tableName) {
  return knex(tableName).truncate();
}

Database.prototype.getUserIds = function (tableName) {
  return knex(tableName).select('id');
}

Database.prototype.getQueryUserIds = function (tableName, params) {

}

Database.prototype.getNextUnfollow = function (clientId) {

}

Database.prototype.lockRelationship = function (clientId, userId) {

}

Database.prototype.logAction = function () {

}

Database.prototype.createRelationship = function (clientId, userId) {

}

Database.prototype.updateRelationship = function () {

}

Database.prototype.checkForChanges = function () {

}

Database.prototype.insertObjects = function (tableName, arrObjData) {
  return knex.transaction((trx) => {
    return knex.batchInsert(tableName, arrObjData)
      .transacting(trx)
      .then(trx.commit)
      .catch(trx.rollback);
  })
    .then(() => {
      console.log('transaction successful')
      return 'transaction successful';
    })
    .catch(() => {
      console.log('transaction failed');
      return 'transaction failed';
    });
}

exports.Database = Database;


/*
getting all users belonging to client who can be unfollowed

SELECT userId
FROM relationships
WHERE (clientId = clientId
AND   follow_date <= today - waitInterval
AND   unfollowed = false);

what to do when you unfollow someone
UPDATE unfollowed
FROM
*/
