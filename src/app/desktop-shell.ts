export interface DesktopWindowSpec {
  title: string;
  width: number;
  height: number;
  startRoute: string;
}

export function createDesktopWindowSpec(): DesktopWindowSpec {
  return {
    title: 'voice-cli',
    width: 1280,
    height: 900,
    startRoute: '/',
  };
}
