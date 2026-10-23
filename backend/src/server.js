import app from "./app.js";
import { env } from "./config/env.js";

const PORT = env.PORT;

const server = app.listen(PORT, () => {
  console.log(`DevLog backend server running on http://localhost:${PORT}`);
});

export default server;
