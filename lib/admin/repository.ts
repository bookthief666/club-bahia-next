import { commandCenterFixture } from './fixtures';
import type { CommandCenterData } from './domain';

export interface CommandCenterRepository {
  getDashboardData(): Promise<CommandCenterData>;
}

export class FixtureCommandCenterRepository implements CommandCenterRepository {
  async getDashboardData(): Promise<CommandCenterData> {
    return structuredClone(commandCenterFixture);
  }
}

export function createCommandCenterRepository(): CommandCenterRepository {
  return new FixtureCommandCenterRepository();
}
