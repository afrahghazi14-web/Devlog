import * as statsRepository from "../repositories/stats.repository.js";

// Services coordinate business logic between controllers and repositories.

export async function getStats() {
  return statsRepository.getStats();
}

export async function getServiceStats() {
  return statsRepository.getServiceStats();
}

