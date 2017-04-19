
exports.up = function(knex, Promise) {
  const query = knex.schema.createTable('log', table => {
    table.string('client_id');
    table.string('user_id');
    table.string('action_type');
    table.timestamp('timestamp');
  });

  return query;
};

exports.down = function(knex, Promise) {
  const query = knex.schema.dropTable('log');

  return query;
};
