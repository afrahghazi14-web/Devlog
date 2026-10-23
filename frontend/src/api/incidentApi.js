import apiClient from "./client.js";

// Incident API resource functions
export async function getIncidents({ status = "ALL", page = 1, limit = 10 } = {}) {
  return apiClient.get("/incidents", {
    params: {
      status,
      page,
      limit,
    },
  });
}

export async function getIncidentById(id) {
  return apiClient.get(`/incidents/${id}`);
}

export async function createIncident(incidentData) {
  return apiClient.post("/incidents", incidentData);
}

export async function resolveIncident(id, resolutionData) {
  return apiClient.post(`/incidents/${id}/resolve`, resolutionData);
}
