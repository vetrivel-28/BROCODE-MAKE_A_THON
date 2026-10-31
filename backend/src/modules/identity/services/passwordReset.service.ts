import { randomBytes, createHash } from "node:crypto";
import type { Prisma } from "../../../generated/prisma/client.js";
import { prisma } from "../../../config/prisma.js";
import { AppError } from "../../../shared/errors.js";
import { env } from "../../../config/env.js";
import { passwordService } from "./password.service.js";

async function sendPasswordResetEmail(
  email: string,
  name: string,
  resetUrl: string,
): Promise<void> {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    // Log the URL in dev mode if email is not configured
    console.log(`[DEV] Password reset URL for ${email}: ${resetUrl}`);
    return;
  }

  try {
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.default.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT ?? 587,
      secure: (env.SMTP_PORT ?? 587) === 465,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    });

    await transporter.sendMail({
      from: `"LoopDesk" <${env.FROM_EMAIL}>`,
      to: email,
      subject: "Reset your LoopDesk password",
      html: `
        <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; background: #F7F8FC; padding: 40px 20px;">
          <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 24px rgba(0,0,0,0.06);">
            <div style="margin-bottom: 24px;">
              <span style="background: #6C4BFF; color: white; padding: 8px 16px; border-radius: 8px; font-weight: 800; font-size: 18px; letter-spacing: -0.5px;">loopdesk</span>
            </div>
            <h1 style="color: #1B1F3B; font-size: 24px; font-weight: 700; margin: 0 0 16px;">Reset your password</h1>
            <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">Hi ${name}, we received a request to reset your password. Click the button below to create a new password. This link expires in 30 minutes.</p>
            <a href="${resetUrl}" style="display: inline-block; background: #6C4BFF; color: white; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px;">Reset Password</a>
            <p style="color: #999; font-size: 13px; margin: 24px 0 0;">If you didn't request this, please ignore this email. Your password will remain unchanged.</p>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    // Don't throw - the token is created, user can try again or contact support
  }
}

export const passwordResetService = {
  async requestReset(email: string) {
    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { id: true, name: true, email: true },
    });

    // Always respond successfully to prevent email enumeration
    if (!user) {
      return { message: "If that email exists, a reset link has been sent." };
    }

    // Invalidate previous tokens
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    const rawToken = randomBytes(32).toString("base64url");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    await prisma.passwordResetToken.create({
      data: {
        tokenHash,
        userId: user.id,
        expiresAt,
      },
    });

    const resetUrl = `${env.APP_URL}/reset-password?token=${rawToken}`;
    await sendPasswordResetEmail(user.email, user.name, resetUrl);

    return { message: "If that email exists, a reset link has been sent." };
  },

  async resetPassword(rawToken: string, newPassword: string) {
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    const now = new Date();

    const record = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!record || record.usedAt || record.expiresAt <= now) {
      throw new AppError(
        "Password reset link is invalid or has expired",
        400,
        "INVALID_RESET_TOKEN",
      );
    }

    const passwordHash = await passwordService.hash(newPassword);

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: now },
      });

      await tx.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      });

      // Revoke all refresh tokens for this user (security measure)
      await tx.refreshToken.updateMany({
        where: { userId: record.userId, revokedAt: null },
        data: { revokedAt: now },
      });
    });

    return { message: "Password has been reset successfully. Please log in with your new password." };
  },
};

