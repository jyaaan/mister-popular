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

Database.prototype.insertUserIds = function (tableName, arrObjData) {
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
