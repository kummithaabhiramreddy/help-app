export default function (req, res) {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ status: 'zero-dep-ok', version: '4.1.9' }));
}
