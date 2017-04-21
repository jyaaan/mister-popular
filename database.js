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
  return new Promise((resolve, reject) => {
    knex(tableName).select('id')
      .then((result) => {
        var ids = result.map((obj) => {
          return Number(obj.id);
        })
        resolve(ids);
      })
  });
}

Database.prototype.getFollowedBy = function (clientId) {
  return new Promise((resolve, reject) => {
    knex('relationships')
      .select('user_id')
      .where('client_id', clientId)
      .andWhere('followed_by', true)
      .then((result) => {
        var ids = result.map((obj) => {
          return Number(obj.user_id);
        })
        resolve(ids);
      })
  })
}

Database.prototype.getFollowing = function (clientId) {
  return new Promise((resolve, reject) => {
    knex('relationships')
      .select('user_id')
      .where('client_id', clientId)
      .andWhere('following', true)
      .then((result) => {
        var ids = result.map((obj) => {
          return Number(obj.user_id);
        })
        resolve(ids);
      })
  })
}

Database.prototype.getQueryUserIds = function (tableName, params) {

}

Database.prototype.getNextUnfollow = function (clientId) {
  return knex('relationships')
    .whereNot('user_id', 'like', '%00')
    .andWhere('client_id', clientId)
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
    .insert({ client_id: clientId, user_id: userId, action_type: type,
    timestamp: new Date(Date.now()).toISOString() });
}

// rewrite to log on call
Database.prototype.createRelationship = function (clientId, userId, params) {
  params.client_id = clientId;
  params.user_id = userId;
  if (typeof params.following != undefined) {
    if (params.following) {
      params.last_follow_ts = new Date(Date.now()).toISOString();
    }
  }
  return knex('relationships')
    .insert(params)
}

// rewrite to log on call
Database.prototype.updateRelationship = function (clientId, userId, params) {
  if (typeof params.following != undefined) {
    if (params.following) {
      params.last_follow_ts = new Date(Date.now()).toISOString();
    }
  }
  return knex('relationships')
    .where('client_id', clientId)
    .andWhere('user_id', userId)
    .update(params)
}

// rewrite to log on call OBSOLETE?
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

Database.prototype.upsertUser = function (userId) {
  return new Promise((resolve, reject) => {
    knex('users')
      .count('*')
      .andWhere('id', userId)
      .then((result) => {
        var count = Number(result[0].count);
        if (count > 0) {
          knex('users')
            .insert({ id: userId })
        }
      })
      .then((result) => {
        resolve(result);
      })
  })
}

Database.prototype.upsertRelationships = function (clientId, userIds, params) {
  return new Promise((resolve, reject) => {
    userIds.forEach((userId) => {
      knex('relationships').count('*').where('client_id', clientId).andWhere('user_id', userId)
      .then((result) => {
        var count = Number(result[0].count);
        if (count > 0) {
          this.updateRelationship(clientId, userId, params)
          .then((result) => {
          })
        } else {
          this.createRelationship(clientId, userId, params)
          .then((result) => {

          })
        }
        return 'ok';
      })
      .then((message) => {
        if (typeof params.following != 'undefined') {
          var type = params.following ? 'following' : 'unfollowing'
        } else {
          var type = params.followed_by ? 'followed by' : 'unfollowed by';
        }
        this.logAction(clientId, userId, type)
        .then((result) => {
          console.log('logged');
          resolve('ok');
        })
      })
    })
  })
}

exports.Database = Database;
