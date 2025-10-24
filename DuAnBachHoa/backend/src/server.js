import { env } from './config/env.js';
import app from './app.js';

const port = env.PORT;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${port}`);
});
