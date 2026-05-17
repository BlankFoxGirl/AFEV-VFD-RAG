const mongoose = require('mongoose');

async function connectToDatabase(uri) {
  await mongoose.connect(uri);
}

async function disconnectFromDatabase() {
  await mongoose.disconnect();
}

module.exports = { connectToDatabase, disconnectFromDatabase };
