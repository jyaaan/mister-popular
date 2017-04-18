exports.up = function(knex, Promise) {
  const query = knex.schema.createTable('relationships', table => {
    table.string('client_id');
    table.string('user_id');
    table.boolean('following');
    table.timestamp('last_follow_ts');
    table.boolean('followed_by');
    table.boolean('unfollowed');
    table.boolean('locked');
  });

  return query;
};

exports.down = function(knex, Promise) {
  const query = knex.schema.dropTable('relationships');

  return query;
};
