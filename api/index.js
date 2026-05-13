export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('X-API-Version', 'v4.2.4');
  res.end(JSON.stringify({ status: 'final-debug-ok', timestamp: new Date().toISOString() }));
}
