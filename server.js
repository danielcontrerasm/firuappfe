const http = require("http");
const fs = require("fs");
const path = require("path");

const port = Number(process.env.PORT) || 3000;
const buildDir = path.join(__dirname, "build");
const indexFile = path.join(buildDir, "index.html");

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
};

const sendFile = (response, filePath, statusCode = 200) => {
  fs.readFile(filePath, (error, data) => {
    if (error) {
      response.writeHead(error.code === "ENOENT" ? 404 : 500, {
        "Content-Type": "text/plain; charset=utf-8",
      });
      response.end(error.code === "ENOENT" ? "Not found" : "Internal server error");
      return;
    }

    const extension = path.extname(filePath).toLowerCase();
    response.writeHead(statusCode, {
      "Content-Type": contentTypes[extension] || "application/octet-stream",
    });
    response.end(data);
  });
};

const server = http.createServer((request, response) => {
  if (!fs.existsSync(buildDir)) {
    response.writeHead(503, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Build output not found. Run `npm run build` before starting the server.");
    return;
  }

  const requestPath = decodeURIComponent((request.url || "/").split("?")[0]);
  const normalizedPath = requestPath === "/" ? "/index.html" : requestPath;
  const filePath = path.join(buildDir, normalizedPath);

  if (!filePath.startsWith(buildDir)) {
    response.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Invalid path");
    return;
  }

  fs.stat(filePath, (error, stats) => {
    if (!error && stats.isFile()) {
      sendFile(response, filePath);
      return;
    }

    sendFile(response, indexFile);
  });
});

server.listen(port, () => {
  console.log(`Pet Tracker server listening on port ${port}`);
});
