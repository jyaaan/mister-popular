exports.development = {
  client: 'postgresql',
  connection: {
    user: 'jyaaan',
    database: 'mister-popular'
  },
  migrations: {
    directory: './migrations',
    tableName: 'knex_migrations'
  }
};
