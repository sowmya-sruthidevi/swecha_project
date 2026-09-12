import app from '../../backend/server.js';

export default function handler(req, res) {
  const requestedPath = Array.isArray(req.query.path) ? req.query.path.join('/') : req.query.path;
  const query = new URLSearchParams(req.query);
  query.delete('path');
  const queryString = query.toString();

  req.url = `/api/groups/${requestedPath || ''}${queryString ? `?${queryString}` : ''}`;
  return app(req, res);
}