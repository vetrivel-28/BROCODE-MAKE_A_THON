import bcrypt from "bcrypt";

const BCRYPT_ROUNDS = 12;
const dummyPasswordHash = bcrypt.hash(
  "LoopDesk-Invalid-Account-Password!",
  BCRYPT_ROUNDS,
);

export const passwordService = {
  hash(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_ROUNDS);
  },

  async verify(password: string, passwordHash?: string): Promise<boolean> {
    const hash = passwordHash ?? (await dummyPasswordHash);
    const matches = await bcrypt.compare(password, hash);
    return passwordHash !== undefined && matches;
  },
};
