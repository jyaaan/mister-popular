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
          return obj.id;
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
          return obj.user_id;
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
          return obj.user_id;
        })
        resolve(ids);
      })
  })
}

Database.prototype.getNextUnfollow = function (clientId) {
  var dateNow = new Date(Date.now());
  var datePrev = new Date(dateNow.setDate(dateNow.getDate() - 3));
  return knex('relationships')
    .andWhere('client_id', clientId)
    .andWhere('following', true)
    .andWhere('followed_by', false)
    .andWhere('locked', false)
    .andWhere('last_follow_ts', '<', datePrev.toISOString())
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

Database.prototype.createRelationship = function (clientId, userId, params) {
  const objParams = Object.assign({}, params);
  objParams.client_id = clientId;
  objParams.user_id = userId;
  objParams.locked = false;
  if (typeof objParams.following != 'undefined') {
    if (objParams.following) {
      objParams.last_follow_ts = new Date(Date.now()).toISOString();
    }
  }
  console.log('attempting relationship creation of user: ' + userId + ' params: ' + objParams);
  return knex('relationships')
    .insert(objParams)
}

Database.prototype.updateRelationship = function (clientId, userId, params) {
  const objParams = Object.assign({}, params);
  if (typeof objParams.following != 'undefined') {
    if (objParams.following) {
      objParams.last_follow_ts = new Date(Date.now()).toISOString();
    }
  }
  console.log('updating: ' + userId + ' with params: ' + objParams);
  return knex('relationships')
    .where('client_id', clientId)
    .andWhere('user_id', userId)
    .update(objParams)
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

Database.prototype.upsertRelationships = function (clientId, userIds, params, pos) {
  let thisPos = pos;
  let thisUserId = userIds[thisPos];
  let db = this;
  return new Promise((resolve, reject) => {
    knex('relationships').count('*').where('client_id', clientId).andWhere('user_id', thisUserId)
      .then((result) => {
        let count = Number(result[0].count);
        console.log('relationships count: ' + count);
        if (count > 0) {
          this.updateRelationship(clientId, thisUserId, params)
            .then((result) => {
              console.log('relationship updated for ' + thisUserId);
            })
            .catch(() => {
              console.error('error when updating relationship');
            })
        } else {
          this.createRelationship(clientId, thisUserId, params)
            .then((result) => {
              console.log('relationship created for ' + thisUserId);
            })
        }
        return 'upsert complete';
      })
      .then((message) => {
        if (typeof params.following != 'undefined') {
          var type = params.following ? 'follow' : 'unfollow'
        } else {
          var type = params.followed_by ? 'followed by' : 'unfollowed by';
        }
        this.logAction(clientId, thisUserId, type)
          .then((result) => {
            console.log('logged');
            if (thisPos+ 1 < userIds.length) {
              return resolve(db.upsertRelationships(clientId, userIds, params, thisPos + 1));
            } else {
              resolve('upsert complete ended');
            }
            return 'upsert logged';
          })
        return 'this is sloppy';
      })
      .catch((err) => {
        console.error('upsert error-c');
        reject(err);
      })
    })
}

exports.Database = Database;
