const db = require('../config/database');

// POST - Create customer
const createCustomer = async (req, res) => {
  try {
    const { Name, MobileNo, DOB, DOA } = req.body;
    const [result] = await db.execute(
      'INSERT INTO customer (Name, MobileNo, DOB, DOA, IsActive) VALUES (?, ?, ?, ?, ?)',
      [Name, MobileNo, DOB || null, DOA || null, 'Y']
    );
    res.status(201).json({ message: 'Customer created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET - Get all customers
const getAllCustomers = async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM customer WHERE IsActive = ?', ['Y']);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET - Get customer by mobile number
const getCustomerByMobile = async (req, res) => {
  try {
    const { mobile } = req.params;
    const [rows] = await db.execute('SELECT * FROM customer WHERE MobileNo = ? AND IsActive = ?', [mobile, 'Y']);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createCustomer,
  getAllCustomers,
  getCustomerByMobile
};