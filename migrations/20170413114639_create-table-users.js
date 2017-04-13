
exports.up = function(knex, Promise) {
  const query = knex.schema.createTable('users', table => {
    table.string('id');
  });

  return query;
};

exports.down = function(knex, Promise) {
  const query = knex.schema.dropTable('users');

  return query;
};
