import type { NavigationState } from '../renderer/navigation-state.ts';

export function renderNavigationPanel(state: NavigationState): string {
  return `
    <nav aria-label="Primary navigation">
      <p>Current view: ${escapeHtml(state.currentView)}</p>
      <ul>
        <li>onboarding</li>
        <li>session</li>
        <li>history</li>
        <li>settings</li>
      </ul>
    </nav>
  `;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}
