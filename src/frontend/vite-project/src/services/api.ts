/*
file used to interact with the backend api and fetch data from the server. 

* boilerplate atm, change the api calls to match the backend api.

*/

import axios from 'axios';

const API_BASE = '/api';

export async function fetchPackages() {
  const response = await axios.get(`${API_BASE}/packages`);
  return response.data; // Array of packages
}

export async function fetchPackageById(id: string) {
  const response = await axios.get(`${API_BASE}/packages/${id}`);
  return response.data; // Package details
}

export async function ratePackage(id: string, rating: number) {
  const response = await axios.post(`${API_BASE}/packages/${id}/rate`, { rating });
  return response.data; // Updated package
}

export async function deletePackage(id: string) {
  const response = await axios.delete(`${API_BASE}/packages/${id}`);
  return response.data; // Confirmation message
}
