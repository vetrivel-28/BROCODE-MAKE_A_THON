import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../../app.js';
import { IdentityService } from '../identity.service.js';
import { clock } from '../../../common/clock.js';

describe('Person 1: Identity, Access & Platform Tiers', () => {
  let app: any;
  let identityService: IdentityService;

  beforeEach(() => {
    IdentityService.resetMemoryStore();
    clock.reset();
    identityService = new IdentityService();
    app = createApp(identityService);
  });

  describe('1. Password Rules & Validation', () => {
    it('rejects passwords with 8 or fewer characters', async () => {
      const res = await request(app)
        .post('/identity/signup')
        .send({
          tenantName: 'Acme Corp',
          fullName: 'Alice Smith',
          email: 'alice@acme.com',
          password: 'Aa1!' // only 4 chars
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects passwords missing an uppercase letter', async () => {
      const res = await request(app)
        .post('/identity/signup')
        .send({
          tenantName: 'Acme Corp',
          fullName: 'Alice Smith',
          email: 'alice@acme.com',
          password: 'supersecret1!' // no uppercase
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects passwords missing a lowercase letter', async () => {
      const res = await request(app)
        .post('/identity/signup')
        .send({
          tenantName: 'Acme Corp',
          fullName: 'Alice Smith',
          email: 'alice@acme.com',
          password: 'SUPERSECRET1!' // no lowercase
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects passwords missing a special character', async () => {
      const res = await request(app)
        .post('/identity/signup')
        .send({
          tenantName: 'Acme Corp',
          fullName: 'Alice Smith',
          email: 'alice@acme.com',
          password: 'SuperSecret123' // no special char
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('accepts compliant password (>8 chars, uppercase, lowercase, special char)', async () => {
      const res = await request(app)
        .post('/identity/signup')
        .send({
          tenantName: 'Bright Corp',
          fullName: 'Bob Bright',
          email: 'bob@brightcorp.com',
          password: 'SecurePassword123#',
          tier: 'STANDARD'
        });

      expect(res.status).toBe(201);
      expect(res.body.tenant.name).toBe('Bright Corp');
      expect(res.body.user.role).toBe('ADMIN');
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
    });
  });

  describe('2. Duplicate Email Prevention', () => {
    it('prevents multiple signups with the same email', async () => {
      const payload = {
        tenantName: 'Duplicate Test',
        fullName: 'Charlie Owner',
        email: 'charlie@duplicate.com',
        password: 'ValidPassword123!',
        tier: 'STANDARD'
      };

      const res1 = await request(app).post('/identity/signup').send(payload);
      expect(res1.status).toBe(201);

      const res2 = await request(app).post('/identity/signup').send(payload);
      expect(res2.status).toBe(409);
      expect(res2.body.error.code).toBe('EMAIL_EXISTS');
    });
  });

  describe('3. Forgot Password & 30-Minute Reset Token Expiry', () => {
    it('allows password reset within 30 minutes, but rejects it after 30 minutes', async () => {
      const baseTime = new Date('2026-10-31T10:00:00Z');
      clock.setTestDate(baseTime);

      // Signup user
      await request(app).post('/identity/signup').send({
        tenantName: 'Reset Corp',
        fullName: 'Dan User',
        email: 'dan@reset.com',
        password: 'OriginalPassword1!',
        tier: 'STANDARD'
      });

      // Request password reset
      const forgotRes = await request(app)
        .post('/identity/forgot-password')
        .set('x-test-date', baseTime.toISOString())
        .send({ email: 'dan@reset.com' });

      expect(forgotRes.status).toBe(200);
      const resetToken = forgotRes.body.resetToken;
      expect(resetToken).toBeDefined();

      // Attempt reset after 31 minutes (expiry passed)
      const expiredTime = new Date('2026-10-31T10:31:00Z');
      const expiredAttempt = await request(app)
        .post('/identity/reset-password')
        .set('x-test-date', expiredTime.toISOString())
        .send({
          token: resetToken,
          newPassword: 'BrandNewPassword123!'
        });

      expect(expiredAttempt.status).toBe(400);
      expect(expiredAttempt.body.error.code).toBe('INVALID_OR_EXPIRED_TOKEN');

      // Attempt reset within 20 minutes (valid)
      const validTime = new Date('2026-10-31T10:20:00Z');
      const validAttempt = await request(app)
        .post('/identity/reset-password')
        .set('x-test-date', validTime.toISOString())
        .send({
          token: resetToken,
          newPassword: 'BrandNewPassword123!'
        });

      expect(validAttempt.status).toBe(200);

      // Verify login with new password succeeds
      const loginRes = await request(app).post('/identity/login').send({
        email: 'dan@reset.com',
        password: 'BrandNewPassword123!'
      });
      expect(loginRes.status).toBe(200);
      expect(loginRes.body.accessToken).toBeDefined();
    });
  });

  describe('4. Role-Based Access Control (RBAC) Matrix', () => {
    let adminToken: string;
    let staffToken: string;
    let customerToken: string;

    beforeEach(async () => {
      // 1. Create Tenant & ADMIN
      const signupRes = await request(app).post('/identity/signup').send({
        tenantName: 'RBAC Enterprise',
        fullName: 'Admin Emma',
        email: 'emma@enterprise.com',
        password: 'AdminPassword123!',
        tier: 'STANDARD'
      });
      adminToken = signupRes.body.accessToken;

      // 2. Admin creates STAFF user
      const staffRes = await request(app)
        .post('/identity/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          fullName: 'Staff Steve',
          email: 'steve@enterprise.com',
          password: 'StaffPassword123!'
        });
      expect(staffRes.status).toBe(201);

      const staffLogin = await request(app).post('/identity/login').send({
        email: 'steve@enterprise.com',
        password: 'StaffPassword123!'
      });
      staffToken = staffLogin.body.accessToken;

      // 3. Admin creates CUSTOMER user
      const customerRes = await request(app)
        .post('/identity/customer-user')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          fullName: 'Customer Cathy',
          email: 'cathy@client.com',
          password: 'CustomerPassword123!'
        });
      expect(customerRes.status).toBe(201);

      const customerLogin = await request(app).post('/identity/login').send({
        email: 'cathy@client.com',
        password: 'CustomerPassword123!'
      });
      customerToken = customerLogin.body.accessToken;
    });

    it('allows ADMIN to create staff users', async () => {
      const res = await request(app)
        .post('/identity/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          fullName: 'Staff Two',
          email: 'staff2@enterprise.com',
          password: 'StaffPassword123!'
        });
      expect(res.status).toBe(201);
      expect(res.body.role).toBe('STAFF');
    });

    it('denies STAFF from creating other staff users (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/identity/staff')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          fullName: 'Unauthorized Staff',
          email: 'unauth@enterprise.com',
          password: 'StaffPassword123!'
        });
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('denies CUSTOMER from creating staff users (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/identity/staff')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          fullName: 'Customer Attempt',
          email: 'cust_attempt@enterprise.com',
          password: 'CustomerPassword123!'
        });
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('denies unauthenticated requests to protected endpoints (401 Unauthorized)', async () => {
      const res = await request(app).post('/identity/staff').send({
        fullName: 'No Auth Staff',
        email: 'noauth@enterprise.com',
        password: 'StaffPassword123!'
      });
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('5. Tenant Isolation', () => {
    it('isolates user lists strictly by tenantId', async () => {
      // Tenant A
      const tenantARes = await request(app).post('/identity/signup').send({
        tenantName: 'Tenant Alpha',
        fullName: 'Alpha Boss',
        email: 'boss@alpha.com',
        password: 'AlphaPassword123!',
        tier: 'STANDARD'
      });
      const tokenA = tenantARes.body.accessToken;

      // Tenant B
      const tenantBRes = await request(app).post('/identity/signup').send({
        tenantName: 'Tenant Beta',
        fullName: 'Beta Boss',
        email: 'boss@beta.com',
        password: 'BetaPassword123!',
        tier: 'CUSTOM'
      });
      const tokenB = tenantBRes.body.accessToken;

      // Add a staff to Tenant A
      await request(app)
        .post('/identity/staff')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          fullName: 'Alpha Worker',
          email: 'worker@alpha.com',
          password: 'AlphaPassword123!'
        });

      // Tenant A queries users -> should see 2 users (Alpha Boss + Alpha Worker)
      const usersA = await request(app)
        .get('/identity/users')
        .set('Authorization', `Bearer ${tokenA}`);
      expect(usersA.status).toBe(200);
      expect(usersA.body.users.length).toBe(2);
      expect(usersA.body.users.every((u: any) => u.email.endsWith('@alpha.com'))).toBe(true);

      // Tenant B queries users -> should only see 1 user (Beta Boss), never Tenant A's users
      const usersB = await request(app)
        .get('/identity/users')
        .set('Authorization', `Bearer ${tokenB}`);
      expect(usersB.status).toBe(200);
      expect(usersB.body.users.length).toBe(1);
      expect(usersB.body.users[0].email).toBe('boss@beta.com');
    });
  });

  describe('6. Platform Tiers, Entitlements & Privilege Passport', () => {
    it('correctly reports tier entitlements and customization slots', async () => {
      // 1. Signup with Standard Tier
      const signupRes = await request(app).post('/identity/signup').send({
        tenantName: 'Passport Corp',
        fullName: 'Frank Owner',
        email: 'frank@passport.com',
        password: 'FrankPassword123!',
        tier: 'STANDARD',
        industry: 'saas'
      });
      const token = signupRes.body.accessToken;
      const tenantId = signupRes.body.tenant.id;

      // Contract checks: can()
      expect(await identityService.can(tenantId, 'auto_billing')).toBe(true);
      expect(await identityService.can(tenantId, 'composable_workspace')).toBe(false);

      // Slot check: Standard has 2 slots
      expect(await identityService.remainingCustomizationSlots(tenantId)).toBe(2);

      // Privilege Passport endpoint
      const passportRes = await request(app)
        .get('/identity/passport')
        .set('Authorization', `Bearer ${token}`);

      expect(passportRes.status).toBe(200);
      expect(passportRes.body.currentTier.code).toBe('STANDARD');
      expect(passportRes.body.customizationSlots.total).toBe(2);
      expect(passportRes.body.customizationSlots.remaining).toBe(2);

      // Verify locked vs unlocked features
      const features = passportRes.body.features;
      const autoBilling = features.find((f: any) => f.key === 'auto_billing');
      const composableWorkspace = features.find((f: any) => f.key === 'composable_workspace');

      expect(autoBilling.unlocked).toBe(true);
      expect(composableWorkspace.unlocked).toBe(false);
      expect(composableWorkspace.upgradeRequired).toBe('CUSTOM');
    });

    it('upgrades tier from Standard to Custom and expands slots to 10', async () => {
      const signupRes = await request(app).post('/identity/signup').send({
        tenantName: 'Upgrade Tenant',
        fullName: 'Grace Owner',
        email: 'grace@upgrade.com',
        password: 'GracePassword123!',
        tier: 'STANDARD'
      });
      const token = signupRes.body.accessToken;
      const tenantId = signupRes.body.tenant.id;

      expect(await identityService.remainingCustomizationSlots(tenantId)).toBe(2);

      // Upgrade via Razorpay test payment
      const upgradeRes = await request(app)
        .post('/identity/upgrade')
        .set('Authorization', `Bearer ${token}`)
        .send({
          targetTier: 'CUSTOM',
          razorpayPaymentId: 'pay_test_abc123'
        });

      expect(upgradeRes.status).toBe(200);
      expect(upgradeRes.body.tier).toBe('CUSTOM');

      // Now has 10 customization slots and composable workspace unlocked
      expect(await identityService.remainingCustomizationSlots(tenantId)).toBe(10);
      expect(await identityService.can(tenantId, 'composable_workspace')).toBe(true);
    });
  });
});

