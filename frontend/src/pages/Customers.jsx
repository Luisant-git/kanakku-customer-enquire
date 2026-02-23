import React, { useState, useEffect } from 'react';
import './Customers.css';
import { getCustomers } from '../api/customer';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });

  useEffect(() => {
    fetchCustomers();
  }, [page, search]);

  const fetchCustomers = async () => {
    try {
      const data = await getCustomers(page, limit, search);
      setCustomers(data.customers);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  return (
    <div className="customers">
      <div className="header-section">
        <h2>Customers</h2>
        <input
          type="text"
          placeholder="Search by name, phone, or campaign..."
          value={search}
          onChange={handleSearch}
          className="search-input"
        />
      </div>
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
              <td>{customer.sentAt ? new Date(customer.sentAt).toLocaleString() : '-'}</td>
              <td>{customer.createdAt ? new Date(customer.createdAt).toLocaleString() : '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="pagination">
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</button>
        <span>Page {page} of {pagination.totalPages} ({pagination.total} total)</span>
        <button onClick={() => setPage(p => p + 1)} disabled={page >= pagination.totalPages}>Next</button>
      </div>
    </div>
  );
};

export default Customers;
