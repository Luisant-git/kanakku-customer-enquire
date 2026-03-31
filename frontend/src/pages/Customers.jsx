import React, { useState, useEffect } from 'react';
import './Customers.css';
import { getCustomers } from '../api/customer';
import { FiUsers, FiSearch, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { BsCheckCircle, BsXCircle } from 'react-icons/bs';

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
      <div className="page-header">
        <div>
          <h2><FiUsers /> Customers</h2>
          <p>View all customers from your database</p>
        </div>
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by name, phone, or campaign..."
            value={search}
            onChange={handleSearch}
            className="search-input"
          />
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone Number</th>
              <th>Date of Birth</th>
              <th>Anniversary</th>
              <th>Status</th>
              <th>ID</th>
            </tr>
          </thead>
          <tbody>
            {customers.length > 0 ? (
              customers.map((customer) => (
                <tr key={customer.id}>
                  <td>{customer.Name}</td>
                  <td>{customer.MobileNo}</td>
                  <td>{customer.DOB ? new Date(customer.DOB).toLocaleDateString() : '-'}</td>
                  <td>{customer.DOA ? new Date(customer.DOA).toLocaleDateString() : '-'}</td>
                  <td>
                    <span className={`status-badge ${customer.IsActive === 'Y' ? 'sent' : 'failed'}`}>
                      {customer.IsActive === 'Y' ? <BsCheckCircle /> : <BsXCircle />}
                      {customer.IsActive === 'Y' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{customer.id}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="no-data">No customers found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="pagination-btn">
          <FiChevronLeft /> Previous
        </button>
        <span className="pagination-info">
          Page {page} of {pagination.totalPages} ({pagination.total} total)
        </span>
        <button onClick={() => setPage(p => p + 1)} disabled={page >= pagination.totalPages} className="pagination-btn">
          Next <FiChevronRight />
        </button>
      </div>
    </div>
  );
};

export default Customers;
