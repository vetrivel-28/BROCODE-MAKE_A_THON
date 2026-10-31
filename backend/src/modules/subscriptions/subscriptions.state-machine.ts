export type SubscriptionRole = 'SUPER_ADMIN' | 'ADMIN' | 'STAFF' | 'CUSTOMER';
export type SubscriptionStatus = 'DRAFT' | 'QUOTATION' | 'CONFIRMED' | 'ACTIVE' | 'PAUSED' | 'CLOSED';

export type SubscriptionAction =
  | 'submitQuotation'
  | 'confirm'
  | 'activate'
  | 'pause'
  | 'resume'
  | 'renew'
  | 'close';

export interface TransitionContext {
  role: SubscriptionRole | 'SYSTEM';
  actorOwnsSubscription?: boolean;
  quotationIsValid?: boolean;
  planAvailable?: boolean;
  minimumQuantityMet?: boolean;
  paymentConfirmed?: boolean;
  planPausable?: boolean;
  planClosable?: boolean;
  planRenewable?: boolean;
  planAutoClose?: boolean;
  isExpired?: boolean;
  startDateValid?: boolean;
}

export interface Transition {
  from: SubscriptionStatus;
  to: SubscriptionStatus;
  roles: readonly (SubscriptionRole | 'SYSTEM')[];
  guard: (context: TransitionContext) => boolean;
  guardDescription: string;
}

const quotationValid = (context: TransitionContext) =>
  context.quotationIsValid === true
  && (context.role !== 'CUSTOMER' || context.actorOwnsSubscription === true);
const activationAllowed = (context: TransitionContext) =>
  context.startDateValid === true
  && context.planAvailable === true
  && context.minimumQuantityMet === true
  && context.paymentConfirmed === true;
const pauseAllowed = (context: TransitionContext) =>
  context.planPausable === true && context.isExpired !== true;
const resumeAllowed = (context: TransitionContext) =>
  context.isExpired !== true && context.planAvailable === true;
const renewalAllowed = (context: TransitionContext) =>
  context.planRenewable === true && context.isExpired !== true;
const adminCloseAllowed = (context: TransitionContext) => context.planClosable === true;
const systemCloseAllowed = (context: TransitionContext) =>
  context.planAutoClose === true && context.isExpired === true;

export const SUBSCRIPTION_TRANSITIONS: readonly Transition[] = [
  { from: 'DRAFT', to: 'QUOTATION', roles: ['SUPER_ADMIN', 'ADMIN', 'STAFF'], guard: quotationValid, guardDescription: 'Quotation expiry is in the future' },
  { from: 'QUOTATION', to: 'CONFIRMED', roles: ['SUPER_ADMIN', 'ADMIN', 'CUSTOMER'], guard: quotationValid, guardDescription: 'Quotation is not expired; customer is the owner when accepting' },
  { from: 'CONFIRMED', to: 'ACTIVE', roles: ['SUPER_ADMIN', 'ADMIN'], guard: activationAllowed, guardDescription: 'Valid start date, available plan, minimum quantity and payment confirmation' },
  { from: 'ACTIVE', to: 'PAUSED', roles: ['SUPER_ADMIN', 'ADMIN'], guard: pauseAllowed, guardDescription: 'Plan is pausable and subscription is not expired' },
  { from: 'PAUSED', to: 'ACTIVE', roles: ['SUPER_ADMIN', 'ADMIN'], guard: resumeAllowed, guardDescription: 'Plan remains available and subscription is not expired' },
  { from: 'ACTIVE', to: 'ACTIVE', roles: ['SUPER_ADMIN', 'ADMIN', 'SYSTEM'], guard: renewalAllowed, guardDescription: 'Plan is renewable; extend current term atomically' },
  { from: 'ACTIVE', to: 'CLOSED', roles: ['SUPER_ADMIN', 'ADMIN', 'SYSTEM'], guard: (context) => context.role === 'SYSTEM' ? systemCloseAllowed(context) : adminCloseAllowed(context), guardDescription: 'ADMIN requires closable; scheduled SYSTEM close requires auto-close and expiry' },
  { from: 'PAUSED', to: 'CLOSED', roles: ['SUPER_ADMIN', 'ADMIN', 'SYSTEM'], guard: (context) => context.role === 'SYSTEM' ? systemCloseAllowed(context) : adminCloseAllowed(context), guardDescription: 'ADMIN requires closable; scheduled SYSTEM close requires auto-close and expiry' },
];

export class InvalidSubscriptionTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidSubscriptionTransitionError';
  }
}

export function resolveSubscriptionTransition(
  from: SubscriptionStatus,
  action: SubscriptionAction,
  context: TransitionContext,
): Transition {
  const actionTargets: Record<SubscriptionAction, readonly [SubscriptionStatus, SubscriptionStatus][]> = {
    submitQuotation: [['DRAFT', 'QUOTATION']],
    confirm: [['QUOTATION', 'CONFIRMED']],
    activate: [['CONFIRMED', 'ACTIVE']],
    pause: [['ACTIVE', 'PAUSED']],
    resume: [['PAUSED', 'ACTIVE']],
    renew: [['ACTIVE', 'ACTIVE']],
    close: [['ACTIVE', 'CLOSED'], ['PAUSED', 'CLOSED']],
  };
  const targetPair = actionTargets[action].find(([source]) => source === from);
  if (!targetPair) throw new InvalidSubscriptionTransitionError(`Action ${action} is not valid from ${from}`);

  const transition = SUBSCRIPTION_TRANSITIONS.find((candidate) =>
    candidate.from === targetPair[0] && candidate.to === targetPair[1]
    && candidate.roles.includes(context.role));
  if (!transition) throw new InvalidSubscriptionTransitionError(`Role ${context.role} cannot perform ${action} from ${from}`);
  if (!transition.guard(context)) {
    throw new InvalidSubscriptionTransitionError(`Transition guard failed: ${transition.guardDescription}`);
  }
  return transition;
}
