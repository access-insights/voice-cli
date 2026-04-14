export interface NodePtyIntegrationPlan {
  packageName: string;
  responsibilities: string[];
  migrationSteps: string[];
}

export function createNodePtyIntegrationPlan(): NodePtyIntegrationPlan {
  return {
    packageName: 'node-pty',
    responsibilities: [
      'persistent interactive CLI session transport',
      'bidirectional terminal input/output',
      'terminal resize and session lifecycle control',
    ],
    migrationSteps: [
      'replace spawn-based PtySession transport with node-pty process binding',
      'preserve normalized event extraction over streamed PTY output',
      'surface prompt and confirmation state into renderer and voice layers',
    ],
  };
}
