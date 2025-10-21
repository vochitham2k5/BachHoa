const { Schema, model } = require('mongoose');

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['buyer', 'seller', 'admin'], default: 'buyer' }
  },
  { timestamps: true }
);

module.exports = model('User', userSchema);