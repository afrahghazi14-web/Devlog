import apiClient from "./client.js";

// Stats API resource function
export async function getStats() {
  return apiClient.get("/stats");
}

export async function getServiceStats() {
  return apiClient.get("/stats/services");
}

