import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Keypair } from '@stellar/stellar-sdk';

export interface AuthRequest extends Request {
  user?: {
    walletAddress: string;
  };
}

export function walletAuthMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret') as {
      walletAddress: string;
      iat: number;
      exp: number;
    };

    req.user = { walletAddress: decoded.walletAddress };
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

export function verifyWalletSignature(
  walletAddress: string,
  signatureBase64: string,
  nonce: string
): boolean {
  try {
    const keypair = Keypair.fromPublicKey(walletAddress);
    const signature = Buffer.from(signatureBase64, 'base64');
    const message = Buffer.from(nonce);
    return keypair.verify(message, signature);
  } catch (err) {
    console.error('Signature verification error:', err);
    return false;
  }
}
