import type { UserPolicy, PolicyLob } from './userProfileStore';

export type PostLoginState =
  | 'new_user'
  | 'new_user_pwilo_car'
  | 'new_user_pwilo_health'
  | 'new_user_pwilo_life'
  | 'one_policy'
  | 'two_policies_health_vehicle'
  | 'two_policies_vehicles'
  | 'one_policy_pwilo_car'
  | 'one_policy_pwilo_health'
  | 'one_policy_pwilo_life';

export function detectPostLoginState(phone: string): PostLoginState {
  if (phone === '9876543210') return 'new_user';
  if (phone === '9876543211') return 'new_user_pwilo_car';
  if (phone === '9876543212') return 'one_policy';
  if (phone === '9876543213') return 'two_policies_health_vehicle';
  if (phone === '9876543214') return 'two_policies_vehicles';
  if (phone === '9876543215') return 'one_policy_pwilo_car';
  if (phone === '9876543216') return 'new_user_pwilo_health';
  if (phone === '9876543217') return 'new_user_pwilo_life';
  if (phone === '9876543218') return 'one_policy_pwilo_health';
  if (phone === '9876543219') return 'one_policy_pwilo_life';
  return 'new_user';
}

interface MockPolicyTemplate {
  lob: PolicyLob;
  make: string;
  model: string;
  details: string;
  urgent: boolean;
}

const TEMPLATES: Record<string, MockPolicyTemplate[]> = {
  one_policy: [
    { lob: 'car', make: 'Tata', model: 'Harrier', details: 'KA01 AB 1234 · Zero dep', urgent: true },
  ],
  one_policy_pwilo_car: [
    { lob: 'car', make: 'Tata', model: 'Harrier', details: 'KA01 AB 1234 · Zero dep', urgent: true },
  ],
  one_policy_pwilo_health: [
    { lob: 'car', make: 'Tata', model: 'Harrier', details: 'KA01 AB 1234 · Zero dep', urgent: true },
  ],
  one_policy_pwilo_life: [
    { lob: 'car', make: 'Tata', model: 'Harrier', details: 'KA01 AB 1234 · Zero dep', urgent: true },
  ],
  two_policies_vehicles: [
    { lob: 'car', make: 'Tata', model: 'Harrier', details: 'KA01 AB 1234 · Zero dep', urgent: true },
    { lob: 'bike', make: 'Royal Enfield', model: 'Classic 350', details: 'KA05 AB 9876 · Comprehensive', urgent: false },
  ],
  two_policies_health_vehicle: [
    { lob: 'health', make: 'Health', model: 'Family Floater', details: '₹5L cover · 4 members', urgent: true },
    { lob: 'car', make: 'Tata', model: 'Harrier', details: 'KA01 AB 1234 · Zero dep', urgent: false },
  ],
};

export function buildPoliciesForState(state: PostLoginState): UserPolicy[] {
  const templates = TEMPLATES[state] ?? [];
  return templates.map((t, i) => ({
    id: `mock_${t.lob}_${i}`,
    lob: t.lob,
    policyNumber: `ACKO-${t.lob.toUpperCase()}-${new Date().getFullYear()}-${10000 + i}`,
    label: `${t.make} ${t.model}`,
    active: true,
    purchasedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    details: t.details,
    urgent: t.urgent,
  }));
}
