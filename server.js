import http from 'http';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3500;
const DIST_DIR = path.join(__dirname, 'dist');

// Helper to run shell commands as promises
function runCmd(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, { cwd: __dirname }, (error, stdout, stderr) => {
      if (error) {
        reject({ error, stderr });
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  // 1. Handle check update endpoint
  if (req.url === '/_checkupdate') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    try {
      console.log('Running git fetch...');
      await runCmd('git fetch');
      
      // Get current branch name
      const currentBranch = await runCmd('git rev-parse --abbrev-ref HEAD');
      
      // Compare local HEAD with remote branch
      const local = await runCmd('git rev-parse HEAD');
      let remote;
      try {
        remote = await runCmd(`git rev-parse origin/${currentBranch}`);
      } catch (err) {
        remote = await runCmd('git rev-parse @{u}');
      }
      
      if (local !== remote) {
        // Trigger pull and rebuild in the background so request doesn't time out
        res.end(JSON.stringify({ 
          status: 'updating', 
          message: `New updates found on origin/${currentBranch}. Pulling and rebuilding...`,
          localCommit: local,
          remoteCommit: remote
        }));
        
        console.log(`Updates found. Starting pull and build on branch: ${currentBranch}...`);
        (async () => {
          try {
            await runCmd('git pull');
            console.log('Git pull successful. Rebuilding dependencies and project...');
            
            // Re-run install and build
            if (fs.existsSync(path.join(__dirname, 'yarn.lock'))) {
              await runCmd('yarn install --frozen-lockfile');
              await runCmd('npx vite build');
            } else {
              await runCmd('npm ci --legacy-peer-deps');
              await runCmd('npx vite build');
            }
            console.log('Build complete! Serving new version.');
          } catch (err) {
            console.error('Update failed:', err.stderr || err.message || err);
          }
        })();
      } else {
        res.end(JSON.stringify({ 
          status: 'up-to-date', 
          message: 'Already at the latest version.',
          currentCommit: local
        }));
      }
    } catch (err) {
      console.error('Error checking updates:', err);
      res.end(JSON.stringify({ 
        status: 'error', 
        message: 'Failed to check updates.', 
        error: String(err.stderr || err.message || err) 
      }));
    }
    return;
  }

  // 2. Serve static files from dist
  let filePath = path.join(DIST_DIR, req.url === '/' ? 'index.html' : req.url);

  // If path doesn't have an extension, fall back to index.html (client-side routing fallback)
  if (!path.extname(filePath)) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  // Map file extension to content-type
  const extname = String(path.extname(filePath)).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp3': 'audio/mpeg',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm'
  };

  const contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        // Serve index.html as fallback for react-router paths
        fs.readFile(path.join(DIST_DIR, 'index.html'), (err, indexContent) => {
          if (err) {
            res.writeHead(500);
            res.end(`Error loading index.html: ${err.code}`);
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(indexContent, 'utf-8');
          }
        });
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${error.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
