export default function handler(req, res) {
  res.status(200).json({ status: 'pure-function-ok', time: new Date().toISOString() });
}
