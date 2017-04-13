
exports.up = function(knex, Promise) {
  const query = knex.schema.createTable('clients', table => {
    table.string('id');
    table.string('name');
    table.timestamp('last_refresh');
  });

  return query;
};

exports.down = function(knex, Promise) {
  const query = knex.schema.dropTable('clients');

  return query;
};
