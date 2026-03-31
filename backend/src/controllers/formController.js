const db = require('../config/database');

// POST - Create customer
const createCustomer = async (req, res) => {
  try {
    const { Name, MobileNo, DOB, DOA } = req.body;
    
    const fields = ['IsActive'];
    const values = ['Y'];
    const placeholders = ['?'];
    
    if (Name) {
      fields.push('Name');
      values.push(Name);
      placeholders.push('?');
    }
    if (MobileNo) {
      fields.push('MobileNo');
      values.push(MobileNo);
      placeholders.push('?');
    }
    if (DOB) {
      fields.push('DOB');
      values.push(DOB);
      placeholders.push('?');
    }
    if (DOA) {
      fields.push('DOA');
      values.push(DOA);
      placeholders.push('?');
    }
    
    const [result] = await db.execute(
      `INSERT INTO customer (${fields.join(', ')}) VALUES (${placeholders.join(', ')})`,
      values
    );
    res.status(201).json({ message: 'Customer created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET - Get all customers with pagination and search
const getAllCustomers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let query = 'SELECT * FROM customer WHERE IsActive = ?';
    let countQuery = 'SELECT COUNT(*) as total FROM customer WHERE IsActive = ?';
    let params = ['Y'];
    
    if (search) {
      query += ' AND (Name LIKE ? OR MobileNo LIKE ?)';
      countQuery += ' AND (Name LIKE ? OR MobileNo LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    // Sort by id descending to show newest first
    query += ' ORDER BY id DESC LIMIT ? OFFSET ?';
    const queryParams = [...params, parseInt(limit), offset];
    
    // Get total count for pagination
    const [countResult] = await db.execute(countQuery, params);
    const total = countResult[0].total;
    
    // Get paginated results
    const [rows] = await db.execute(query, queryParams);
    
    res.json({
      customers: rows,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error in getAllCustomers:', error);
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