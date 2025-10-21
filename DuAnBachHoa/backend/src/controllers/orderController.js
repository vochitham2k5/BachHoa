const Order = require('../models/orderModel');

exports.create = async (req, res) => {
  try {
    const order = await Order.create({ ...req.body, user: req.userId, status: 'pending' });
    res.status(201).json(order);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

exports.listMine = async (req, res) => {
  try {
    const items = await Order.find({ user: req.userId }).sort({ createdAt: -1 });
    res.json(items);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.detail = async (req, res) => {
  try {
    const item = await Order.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Not found' });
    res.json(item);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const item = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json(item);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};