export default function handler(request, response) {
  response.status(200).json({
    body: 'v4.2.5: Express-free pure function',
    query: request.query,
    cookies: request.cookies,
  });
}
