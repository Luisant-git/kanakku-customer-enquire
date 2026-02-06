const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface Customer {
  id?: number;
  Name?: string;
  MobileNo?: string;
  DOB?: string;
  DOA?: string;
  IsActive?: string;
}

// Create customer
export const createCustomer = async (customerData: Partial<Omit<Customer, 'id'>>): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/customer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(customerData),
  });
  
  if (!response.ok) {
    throw new Error('Failed to create customer');
  }
  
  return response.json();
};

// Get all customers
export const getAllCustomers = async (): Promise<Customer[]> => {
  const response = await fetch(`${API_BASE_URL}/customers`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch customers');
  }
  
  return response.json();
};

// Get customer by ID
export const getCustomerById = async (id: number): Promise<Customer> => {
  const response = await fetch(`${API_BASE_URL}/customer/${id}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch customer');
  }
  
  return response.json();
};