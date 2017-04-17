/*
EXCEPT: following except followers = users not following back
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

Database.prototype.refreshUnfollowList = function (clientId) {

}

Database.prototype.logAction = function () {

}

Database.prototype.createRelationship = function () {

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
      console.log('transaction successful');
    })
    .catch(() => {
      console.log('transaction failed');
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
