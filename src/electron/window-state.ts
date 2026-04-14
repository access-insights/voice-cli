export interface WindowState {
  route: string;
  transcriptVisible: boolean;
  detailsPanelVisible: boolean;
}

export function createDefaultWindowState(): WindowState {
  return {
    route: '/',
    transcriptVisible: true,
    detailsPanelVisible: true,
  };
}
