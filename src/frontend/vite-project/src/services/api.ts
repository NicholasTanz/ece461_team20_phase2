/*

file used to interact with the backend api and fetch data from the server. 

*/

import axios from 'axios';
const API_BASE = 'http://3.84.115.237:9999'; // Corrected the API base URL

// /package (POST)
export async function postPackage(packageData: { Name: string, Version: string, URL: string, JSProgram: string }) {
  try {
    const response = await axios.post(`${API_BASE}/package`, packageData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response; // Return response after successful POST request
  } catch (error) {
    console.error("Error uploading package:", error);
    throw error; // Propagate the error to be handled by the caller
  }
}

// /package/:id (GET)
export async function fetchPackageById(id: string) {
  const response = await axios.get(`${API_BASE}/package/${id}`); // Correct method
  return response // just response for now.
}

// /packages/:id (POST)
export async function updatePackageById(id: string, packageData: object) {
  const response = await axios.post(`${API_BASE}/package/${id}`, packageData); // Send package data in the body
  return response; // Just response for now.
}


// /package/:id (DELETE)
export async function deletePackageById(id: string) {
  const response = await axios.delete(`${API_BASE}/package/${id}`); // Fixed to DELETE
  return response // just response for now.
}

// /package/:id/rate (GET)
export async function ratePackage(id: string) {
  const response = await axios.get(`${API_BASE}/package/${id}/rate`); // Corrected endpoint
  return response // just response for now.
}

// /package/{id}/cost (GET)
export async function fetchPackageCost(id: string) {
  try {
    const response = await axios.get(`${API_BASE}/package/${id}/cost`);
    return response; // Returning the full response from the API
  } catch (error) {
    console.error("Error fetching package cost:", error);
    throw error; // Rethrow the error for the caller to handle it
  }
}

// /reset (DELETE)
export async function resetSystem() {
  const response = await axios.delete(`${API_BASE}/reset`); // Fixed to DELETE
  return response // just response for now.
}

// /package/byRegEx (POST)
export async function byRegex(regex: string) {
  try {
    const response = await axios.post(
      `${API_BASE}/package/byRegEx`,
      { RegEx: regex }, // Payload
      {
        headers: {
          'Content-Type': 'application/json', // Content-Type header
        },
      }
    );
    return response.data; // Return only the data if that's what you need
  } catch (error) {
    console.error('Error while fetching packages by regex:', error);
    throw error; // Re-throw the error to handle it upstream
  }
}


// /packages (POST)
export async function listPackages(packageQueries: { Name: string, Version?: string }[], offset?: number) {
  try {
    const response = await axios.post(
      `${API_BASE}/packages`,
      packageQueries, // Send the request body as an array of PackageQuery objects
      {
        headers: {
          'Content-Type': 'application/json',
        },
        params: offset ? { offset } : {}, // Add offset as a query parameter if provided
      }
    );
    return response.data; // Return only the data from the response
  } catch (error) {
    console.error("Error fetching packages:", error);
    throw error; // Rethrow error for further handling
  }
}

// /tracks (GET)
export async function fetchTrack() {
  const response = await axios.get(`${API_BASE}/tracks`); // Correct method
  return response // just response for now.
}