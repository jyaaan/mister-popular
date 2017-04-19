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
  return knex('relationships')
    .where('client_id', clientId)
    .andWhere('following', true)
    .andWhere('followed_by', false)
    .andWhere('locked', false)
    .andWhere('last_follow_ts', '<', new Date(Date.now()).toISOString())
    .select('user_id')
    .limit(1)
}

Database.prototype.lockRelationship = function (clientId, userId) {
  return knex('relationships')
    .where('client_id', clientId)
    .andWhere('user_id', userId)
    .update({
      locked: true
    })
}

Database.prototype.unlockRelationship = function (clientId, userId) {
  return knex('relationships')
    .where('client_id', clientId)
    .andWhere('user_id', userId)
    .update({
      locked: false
    })
}

Database.prototype.logAction = function (clientId, userId, type) {
  return knex('log')
    insert({ client_id: clientId, user_id: userId, action_type: type,
    timestamp: new Date(Date.now()).toISOString() })
}

Database.prototype.createRelationship = function (clientId, userId) {

}

Database.prototype.updateUnfollow = function (clientId, userId) {
  return knex('relationships')
    .where('client_id', clientId)
    .andWhere('user_id', userId)
    .update({
      unfollowed: true,
      following: false
    })
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
