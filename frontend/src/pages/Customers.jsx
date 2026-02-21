import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Customers.css';

const API_URL = import.meta.env.VITE_API_URL;

const Customers = () => {
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/customer`);
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  return (
    <div className="customers">
      <h2>Customers</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Mobile</th>
            <th>DOB</th>
            <th>DOA</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => (
            <tr key={customer.id}>
              <td>{customer.Name}</td>
              <td>{customer.MobileNo}</td>
              <td>{customer.DOB || '-'}</td>
              <td>{customer.DOA || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Customers;
