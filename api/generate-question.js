import { handleRequest } from '../server/aiServer.js';

export default async function handler(req, res) {
  return handleRequest(req, res);
}
