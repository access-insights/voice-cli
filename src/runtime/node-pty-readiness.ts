export interface NodePtyReadiness {
  packageRequested: boolean;
  transportAbstractionReady: boolean;
  placeholderImplemented: boolean;
  nextAction: string;
}

export function getNodePtyReadiness(): NodePtyReadiness {
  return {
    packageRequested: true,
    transportAbstractionReady: true,
    placeholderImplemented: false,
    nextAction: 'Validate real node-pty transport behavior and integrate prompt handling.',
  };
}
