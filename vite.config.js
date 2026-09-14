import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { 
  handleImdDistrictRainfallRequest, 
  handleImdCurrentWeatherRequest,
  handleImdDistrictNowcastRequest
} from './server/imdProxy.js';

function imdRainfallPlugin() {
  return {
    name: 'imd-rainfall-proxy',
    configureServer(server) {
      // 1. District-wise Rainfall API
      server.middlewares.use('/api/imd/districtrainfall', async (req, res) => {
        try {
          const urlObj = new URL(req.url, 'http://localhost:3000');
          const query = Object.fromEntries(urlObj.searchParams.entries());
          const result = await handleImdDistrictRainfallRequest(query);

          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 200;
          res.end(JSON.stringify(result));
        } catch (err) {
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 500;
          res.end(JSON.stringify({
            success: false,
            error: err.message
          }));
        }
      });

      // 2. Current Weather API
      server.middlewares.use('/api/imd/current_wx', async (req, res) => {
        try {
          const urlObj = new URL(req.url, 'http://localhost:3000');
          const query = Object.fromEntries(urlObj.searchParams.entries());
          const result = await handleImdCurrentWeatherRequest(query);

          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 200;
          res.end(JSON.stringify(result));
        } catch (err) {
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 500;
          res.end(JSON.stringify({
            success: false,
            error: err.message
          }));
        }
      });

      // 3. District-wise Nowcast API
      server.middlewares.use('/api/imd/districtnowcast', async (req, res) => {
        try {
          const urlObj = new URL(req.url, 'http://localhost:3000');
          const query = Object.fromEntries(urlObj.searchParams.entries());
          const result = await handleImdDistrictNowcastRequest(query);

          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 200;
          res.end(JSON.stringify(result));
        } catch (err) {
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 500;
          res.end(JSON.stringify({
            success: false,
            error: err.message
          }));
        }
      });
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load process.env variables from .env for server-side proxy
  const env = loadEnv(mode, process.cwd(), '');
  process.env = { ...process.env, ...env };

  return {
    plugins: [react(), imdRainfallPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 3000,
      host: true
    }
  };
});

