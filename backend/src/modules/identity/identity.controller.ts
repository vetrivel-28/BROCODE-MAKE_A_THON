import { Request, Response } from 'express';
import { IdentityService } from './identity.service.js';
import {
  signupSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  createStaffSchema,
  createCustomerUserSchema,
  tierUpgradeSchema
} from './identity.schema.js';
import { AppError, sendError } from '../../common/errors.js';

export class IdentityController {
  constructor(private service: IdentityService) {}

  public signup = async (req: Request, res: Response): Promise<void> => {
    try {
      const parsed = signupSchema.safeParse(req.body);
      if (!parsed.success) {
        sendError(res, new AppError(400, 'VALIDATION_ERROR', 'Invalid signup input', parsed.error.format()));
        return;
      }

      const testDate = (req.headers['x-test-date'] as string) || undefined;
      const result = await this.service.signup(parsed.data, testDate);
      res.status(201).json(result);
    } catch (err) {
      sendError(res, err);
    }
  };

  public login = async (req: Request, res: Response): Promise<void> => {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        sendError(res, new AppError(400, 'VALIDATION_ERROR', 'Invalid login input', parsed.error.format()));
        return;
      }

      const result = await this.service.login(parsed.data);
      res.status(200).json(result);
    } catch (err) {
      sendError(res, err);
    }
  };

  public refresh = async (req: Request, res: Response): Promise<void> => {
    try {
      const parsed = refreshTokenSchema.safeParse(req.body);
      if (!parsed.success) {
        sendError(res, new AppError(400, 'VALIDATION_ERROR', 'Refresh token required', parsed.error.format()));
        return;
      }

      const result = await this.service.refreshAccessToken(parsed.data.refreshToken);
      res.status(200).json(result);
    } catch (err) {
      sendError(res, err);
    }
  };

  public logout = async (req: Request, res: Response): Promise<void> => {
    try {
      const token = req.body?.refreshToken;
      if (token) {
        await this.service.logout(token);
      }
      res.status(200).json({ success: true, message: 'Logged out successfully' });
    } catch (err) {
      sendError(res, err);
    }
  };

  public forgotPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const parsed = forgotPasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        sendError(res, new AppError(400, 'VALIDATION_ERROR', 'Valid email required', parsed.error.format()));
        return;
      }

      const testDate = (req.headers['x-test-date'] as string) || undefined;
      const result = await this.service.forgotPassword(parsed.data.email, testDate);
      res.status(200).json(result);
    } catch (err) {
      sendError(res, err);
    }
  };

  public resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const parsed = resetPasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        sendError(res, new AppError(400, 'VALIDATION_ERROR', 'Invalid reset password payload', parsed.error.format()));
        return;
      }

      const testDate = (req.headers['x-test-date'] as string) || undefined;
      const result = await this.service.resetPassword(parsed.data, testDate);
      res.status(200).json(result);
    } catch (err) {
      sendError(res, err);
    }
  };

  public createStaff = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        sendError(res, new AppError(401, 'UNAUTHORIZED', 'Authentication required'));
        return;
      }

      const parsed = createStaffSchema.safeParse(req.body);
      if (!parsed.success) {
        sendError(res, new AppError(400, 'VALIDATION_ERROR', 'Invalid staff input', parsed.error.format()));
        return;
      }

      const result = await this.service.createStaff(req.user, parsed.data);
      res.status(201).json(result);
    } catch (err) {
      sendError(res, err);
    }
  };

  public createCustomerUser = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        sendError(res, new AppError(401, 'UNAUTHORIZED', 'Authentication required'));
        return;
      }

      const parsed = createCustomerUserSchema.safeParse(req.body);
      if (!parsed.success) {
        sendError(res, new AppError(400, 'VALIDATION_ERROR', 'Invalid customer user input', parsed.error.format()));
        return;
      }

      const result = await this.service.createCustomerUser(req.user, parsed.data);
      res.status(201).json(result);
    } catch (err) {
      sendError(res, err);
    }
  };

  public listUsers = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        sendError(res, new AppError(401, 'UNAUTHORIZED', 'Authentication required'));
        return;
      }

      const result = await this.service.listTenantUsers(req.user.tenantId);
      res.status(200).json({ users: result });
    } catch (err) {
      sendError(res, err);
    }
  };

  public getPassport = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        sendError(res, new AppError(401, 'UNAUTHORIZED', 'Authentication required'));
        return;
      }

      const result = await this.service.getPrivilegePassport(req.user.tenantId);
      res.status(200).json(result);
    } catch (err) {
      sendError(res, err);
    }
  };

  public upgradeTier = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        sendError(res, new AppError(401, 'UNAUTHORIZED', 'Authentication required'));
        return;
      }

      const parsed = tierUpgradeSchema.safeParse(req.body);
      if (!parsed.success) {
        sendError(res, new AppError(400, 'VALIDATION_ERROR', 'Invalid upgrade parameters', parsed.error.format()));
        return;
      }

      const result = await this.service.upgradeTier(req.user.tenantId, parsed.data);
      res.status(200).json(result);
    } catch (err) {
      sendError(res, err);
    }
  };

  public me = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        sendError(res, new AppError(401, 'UNAUTHORIZED', 'Authentication required'));
        return;
      }

      const tier = await this.service.getTenantTier(req.user.tenantId);
      res.status(200).json({
        user: req.user,
        tier
      });
    } catch (err) {
      sendError(res, err);
    }
  };
}
