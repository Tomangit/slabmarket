import type { NextApiRequest, NextApiResponse } from "next";
export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  res.status(501).json({ error: "Not implemented. Use walletService on client." });
}


