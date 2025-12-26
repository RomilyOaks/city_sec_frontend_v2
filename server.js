import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const distPath = path.join(__dirname, 'dist');
const indexPath = path.join(distPath, 'index.html');

// Verify dist directory exists
if (!existsSync(distPath)) {
  console.error(`ERROR: dist directory not found at ${distPath}`);
  process.exit(1);
}

if (!existsSync(indexPath)) {
  console.error(`ERROR: index.html not found at ${indexPath}`);
  process.exit(1);
}

console.log(`✓ Found dist directory at: ${distPath}`);
console.log(`✓ Found index.html at: ${indexPath}`);

// Health check endpoint FIRST (before any middleware)
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Middleware to log all requests (after health check)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Serve static files from dist directory
app.use(express.static(distPath, {
  maxAge: '1d',
  etag: false
}));

// Handle SPA routing - send all requests to index.html
app.get('*', (req, res) => {
  console.log(`Serving index.html for: ${req.url}`);
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('Error sending file:', err);
      res.status(500).send('Error loading application');
    }
  });
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✓ Server listening on http://0.0.0.0:${PORT}`);
});

server.on('error', (error) => {
  console.error('Server error:', error);
  process.exit(1);
});
