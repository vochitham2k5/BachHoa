const { Schema, model, Types } = require('mongoose');

const productSchema = new Schema(
  {
    name: { type: String, required: true },
    description: String,
    price: { type: Number, required: true },
    category: String,
    brand: String,
    images: [String],
    stock: { type: Number, default: 0 },
    seller: { type: Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

module.exports = model('Product', productSchema);