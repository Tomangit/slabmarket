import type { NextApiRequest, NextApiResponse } from "next";
export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  // This project nie używa auth-helpers po stronie API.
  // Endpoint pozostawiamy jako stub informacyjny.
  res.status(501).json({ error: "Not implemented. Use walletService on client." });
}


