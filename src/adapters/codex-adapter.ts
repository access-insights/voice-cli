export interface CliAdapter {
  id: string;
  displayName: string;
  command: string;
  argsForPrompt(projectPath: string, prompt: string): string[];
}

export class CodexCliAdapter implements CliAdapter {
  id = 'codex';
  displayName = 'Codex CLI';
  command = 'codex';

  argsForPrompt(projectPath: string, prompt: string): string[] {
    return ['exec', '--skip-git-repo-check', `In project ${projectPath}: ${prompt}`];
  }
}
