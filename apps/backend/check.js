const { Client } = require('pg');
const client = new Client('postgres://postgres:postgres@localhost:5432/template1');
client.connect()
  .then(() => client.query('SELECT COUNT(*) FROM "Cliente"'))
  .then(res => console.log('template1 COUNT:', res.rows))
  .catch(err => console.error('template1 Error:', err.message))
  .finally(() => client.end());

const client2 = new Client('postgres://postgres:postgres@localhost:5432/uberloxa_db');
client2.connect()
  .then(() => client2.query('SELECT COUNT(*) FROM "Cliente"'))
  .then(res => console.log('uberloxa_db COUNT:', res.rows))
  .catch(err => console.error('uberloxa_db Error:', err.message))
  .finally(() => client2.end());
