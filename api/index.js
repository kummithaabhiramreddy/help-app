export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ status: 'final-debug-ok', timestamp: new Date().toISOString() }));
}
