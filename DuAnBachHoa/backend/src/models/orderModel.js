const { Schema, model, Types } = require('mongoose');

const orderItemSchema = new Schema(
  {
    product: { type: Types.ObjectId, ref: 'Product', required: true },
    name: String,
    price: Number,
    quantity: Number
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: 'User', required: true },
    items: [orderItemSchema],
    total: Number,
    address: {
      fullName: String,
      phone: String,
      street: String,
      ward: String,
      district: String,
      province: String
    },
    payment: {
      method: { type: String, enum: ['cod', 'momo', 'zalopay', 'vnpay'], default: 'cod' },
      status: { type: String, enum: ['unpaid', 'paid', 'refunded'], default: 'unpaid' },
      transactionId: String
    },
    status: { type: String, enum: ['pending', 'confirmed', 'picking', 'shipping', 'completed', 'cancelled'], default: 'pending' }
  },
  { timestamps: true }
);

module.exports = model('Order', orderSchema);