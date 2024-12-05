/*

file used to interact with the backend api and fetch data from the server. 

*/

import axios from 'axios';
const API_BASE = '/localhost:9999'; // Change this to the actual API base URL

// /package (post)
export async function postPackage(id: string) {
  const response = await axios.get(`${API_BASE}/packages`);
  return response.data; // Array of packages
}

// /package/:id (get, put, delete) 
export async function fetchPackageById(id: string) {
  const response = await axios.get(`${API_BASE}/packages/${id}`);
  return response.data; // Package details
}

// /package/:id (get, put, delete) 
export async function updatePackageById(id: string) {
  const response = await axios.get(`${API_BASE}/packages/${id}`);
  return response.data; // Package details
}

// /package/:id (get, put, delete) 
export async function deletePackageById(id: string) {
  const response = await axios.get(`${API_BASE}/packages/${id}`);
  return response.data; // Package details
}

// /package/:id/rate (get)
export async function ratePackage(id: string) {
  const response = await axios.get(`${API_BASE}/package/${id}/rate`);
  return response.data; // Package rating
}

// /packages/:id/cost (get)
export async function fetchPackageCost(id: string) {
 const response = await axios.get(`${API_BASE}/packages/${id}/cost`);
  return response.data; // Package cost
}

// /reset (delete)
export async function resetSystem(id: string) {
  const response = await axios.get(`${API_BASE}/reset`);
  return response.data; // Reset status
}

// /package/byRegEx (post)
export async function byRegex(id: string) {
  const response = await axios.get(`${API_BASE}/package/byRegEx`);
  return response.data; // Package details
}

// /packages (post)
export async function listPackages(id: string) {
  const response = await axios.get(`${API_BASE}/packages`);
  return response.data; // Package details
}