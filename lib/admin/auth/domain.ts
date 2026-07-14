export type AdminLoginRole = 'owner' | 'manager';

export const ADMIN_AUTH_SECRET_MIN_LENGTH = 32;
export const ADMIN_PASSWORD_MIN_LENGTH = 12;

export type AdminDeploymentEnvironment =
  | 'production'
  | 'preview'
  | 'development'
  | 'unknown';

export interface AdminAuthValueStatus {
  exists: boolean;
  valid: boolean;
  minimumLength: number;
}

export interface AdminAuthConfigurationStatus {
  configured: boolean;
  authSecret: AdminAuthValueStatus;
  ownerPassword: AdminAuthValueStatus;
  managerPassword: AdminAuthValueStatus;
  deploymentEnvironment: AdminDeploymentEnvironment;
  mockAuthenticationEnabled: boolean;
}

export function shouldAllowMockAdmin(input: {
  nodeEnv?: string;
  vercelEnv?: string;
  devAuthEnabled?: string;
}): boolean {
  if (input.devAuthEnabled === 'true') return true;
  if (input.devAuthEnabled === 'false') return false;

  return input.nodeEnv !== 'production' || input.vercelEnv === 'preview';
}

function valueStatus(
  value: string,
  minimumLength: number,
): AdminAuthValueStatus {
  return {
    exists: value.length > 0,
    valid: value.length >= minimumLength,
    minimumLength,
  };
}

function deploymentEnvironment(input: {
  nodeEnv?: string;
  vercelEnv?: string;
}): AdminDeploymentEnvironment {
  if (
    input.vercelEnv === 'production' ||
    input.vercelEnv === 'preview' ||
    input.vercelEnv === 'development'
  ) {
    return input.vercelEnv;
  }
  if (input.nodeEnv === 'production') return 'production';
  if (input.nodeEnv === 'development') return 'development';
  return 'unknown';
}

export function inspectAdminAuthConfiguration(input: {
  authSecret?: string;
  ownerPassword?: string;
  managerPassword?: string;
  nodeEnv?: string;
  vercelEnv?: string;
  devAuthEnabled?: string;
}): AdminAuthConfigurationStatus {
  const authSecret = valueStatus(
    input.authSecret?.trim() ?? '',
    ADMIN_AUTH_SECRET_MIN_LENGTH,
  );
  const ownerPassword = valueStatus(
    input.ownerPassword ?? '',
    ADMIN_PASSWORD_MIN_LENGTH,
  );
  const managerPassword = valueStatus(
    input.managerPassword ?? '',
    ADMIN_PASSWORD_MIN_LENGTH,
  );

  return {
    configured:
      authSecret.valid && (ownerPassword.valid || managerPassword.valid),
    authSecret,
    ownerPassword,
    managerPassword,
    deploymentEnvironment: deploymentEnvironment(input),
    mockAuthenticationEnabled: shouldAllowMockAdmin(input),
  };
}
