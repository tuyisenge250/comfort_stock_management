import jwt from "jsonwebtoken";

const token_secret = process.env.TOKEN_SECRET;
if (!token_secret) {
  throw new Error("TOKEN_SECRET environment variable is not set.");
}

export async function generateToken(
  dataPassing: string | Buffer | object,
  expiresIn: string = "1h"
): Promise<string> {
  return jwt.sign(dataPassing, token_secret, { expiresIn });
}

export function verifyToken(token: string): string | jwt.JwtPayload {
  try {
    return jwt.verify(token, token_secret);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "jwt expired") {
        throw new Error("Token has expired.");
      } else if (error.message === "invalid token") {
        throw new Error("Invalid token.");
      } else {
        throw new Error("Token verification failed: " + error.message);
      }
    }
    throw new Error("Unknown error during token verification.");
  }
}