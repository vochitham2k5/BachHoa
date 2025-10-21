const mongoose = require('mongoose');

async function connect(uri) {
  return mongoose.connect(uri, {
    // options can be customized here
  });
}

module.exports = { connect };