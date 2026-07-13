export type AdminLoginRole = 'owner' | 'manager';

export function shouldAllowMockAdmin(input: {
  nodeEnv?: string;
  vercelEnv?: string;
  devAuthEnabled?: string;
}): boolean {
  if (input.devAuthEnabled === 'true') return true;
  if (input.devAuthEnabled === 'false') return false;

  return input.nodeEnv !== 'production' || input.vercelEnv === 'preview';
}
