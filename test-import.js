require('dotenv').config();

console.log('Loading modules...');

try {
  console.log('Requiring ts-node/register...');
  require('ts-node/register');

  console.log('Importing app...');
  const { createApp } = require('./src/app');

  console.log('Creating app...');
  const app = createApp();

  console.log('App created successfully!');
  console.log('App type:', typeof app);
} catch (error) {
  console.error('Error during import:',error);
  process.exit(1);
}
