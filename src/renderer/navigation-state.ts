export type MainView = 'onboarding' | 'session' | 'history' | 'settings';

export interface NavigationState {
  currentView: MainView;
}

export function createDefaultNavigationState(): NavigationState {
  return {
    currentView: 'session',
  };
}
