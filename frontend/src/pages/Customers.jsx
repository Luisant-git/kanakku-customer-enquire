import React, { useState, useEffect } from 'react';
import './Customers.css';
import { getCustomers } from '../api/customer';

const Customers = () => {
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const data = await getCustomers();
      setCustomers(data);
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
            <th>Phone Number</th>
            <th>Campaign</th>
            <th>Status</th>
            <th>Sent At</th>
            <th>Created At</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => (
            <tr key={customer.id}>
              <td>{customer.name}</td>
              <td>{customer.phoneNumber}</td>
              <td>{customer.campaign}</td>
              <td><span className={`status ${customer.status}`}>{customer.status}</span></td>
              <td>{new Date(customer.sentAt).toLocaleString()}</td>
              <td>{new Date(customer.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Customers;
