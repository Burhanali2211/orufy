import type { VercelRequest, VercelResponse } from '@vercel/node';

// Import the Express app from server
import app from '../server/index';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Pass request to Express app
  return new Promise((resolve) => {
    app(req as any, res as any);
    res.on('finish', () => {
      resolve(undefined);
    });
  });
}
