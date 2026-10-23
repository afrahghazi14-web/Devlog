import apiClient from "./client.js";

// Service API resource functions
export async function getServices() {
  return apiClient.get("/services");
}

export async function createService(serviceData) {
  return apiClient.post("/services", serviceData);
}
