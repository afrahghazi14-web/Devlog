import * as healthRepository from "../repositories/health.repository.js";

// Services contain business logic and orchestrate repository calls.
export async function getHealthStatus() {
  try {
    await healthRepository.checkDatabaseConnection();
    return { isDatabaseUp: true };
  } catch (error) {
    return { isDatabaseUp: false, error };
  }
}
