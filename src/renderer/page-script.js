function writePageDiagnostic(message) {
  try {
    console.log(`[voice-cli page] ${message}`);
  } catch {
    // no-op
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

const viewState = {
  isStartingSession: false,
  isSessionRunning: false,
  activePrompt: '',
  draftPrompt: 'Summarize the current project state.',
  runStartedAt: 0,
  timingIntervalId: null,
  lastOutcome: 'idle',
  selectedHistoryFile: '',
  selectedRecord: null,
  historyFilter: 'all',
  liveTranscriptFilter: 'all',
  savedTranscriptFilter: 'all',
  lastSpokenText: '',
  lastVoiceMessage: '',
  liveMessage: '',
  isRecordingVoice: false,
  mediaRecorder: null,
  mediaStream: null,
  recordedChunks: [],
  onboarding: {
    codexDetected: false,
    codexPath: '',
    codexHelpText: 'Run setup check to detect Codex CLI.',
    projectPath: '',
    projectValid: false,
    projectHelpText: 'Enter a local project path to validate it.',
  },
};

function setLiveMessage(message) {
  viewState.liveMessage = String(message || '').trim();
}

function focusElementById(id) {
  const element = document.getElementById(id);
  if (element && typeof element.focus === 'function') {
    element.focus();
  }
}

function getElapsedLabel() {
  if (!viewState.runStartedAt) return 'Not running';
  const elapsedMs = Math.max(0, Date.now() - viewState.runStartedAt);
  return `${(elapsedMs / 1000).toFixed(1)}s`;
}

async function maybeSpeakRuntimeSummary(runtimeState) {
  const headline = String(runtimeState?.runtimeSummary?.headline || '').trim();
  const status = runtimeState?.runtimeSummary?.status || 'ok';
  const confirmationReason = runtimeState?.confirmation?.reason || '';

  let text = '';
  if (status === 'needs_confirmation' && confirmationReason) {
    text = `Confirmation required. ${confirmationReason}`;
  } else if (status === 'error' && headline) {
    text = headline;
  } else if ((viewState.lastOutcome === 'completed' || viewState.isSessionRunning) && headline) {
    text = headline;
  }

  if (!text || text === viewState.lastSpokenText) return;
  viewState.lastSpokenText = text;

  try {
    await window.voiceCli?.voice?.speakText?.(text, { rate: 1.0 });
  } catch {
    // transcript-first fallback, no-op
  }
}

function renderBanner(runtimeSummary) {
  if (viewState.isStartingSession) {
    return '<p><strong>Starting session...</strong> Initializing the CLI session.</p>';
  }

  if (viewState.isSessionRunning) {
    return '<p><strong>Session running.</strong> Live updates will appear as the session progresses.</p>';
  }

  if (runtimeSummary?.status === 'error') {
    return '<p><strong>Session error.</strong> Review the transcript for stderr and raw output, then retry with a simpler prompt or confirm setup and workspace settings.</p>';
  }

  if (viewState.lastOutcome === 'completed') {
    return '<p><strong>Session completed.</strong> Latest results are shown below.</p>';
  }

  return '<p><strong>Ready.</strong> Start a session to view transcript output here.</p>';
}

function renderStatusBadge(runtimeSummary) {
  const status = viewState.isStartingSession || viewState.isSessionRunning
    ? 'running'
    : (runtimeSummary?.status || 'ok');

  const label = status === 'error'
    ? 'Error'
    : status === 'needs_confirmation'
      ? 'Needs confirmation'
      : status === 'running'
        ? 'Running'
        : 'Completed';

  return `<p><strong>Status:</strong> ${label}</p>`;
}

function toTranscriptEntries(runtimeState) {
  if (Array.isArray(runtimeState?.transcript) && runtimeState.transcript.length) {
    return runtimeState.transcript;
  }
  return [];
}

function renderRunSummary(runtimeState, history) {
  const latest = history[0] || null;
  const events = Array.isArray(runtimeState.events) ? runtimeState.events : [];
  const transcript = Array.isArray(runtimeState.transcript) ? runtimeState.transcript : [];
  const adapter = latest?.adapter || 'codex';
  const exitCode = latest?.exitCode ?? 'n/a';
  const eventCount = events.length;
  const changeHints = transcript.filter((entry) => entry?.kind === 'change-hint').length;
  const activePrompt = viewState.activePrompt || 'No active prompt';
  const chosenWorkspace = latest?.projectPath || viewState.onboarding?.projectPath || 'No project selected';

  return `
    <section aria-labelledby="run-summary-heading">
      <h2 id="run-summary-heading">Latest run</h2>
      <ul>
        <li><strong>Adapter:</strong> ${escapeHtml(adapter)}</li>
        <li><strong>Workspace:</strong> ${escapeHtml(chosenWorkspace)}</li>
        <li><strong>Exit code:</strong> ${escapeHtml(exitCode)}</li>
        <li><strong>Events:</strong> ${escapeHtml(eventCount)}</li>
        <li><strong>Transcript entries:</strong> ${escapeHtml(transcript.length)}</li>
        <li><strong>Change hints:</strong> ${escapeHtml(changeHints)}</li>
        <li><strong>Elapsed:</strong> ${escapeHtml(getElapsedLabel())}</li>
        <li><strong>Prompt:</strong> ${escapeHtml(activePrompt)}</li>
        <li><strong>Summary:</strong> ${escapeHtml(runtimeState.runtimeSummary.headline)}</li>
      </ul>
    </section>
  `;
}

function summarizeTranscriptEntries(entries) {
  return {
    errors: entries.filter((entry) => entry?.kind === 'error').length,
    prompts: entries.filter((entry) => entry?.kind === 'prompt').length,
    changes: entries.filter((entry) => entry?.kind === 'change-hint').length,
  };
}

function filterTranscriptEntries(entries, filter) {
  if (filter === 'errors') {
    return entries.filter((entry) => entry?.kind === 'error');
  }
  if (filter === 'prompts') {
    return entries.filter((entry) => entry?.kind === 'prompt');
  }
  if (filter === 'changes') {
    return entries.filter((entry) => entry?.kind === 'change-hint');
  }
  return entries;
}

function renderTranscript(entries, options = {}) {
  if (!entries.length) {
    return '<p>No transcript captured yet.</p>';
  }

  const idPrefix = options.idPrefix || 'transcript-entry';

  return `
    <ol>
      ${entries.map((entry, index) => {
        const label = entry.kind === 'prompt'
          ? 'Prompt'
          : entry.kind === 'error'
            ? 'Error'
            : entry.kind === 'lifecycle'
              ? 'System'
              : entry.kind === 'change-hint'
                ? 'Changed files or diff hint'
                : entry.kind === 'user'
                  ? 'User'
                  : entry.kind === 'assistant'
                    ? 'Assistant summary'
                    : 'Tool output';

        const summaryId = `transcript-summary-${index}`;
        const rawId = `transcript-raw-${index}`;
        const entryAnchorId = `${idPrefix}-${index}`;
        const detailLabel = entry.detailLabel || 'Raw output details';
        const rawSection = entry.raw && entry.raw !== entry.summary
          ? `<details><summary aria-controls="${rawId}">${escapeHtml(detailLabel)}</summary><pre id="${rawId}">${escapeHtml(entry.raw)}</pre></details>`
          : '';

        const content = `
          <strong>${escapeHtml(label)}</strong>
          <p id="${summaryId}">${escapeHtml(entry.summary)}</p>
          ${rawSection}
        `;

        if (entry.kind === 'lifecycle') {
          return `<li id="${entryAnchorId}"><details><summary aria-describedby="${summaryId}">${escapeHtml(label)} event</summary>${content}</details></li>`;
        }

        return `<li id="${entryAnchorId}">${content}</li>`;
      }).join('')}
    </ol>
  `;
}

function renderSelectedRecord() {
  if (!viewState.selectedRecord) {
    return '<p>No saved run selected.</p>';
  }

  const record = viewState.selectedRecord;
  const transcriptEntries = toTranscriptEntries(record);
  const filteredTranscriptEntries = filterTranscriptEntries(transcriptEntries, viewState.savedTranscriptFilter);
  return `
    <section aria-labelledby="saved-run-heading">
      <h2 id="saved-run-heading">Saved run details</h2>
      <p><strong>File:</strong> ${escapeHtml(record.fileName)}</p>
      <p><strong>Summary:</strong> ${escapeHtml(record.spokenSummary)}</p>
      <p><strong>Exit code:</strong> ${escapeHtml(record.exitCode)}</p>
      <p><strong>Status:</strong> ${escapeHtml(record.runtimeSummary?.headline || 'No runtime summary')}</p>
      <p><strong>Workspace:</strong> ${escapeHtml(record.projectPath || 'Unknown')}</p>
      <p><strong>Transcript entries:</strong> ${escapeHtml(record.transcriptEntryCount ?? transcriptEntries.length)}</p>
      <p><strong>Change hints:</strong> ${escapeHtml(record.changeHints ?? 0)}</p>
      <p><strong>Error entries:</strong> ${escapeHtml(record.errorCount ?? 0)}</p>
      <p><strong>Prompt entries:</strong> ${escapeHtml(record.promptCount ?? 0)}</p>
      ${renderTranscriptNavigation(transcriptEntries, {
        headingId: 'saved-run-important-heading',
        idPrefix: 'transcript-entry',
        filter: viewState.savedTranscriptFilter,
        filterLabel: 'Saved transcript filter',
        emptyMessage: 'No saved transcript entries match the current filter.',
      })}
      <button type="button" id="clear-history-selection-button">Back to live view</button>
      ${renderTranscript(filteredTranscriptEntries)}
    </section>
  `;
}

function renderTranscriptNavigation(entries, options = {}) {
  const headingId = options.headingId || 'transcript-important-heading';
  const idPrefix = options.idPrefix || 'transcript-entry';
  const filter = options.filter || 'all';
  const filterLabel = options.filterLabel || 'Transcript filter';
  const emptyMessage = options.emptyMessage || 'No transcript entries match the current filter.';
  const summary = summarizeTranscriptEntries(entries);
  const filteredEntries = filterTranscriptEntries(entries, filter);
  const firstErrorIndex = entries.findIndex((entry) => entry?.kind === 'error');
  const firstPromptIndex = entries.findIndex((entry) => entry?.kind === 'prompt');
  const firstChangeIndex = entries.findIndex((entry) => entry?.kind === 'change-hint');

  return `
    <section aria-labelledby="${headingId}">
      <h3 id="${headingId}">Important details</h3>
      <ul>
        <li><strong>Errors in transcript:</strong> ${escapeHtml(summary.errors)}</li>
        <li><strong>Prompts in transcript:</strong> ${escapeHtml(summary.prompts)}</li>
        <li><strong>Change hints in transcript:</strong> ${escapeHtml(summary.changes)}</li>
      </ul>
      <div aria-label="Transcript quick jumps">
        ${firstErrorIndex >= 0 ? `<button type="button" class="transcript-jump-button" data-target-id="${idPrefix}-${firstErrorIndex}">Jump to first error</button>` : ''}
        ${firstPromptIndex >= 0 ? `<button type="button" class="transcript-jump-button" data-target-id="${idPrefix}-${firstPromptIndex}">Jump to first prompt</button>` : ''}
        ${firstChangeIndex >= 0 ? `<button type="button" class="transcript-jump-button" data-target-id="${idPrefix}-${firstChangeIndex}">Jump to first change hint</button>` : ''}
      </div>
      <div aria-label="Transcript filters">
        <button type="button" class="transcript-filter-button" data-target-scope="${escapeHtml(idPrefix)}" data-filter="all">All entries</button>
        <button type="button" class="transcript-filter-button" data-target-scope="${escapeHtml(idPrefix)}" data-filter="errors">Errors</button>
        <button type="button" class="transcript-filter-button" data-target-scope="${escapeHtml(idPrefix)}" data-filter="changes">Changes</button>
        <button type="button" class="transcript-filter-button" data-target-scope="${escapeHtml(idPrefix)}" data-filter="prompts">Prompts</button>
      </div>
      <p><strong>${escapeHtml(filterLabel)}:</strong> ${escapeHtml(filter)}</p>
      ${filteredEntries.length ? '' : `<p>${escapeHtml(emptyMessage)}</p>`}
    </section>
  `;
}
    <section aria-labelledby="${headingId}">
      <h3 id="${headingId}">Important details</h3>
      <ul>
        <li><strong>Errors in transcript:</strong> ${escapeHtml(summary.errors)}</li>
        <li><strong>Prompts in transcript:</strong> ${escapeHtml(summary.prompts)}</li>
        <li><strong>Change hints in transcript:</strong> ${escapeHtml(summary.changes)}</li>
      </ul>
      <div aria-label="Transcript quick jumps">
        ${firstErrorIndex >= 0 ? `<button type="button" class="transcript-jump-button" data-target-id="${idPrefix}-${firstErrorIndex}">Jump to first error</button>` : ''}
        ${firstPromptIndex >= 0 ? `<button type="button" class="transcript-jump-button" data-target-id="${idPrefix}-${firstPromptIndex}">Jump to first prompt</button>` : ''}
        ${firstChangeIndex >= 0 ? `<button type="button" class="transcript-jump-button" data-target-id="${idPrefix}-${firstChangeIndex}">Jump to first change hint</button>` : ''}
      </div>
    </section>
  `;
}

function filterHistoryItems(history) {
  if (viewState.historyFilter === 'errors') {
    return history.filter((item) => (item.errorCount ?? 0) > 0);
  }
  if (viewState.historyFilter === 'changes') {
    return history.filter((item) => (item.changeHints ?? 0) > 0);
  }
  if (viewState.historyFilter === 'prompts') {
    return history.filter((item) => (item.promptCount ?? 0) > 0);
  }
  return history;
}

function renderHistory(history) {
  if (!history.length) {
    return '<p>No saved sessions yet.</p>';
  }

  const withErrors = history.filter((item) => (item.errorCount ?? 0) > 0);
  const withChanges = history.filter((item) => (item.changeHints ?? 0) > 0);
  const withPrompts = history.filter((item) => (item.promptCount ?? 0) > 0);
  const filteredHistory = filterHistoryItems(history);

  return `
    <section aria-labelledby="history-summary-heading">
      <h3 id="history-summary-heading">History summary</h3>
      <ul>
        <li><strong>Runs with errors:</strong> ${escapeHtml(withErrors.length)}</li>
        <li><strong>Runs with change hints:</strong> ${escapeHtml(withChanges.length)}</li>
        <li><strong>Runs with prompts:</strong> ${escapeHtml(withPrompts.length)}</li>
      </ul>
      <div aria-label="History filters">
        <button type="button" class="history-filter-button" data-filter="all">All runs</button>
        <button type="button" class="history-filter-button" data-filter="errors">Errors</button>
        <button type="button" class="history-filter-button" data-filter="changes">Changes</button>
        <button type="button" class="history-filter-button" data-filter="prompts">Prompts</button>
      </div>
      <p><strong>Active filter:</strong> ${escapeHtml(viewState.historyFilter)}</p>
    </section>
    ${filteredHistory.length ? `
      <ul>
        ${filteredHistory.map((item) => {
          const isSelected = item.fileName === viewState.selectedHistoryFile;
          const statusLabel = item.runtimeStatus || 'unknown';
          const badges = [
            (item.errorCount ?? 0) > 0 ? 'error' : '',
            (item.changeHints ?? 0) > 0 ? 'changes' : '',
            (item.promptCount ?? 0) > 0 ? 'prompt' : '',
          ].filter(Boolean).join(', ') || 'clean';
          const timingLabel = item.endedAt || item.startedAt || item.timestampGuess || 'unknown time';
          return `
            <li>
              <button type="button" class="history-load-button" data-file-name="${escapeHtml(item.fileName)}">
                ${isSelected ? 'Selected' : 'Load'}
              </button>
              <strong>${isSelected ? '▶ ' : ''}</strong>${escapeHtml(item.fileName)} | ${escapeHtml(item.adapter)} | ${escapeHtml(statusLabel)} | exit ${escapeHtml(item.exitCode)} | flags ${escapeHtml(badges)} | ${escapeHtml(timingLabel)} | ${escapeHtml(item.spokenSummary)}
            </li>
          `;
        }).join('')}
      </ul>
    ` : '<p>No saved sessions match the current filter.</p>'}
  `;
}

function getSetupReadiness() {
  const setup = viewState.onboarding || {};
  if (!setup.codexDetected) {
    return {
      ready: false,
      label: 'Setup incomplete',
      message: 'Codex CLI is not detected yet. Run the setup check first.',
    };
  }
  if (!setup.projectValid) {
    return {
      ready: false,
      label: 'Setup incomplete',
      message: 'Choose and validate a project workspace before relying on runs in the selected folder.',
    };
  }
  return {
    ready: true,
    label: 'Setup ready',
    message: 'Codex CLI is detected and a workspace is selected. You can start sessions with the chosen setup.',
  };
}

function renderOnboardingPanel() {
  const setup = viewState.onboarding || { codexDetected: false, codexPath: '', codexHelpText: 'Run setup check to detect Codex CLI.' };
  const readiness = getSetupReadiness();
  return `
    <section aria-labelledby="onboarding-heading">
      <h2 id="onboarding-heading">Setup and onboarding</h2>
      <ul>
        <li><strong>CLI detection:</strong> ${setup.codexDetected ? 'Codex detected' : 'Codex not detected'}</li>
        <li><strong>CLI path:</strong> ${escapeHtml(setup.codexPath || 'Not detected yet')}</li>
        <li><strong>Project path:</strong> ${escapeHtml(setup.projectPath || 'Not chosen yet')}</li>
        <li><strong>Project validation:</strong> ${setup.projectValid ? 'Valid directory and selected workspace' : 'Not validated yet'}</li>
        <li><strong>Voice test:</strong> Use the Voice section below to speak or transcribe audio.</li>
        <li><strong>Safety review:</strong> Confirmation prompts stay explicit in the runtime panel.</li>
      </ul>
      <p id="setup-readiness-message"><strong>${escapeHtml(readiness.label)}:</strong> ${escapeHtml(readiness.message)}</p>
      <p id="onboarding-codex-help">${escapeHtml(setup.codexHelpText)}</p>
      <form id="onboarding-project-form" aria-describedby="setup-readiness-message onboarding-project-help">
        <label for="onboarding-project-path">Project path</label>
        <input id="onboarding-project-path" name="projectPath" type="text" value="${escapeHtml(setup.projectPath || '')}" placeholder="/path/to/project" autocomplete="off" spellcheck="false" />
        <button type="submit" id="onboarding-validate-project-button">Validate project path</button>
      </form>
      <p id="onboarding-project-help">${escapeHtml(setup.projectHelpText || '')}</p>
      <button type="button" id="onboarding-detect-codex-button" aria-describedby="onboarding-codex-help">Check Codex CLI</button>
    </section>
  `;
}

function renderVoiceControls() {
  return `
    <section aria-labelledby="voice-heading">
      <h2 id="voice-heading">Voice</h2>
      <form id="voice-speak-form">
        <label for="voice-speak-text">Speak text</label>
        <input id="voice-speak-text" name="text" type="text" value="Voice CLI is ready." />
        <button id="voice-speak-button" type="submit">Speak</button>
      </form>
      <form id="voice-transcribe-form" aria-describedby="voice-status-message">
        <label for="voice-transcribe-path">Transcribe audio file</label>
        <input id="voice-transcribe-path" name="audioPath" type="text" placeholder="/path/to/audio.m4a" autocomplete="off" spellcheck="false" />
        <button id="voice-transcribe-button" type="submit">Transcribe with Whisper</button>
      </form>
      <div>
        <button type="button" id="voice-record-button" aria-pressed="${viewState.isRecordingVoice ? 'true' : 'false'}">${viewState.isRecordingVoice ? 'Stop recording and transcribe' : 'Record and transcribe'}</button>
        <button type="button" id="voice-start-from-transcript-button" ${viewState.isStartingSession || viewState.isSessionRunning || !String(viewState.draftPrompt || '').trim() ? 'disabled' : ''}>Start session from transcribed prompt</button>
      </div>
      ${viewState.lastVoiceMessage ? `<p id="voice-status-message"><strong>Voice status:</strong> ${escapeHtml(viewState.lastVoiceMessage)}</p>` : '<p id="voice-status-message"><strong>Voice status:</strong> No voice action yet.</p>'}
    </section>
  `;
}

function renderShell(runtimeState, history) {
  const confirmationSection = runtimeState.confirmation ? `
    <section aria-labelledby="confirmation-heading">
      <h2 id="confirmation-heading" tabindex="-1">Confirmation required</h2>
      <p><strong>Action:</strong> ${escapeHtml(runtimeState.confirmation.actionLabel)}</p>
      <p><strong>Reason:</strong> ${escapeHtml(runtimeState.confirmation.reason)}</p>
      <p><strong>Risk level:</strong> ${escapeHtml(runtimeState.confirmation.riskLevel || 'high')}</p>
      <p id="confirmation-help">This response may approve or deny a consequential CLI action. Reply explicitly with <strong>yes</strong> to approve or <strong>no</strong> to deny.</p>
      <form id="session-input-form" aria-describedby="confirmation-help confirmation-followup-help">
        <label for="session-input-response">Response</label>
        <input id="session-input-response" name="response" type="text" value="${escapeHtml(runtimeState.controls.currentInputDraft || 'yes')}" />
        <button id="session-input-button" type="submit">Send response</button>
      </form>
      <p id="confirmation-followup-help">After you respond, the runtime status and saved run details will update below.</p>
    </section>
  ` : '';

  const transcriptEntries = toTranscriptEntries(runtimeState);
  const filteredLiveTranscriptEntries = filterTranscriptEntries(transcriptEntries, viewState.liveTranscriptFilter);
  const readiness = getSetupReadiness();
  const startButtonLabel = viewState.isStartingSession || viewState.isSessionRunning ? 'Running…' : 'Start session';
  const startDisabled = viewState.isStartingSession || viewState.isSessionRunning ? 'disabled' : '';

  return `
    <section aria-labelledby="runtime-heading">
      <h2 id="runtime-heading" tabindex="-1">Runtime status</h2>
      <div id="app-live-region" role="status" aria-live="polite" aria-atomic="true">${escapeHtml(viewState.liveMessage || 'App ready.')}</div>
      ${renderBanner(runtimeState.runtimeSummary)}
      ${renderStatusBadge(runtimeState.runtimeSummary)}
      <p>${escapeHtml(runtimeState.runtimeSummary.headline)}</p>
    </section>
    ${renderRunSummary(runtimeState, history)}
    ${renderOnboardingPanel()}
    <section aria-labelledby="controls-heading">
      <h2 id="controls-heading">Session controls</h2>
      <p><strong>Setup status:</strong> ${escapeHtml(readiness.message)}</p>
      <form id="session-start-form" aria-describedby="session-controls-help">
        <label for="session-start-prompt">Start prompt</label>
        <input id="session-start-prompt" name="prompt" type="text" value="${escapeHtml(viewState.draftPrompt || 'Summarize the current project state.')}" ${startDisabled} />
        <button id="session-start-button" type="submit" ${startDisabled}>${startButtonLabel}</button>
      </form>
      <p id="session-controls-help">Prompt input starts a CLI session in the selected workspace. Transcript details appear below. If a run fails, retry with a simpler prompt or re-check setup first.</p>
    </section>
    ${confirmationSection}
    ${renderVoiceControls()}
    <section aria-labelledby="transcript-heading">
      <h2 id="transcript-heading">Live transcript</h2>
      ${renderTranscriptNavigation(transcriptEntries, {
        headingId: 'live-transcript-important-heading',
        idPrefix: 'live-transcript-entry',
        filter: viewState.liveTranscriptFilter,
        filterLabel: 'Live transcript filter',
        emptyMessage: 'No live transcript entries match the current filter.',
      })}
      ${renderTranscript(filteredLiveTranscriptEntries, { idPrefix: 'live-transcript-entry' })}
    </section>
    <section aria-labelledby="history-heading">
      <h2 id="history-heading">Session history</h2>
      <p>${history.length} recorded sessions.</p>
      ${renderHistory(history)}
    </section>
    ${renderSelectedRecord()}
  `;
}

function stopTimingRefresh() {
  if (viewState.timingIntervalId) {
    clearInterval(viewState.timingIntervalId);
    viewState.timingIntervalId = null;
  }
}

function startTimingRefresh(target) {
  stopTimingRefresh();
  viewState.timingIntervalId = setInterval(() => {
    if (!viewState.isStartingSession && !viewState.isSessionRunning) {
      stopTimingRefresh();
      return;
    }
    renderIntoTarget(target).catch(() => {});
  }, 250);
}

async function maybeAutoSelectLatestHistory() {
  if (!viewState.lastOutcome || viewState.lastOutcome !== 'completed') return;
  const history = await window.voiceCli?.session?.getHistory?.();
  if (!Array.isArray(history) || !history.length) return;
  const latest = history[0];
  if (!latest?.fileName) return;
  viewState.selectedHistoryFile = latest.fileName;
  viewState.selectedRecord = await window.voiceCli?.session?.getSessionRecord?.(latest.fileName);
}

function stopVoiceStream() {
  if (viewState.mediaStream) {
    for (const track of viewState.mediaStream.getTracks()) {
      track.stop();
    }
  }
  viewState.mediaStream = null;
  viewState.mediaRecorder = null;
  viewState.recordedChunks = [];
  viewState.isRecordingVoice = false;
}

async function loadTranscriptionText(transcription) {
  const outPath = String(transcription?.outPath || '').trim();
  if (!outPath) return '';

  try {
    const result = await window.voiceCli?.voice?.loadTranscriptionText?.(outPath);
    return result?.ok ? String(result.text || '').trim() : '';
  } catch {
    return '';
  }
}

async function persistAndTranscribeRecordedAudio(target) {
  const blob = new Blob(viewState.recordedChunks, { type: 'audio/webm' });
  const arrayBuffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  const bufferBase64 = btoa(binary);

  const persisted = await window.voiceCli?.voice?.persistCapturedAudio?.(bufferBase64, {
    extension: 'webm',
    mimeType: 'audio/webm',
  });

  if (!persisted?.ok || !persisted?.filePath) {
    viewState.lastVoiceMessage = `Capture save failed: ${persisted?.reason || 'unknown error'}`;
    setLiveMessage(viewState.lastVoiceMessage);
    await renderIntoTarget(target);
    return;
  }

  const transcription = await window.voiceCli?.voice?.transcribeAudio?.(persisted.filePath, {
    model: 'whisper-1',
    language: 'en',
  });

  if (transcription?.ok) {
    const transcriptText = await loadTranscriptionText(transcription);
    if (transcriptText) {
      viewState.draftPrompt = transcriptText;
      viewState.lastVoiceMessage = `Recorded audio transcribed and loaded into the prompt. Provider: ${transcription.provider || 'Whisper'}. Output: ${transcription.outPath}`;
    } else {
      viewState.lastVoiceMessage = `Recorded audio transcribed with ${transcription.provider || 'Whisper'}. Output: ${transcription.outPath}`;
    }
  } else {
    const fallbackHint = transcription?.fallbackRecommended ? ' Use transcript-first fallback or provide a different audio file.' : '';
    viewState.lastVoiceMessage = `Recorded transcription failed: ${transcription?.reason || 'unknown error'}.${fallbackHint}`;
  }
  setLiveMessage(viewState.lastVoiceMessage);
  await renderIntoTarget(target);
}

async function startSessionFromPrompt(target, prompt) {
  if (viewState.isStartingSession || viewState.isSessionRunning) return;
  const normalizedPrompt = String(prompt || '').trim() || 'Summarize the current project state.';
  viewState.draftPrompt = normalizedPrompt;
  viewState.isStartingSession = true;
  viewState.isSessionRunning = false;
  viewState.activePrompt = normalizedPrompt;
  viewState.runStartedAt = Date.now();
  viewState.lastOutcome = 'running';
  setLiveMessage('Starting session. Runtime updates will appear below.');
  startTimingRefresh(target);
  await renderIntoTarget(target);
  focusElementById('runtime-heading');
  writePageDiagnostic(`Submitting prompt: ${normalizedPrompt}`);
  try {
    await window.voiceCli?.session?.start?.(normalizedPrompt);
    viewState.lastOutcome = 'completed';
    setLiveMessage('Session completed. Latest transcript and saved run details are available.');
    await maybeAutoSelectLatestHistory();
  } catch (error) {
    viewState.lastOutcome = 'error';
    setLiveMessage(`Session failed. ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  } finally {
    viewState.isStartingSession = false;
    viewState.isSessionRunning = false;
    stopTimingRefresh();
    await renderIntoTarget(target);
  }
  writePageDiagnostic('Runtime shell rerendered after start.');
}

async function bindInteractions(target) {
  const form = document.getElementById('session-start-form');
  const promptInput = document.getElementById('session-start-prompt');
  if (form) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const prompt = promptInput && 'value' in promptInput && typeof promptInput.value === 'string'
        ? promptInput.value
        : (viewState.draftPrompt || 'Summarize the current project state.');
      await startSessionFromPrompt(target, prompt);
    });
  }

  const inputForm = document.getElementById('session-input-form');
  const responseInput = document.getElementById('session-input-response');
  if (inputForm) {
    inputForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const response = responseInput && 'value' in responseInput && typeof responseInput.value === 'string'
        ? responseInput.value
        : 'yes';
      writePageDiagnostic(`Submitting confirmation response: ${response}`);
      await window.voiceCli?.session?.sendInput?.(response);
      viewState.lastOutcome = 'completed';
      viewState.isSessionRunning = false;
      const normalizedResponse = String(response || '').trim().toLowerCase();
      const followup = normalizedResponse === 'yes' || normalizedResponse === 'y'
        ? 'The requested action was approved.'
        : normalizedResponse === 'no' || normalizedResponse === 'n'
          ? 'The requested action was denied.'
          : 'The CLI received your response.';
      setLiveMessage(`Confirmation response sent: ${response}. ${followup}`);
      await maybeAutoSelectLatestHistory();
      await renderIntoTarget(target);
      focusElementById('runtime-heading');
      writePageDiagnostic('Runtime shell rerendered after input response.');
    });
  }

  document.querySelectorAll('.history-load-button').forEach((button) => {
    button.addEventListener('click', async () => {
      const fileName = button.getAttribute('data-file-name') || '';
      if (!fileName) return;
      viewState.selectedHistoryFile = fileName;
      viewState.selectedRecord = await window.voiceCli?.session?.getSessionRecord?.(fileName);
      setLiveMessage(`Loaded saved session record ${fileName}.`);
      await renderIntoTarget(target);
      focusElementById('saved-run-heading');
      writePageDiagnostic(`Loaded saved session record: ${fileName}`);
    });
  });

  document.querySelectorAll('.history-filter-button').forEach((button) => {
    button.addEventListener('click', async () => {
      const filter = button.getAttribute('data-filter') || 'all';
      viewState.historyFilter = filter;
      setLiveMessage(`History filter changed to ${filter}.`);
      await renderIntoTarget(target);
      focusElementById('history-heading');
      writePageDiagnostic(`History filter changed: ${filter}`);
    });
  });

  const clearButton = document.getElementById('clear-history-selection-button');
  if (clearButton) {
    clearButton.addEventListener('click', async () => {
      viewState.selectedHistoryFile = '';
      viewState.selectedRecord = null;
      setLiveMessage('Returned to live runtime view.');
      await renderIntoTarget(target);
      focusElementById('runtime-heading');
      writePageDiagnostic('Returned to live-only view.');
    });
  }

  document.querySelectorAll('.transcript-jump-button').forEach((button) => {
    button.addEventListener('click', async () => {
      const targetId = button.getAttribute('data-target-id') || '';
      if (!targetId) return;
      setLiveMessage(`Jumping to ${targetId.replace('transcript-entry-', 'transcript entry ')}.`);
      const targetElement = document.getElementById(targetId);
      if (targetElement && typeof targetElement.scrollIntoView === 'function') {
        targetElement.scrollIntoView({ block: 'center' });
      }
      if (targetElement && typeof targetElement.focus === 'function') {
        targetElement.focus();
      }
      writePageDiagnostic(`Transcript quick jump used: ${targetId}`);
    });
  });

  document.querySelectorAll('.transcript-filter-button').forEach((button) => {
    button.addEventListener('click', async () => {
      const filter = button.getAttribute('data-filter') || 'all';
      const scope = button.getAttribute('data-target-scope') || '';
      if (scope === 'live-transcript-entry') {
        viewState.liveTranscriptFilter = filter;
        setLiveMessage(`Live transcript filter changed to ${filter}.`);
      } else {
        viewState.savedTranscriptFilter = filter;
        setLiveMessage(`Saved transcript filter changed to ${filter}.`);
      }
      await renderIntoTarget(target);
      focusElementById(scope === 'live-transcript-entry' ? 'transcript-heading' : 'saved-run-heading');
      writePageDiagnostic(`Transcript filter changed: ${scope} -> ${filter}`);
    });
  });

  const detectCodexButton = document.getElementById('onboarding-detect-codex-button');
  if (detectCodexButton) {
    detectCodexButton.addEventListener('click', async () => {
      const result = await window.voiceCli?.onboarding?.detectCodexCli?.();
      viewState.onboarding = {
        ...viewState.onboarding,
        codexDetected: Boolean(result?.detected),
        codexPath: result?.binaryPath || '',
        codexHelpText: result?.helpText || 'No setup result available.',
      };
      await window.voiceCli?.onboarding?.saveSettings?.({
        preferredCli: 'codex',
        onboardingCodexDetected: viewState.onboarding.codexDetected,
        onboardingCodexPath: viewState.onboarding.codexPath,
      });
      setLiveMessage(viewState.onboarding.codexHelpText);
      await renderIntoTarget(target);
      focusElementById('onboarding-heading');
      writePageDiagnostic(`Onboarding Codex detection result: ${viewState.onboarding.codexHelpText}`);
    });
  }

  const projectForm = document.getElementById('onboarding-project-form');
  const projectInput = document.getElementById('onboarding-project-path');
  if (projectForm) {
    projectForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const projectPath = projectInput && 'value' in projectInput && typeof projectInput.value === 'string' ? projectInput.value : '';
      const result = await window.voiceCli?.onboarding?.validateProjectPath?.(projectPath);
      viewState.onboarding = {
        ...viewState.onboarding,
        projectPath: result?.projectPath || projectPath,
        projectValid: Boolean(result?.valid),
        projectHelpText: result?.helpText || 'No project validation result available.',
      };
      if (viewState.onboarding.projectValid) {
        viewState.lastVoiceMessage = `Selected workspace saved: ${viewState.onboarding.projectPath}`;
        setLiveMessage(`Workspace validated and saved: ${viewState.onboarding.projectPath}`);
      } else {
        setLiveMessage(viewState.onboarding.projectHelpText || 'Project validation did not succeed.');
      }
      await window.voiceCli?.onboarding?.saveSettings?.({
        onboardingProjectPath: viewState.onboarding.projectPath,
        onboardingProjectValid: viewState.onboarding.projectValid,
      });
      await renderIntoTarget(target);
      focusElementById('onboarding-project-path');
      writePageDiagnostic(`Onboarding project validation result: ${viewState.onboarding.projectHelpText}`);
    });
  }

  const speakForm = document.getElementById('voice-speak-form');
  const speakInput = document.getElementById('voice-speak-text');
  if (speakForm) {
    speakForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const text = speakInput && 'value' in speakInput && typeof speakInput.value === 'string' ? speakInput.value : '';
      const result = await window.voiceCli?.voice?.speakText?.(text, { rate: 1.0 });
      if (result?.ok) {
        viewState.lastVoiceMessage = `Spoken via ${result.backend || 'tts backend'} at rate ${result.rate || 1.0}.`;
      } else {
        const fallbackHint = result?.fallbackRecommended ? ' Transcript-first fallback remains available.' : '';
        viewState.lastVoiceMessage = `Speak failed: ${result?.reason || 'unknown error'}.${fallbackHint} Check local TTS availability if this should have spoken aloud.`;
      }
      setLiveMessage(viewState.lastVoiceMessage);
      await renderIntoTarget(target);
      writePageDiagnostic(`Voice speak result: ${viewState.lastVoiceMessage}`);
    });
  }

  const transcribeForm = document.getElementById('voice-transcribe-form');
  const transcribeInput = document.getElementById('voice-transcribe-path');
  if (transcribeForm) {
    transcribeForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const audioPath = transcribeInput && 'value' in transcribeInput && typeof transcribeInput.value === 'string' ? transcribeInput.value : '';
      const result = await window.voiceCli?.voice?.transcribeAudio?.(audioPath, { model: 'whisper-1', language: 'en' });
      if (result?.ok) {
        const transcriptText = await loadTranscriptionText(result);
        if (transcriptText) {
          viewState.draftPrompt = transcriptText;
          viewState.lastVoiceMessage = `Transcribed with ${result.provider || 'Whisper'} and loaded into the prompt. Output: ${result.outPath}`;
        } else {
          viewState.lastVoiceMessage = `Transcribed with ${result.provider || 'Whisper'}. Output: ${result.outPath}`;
        }
      } else {
        const fallbackHint = result?.fallbackRecommended ? ' Try transcript-first fallback or a different audio file.' : '';
        viewState.lastVoiceMessage = `Transcription failed: ${result?.reason || 'unknown error'}.${fallbackHint} Verify the audio path and file format before retrying.`;
      }
      setLiveMessage(viewState.lastVoiceMessage);
      await renderIntoTarget(target);
      focusElementById('session-start-prompt');
      writePageDiagnostic(`Voice transcription result: ${viewState.lastVoiceMessage}`);
    });
  }

  const recordButton = document.getElementById('voice-record-button');
  if (recordButton) {
    recordButton.addEventListener('click', async () => {
      if (!viewState.isRecordingVoice) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
          viewState.mediaStream = stream;
          viewState.mediaRecorder = mediaRecorder;
          viewState.recordedChunks = [];
          viewState.isRecordingVoice = true;
          viewState.lastVoiceMessage = 'Recording audio now.';
          setLiveMessage(viewState.lastVoiceMessage);

          mediaRecorder.addEventListener('dataavailable', (event) => {
            if (event.data && event.data.size > 0) {
              viewState.recordedChunks.push(event.data);
            }
          });

          mediaRecorder.addEventListener('stop', async () => {
            try {
              await persistAndTranscribeRecordedAudio(target);
            } finally {
              stopVoiceStream();
            }
          });

          mediaRecorder.start();
          await renderIntoTarget(target);
          writePageDiagnostic('Voice recording started.');
        } catch (error) {
          stopVoiceStream();
          viewState.lastVoiceMessage = `Microphone start failed: ${error instanceof Error ? error.message : String(error)}`;
          setLiveMessage(viewState.lastVoiceMessage);
          await renderIntoTarget(target);
          writePageDiagnostic(`Voice recording start failed: ${viewState.lastVoiceMessage}`);
        }
        return;
      }

      try {
        viewState.lastVoiceMessage = 'Stopping recording and transcribing audio.';
        setLiveMessage(viewState.lastVoiceMessage);
        await renderIntoTarget(target);
        viewState.mediaRecorder?.stop();
        writePageDiagnostic('Voice recording stopped for transcription.');
      } catch (error) {
        stopVoiceStream();
        viewState.lastVoiceMessage = `Microphone stop failed: ${error instanceof Error ? error.message : String(error)}`;
        setLiveMessage(viewState.lastVoiceMessage);
        await renderIntoTarget(target);
        writePageDiagnostic(`Voice recording stop failed: ${viewState.lastVoiceMessage}`);
      }
    });
  }

  const startFromTranscriptButton = document.getElementById('voice-start-from-transcript-button');
  if (startFromTranscriptButton) {
    startFromTranscriptButton.addEventListener('click', async () => {
      const prompt = String(viewState.draftPrompt || '').trim();
      if (!prompt) {
        viewState.lastVoiceMessage = 'No transcribed prompt is available to start yet.';
        setLiveMessage(viewState.lastVoiceMessage);
        await renderIntoTarget(target);
        return;
      }
      viewState.lastVoiceMessage = 'Starting session from the current transcribed prompt.';
      setLiveMessage(viewState.lastVoiceMessage);
      await renderIntoTarget(target);
      await startSessionFromPrompt(target, prompt);
    });
  }
}

async function renderIntoTarget(target) {
  const runtimeState = window.voiceCli?.session?.getState?.() ?? {
    runtimeSummary: { status: 'ok', headline: 'Electron runtime ready.' },
    confirmation: null,
    controls: { canStartSession: true, canSendInput: false, currentInputDraft: '' },
    events: [],
    transcript: [],
  };
  const historyResult = await window.voiceCli?.session?.getHistory?.();
  const history = Array.isArray(historyResult) ? historyResult : [];
  target.innerHTML = renderShell(runtimeState, history);
  await bindInteractions(target);
  await maybeSpeakRuntimeSummary(runtimeState);
}

async function mount() {
  writePageDiagnostic('DOMContentLoaded fired.');
  const target = document.getElementById('app');
  if (!target) {
    throw new Error('Missing #app mount target.');
  }

  const savedSettings = await window.voiceCli?.onboarding?.loadSettings?.();
  viewState.onboarding = {
    ...viewState.onboarding,
    projectPath: savedSettings?.onboardingProjectPath || '',
    projectValid: Boolean(savedSettings?.onboardingProjectValid),
    codexPath: savedSettings?.onboardingCodexPath || '',
    codexDetected: Boolean(savedSettings?.onboardingCodexDetected),
  };

  const detectResult = await window.voiceCli?.onboarding?.detectCodexCli?.();
  viewState.onboarding = {
    ...viewState.onboarding,
    codexDetected: Boolean(detectResult?.detected),
    codexPath: detectResult?.binaryPath || viewState.onboarding.codexPath,
    codexHelpText: detectResult?.helpText || 'Run setup check to detect Codex CLI.',
    projectHelpText: viewState.onboarding.projectHelpText || 'Enter a local project path to validate it.',
  };

  await window.voiceCli?.onboarding?.saveSettings?.({
    preferredCli: 'codex',
    onboardingCodexDetected: viewState.onboarding.codexDetected,
    onboardingCodexPath: viewState.onboarding.codexPath,
    onboardingProjectPath: viewState.onboarding.projectPath,
    onboardingProjectValid: viewState.onboarding.projectValid,
  });

  await renderIntoTarget(target);
  writePageDiagnostic('Runtime shell rendered into #app.');

  window.voiceCli?.session?.onEvent?.(async (event) => {
    if (event?.type === 'session.progress') {
      viewState.isStartingSession = false;
      viewState.isSessionRunning = true;
    }
    if (event?.type === 'session.exited') {
      viewState.isStartingSession = false;
      viewState.isSessionRunning = false;
    }
    if (event?.type === 'prompt.detected') {
      viewState.isStartingSession = false;
      viewState.isSessionRunning = true;
      setLiveMessage('Confirmation required. Review the action, reason, and risk before responding yes or no.');
    }
    await renderIntoTarget(target);
    writePageDiagnostic('Runtime shell rerendered after event.');
  });

  const testMode = window.voiceCli?.electron?.getTestMode?.() || '';
  if (testMode === 'confirmation') {
    viewState.activePrompt = 'Please approve file changes?';
    viewState.runStartedAt = Date.now();
    await window.voiceCli?.session?.start?.('Please approve file changes?');
    await renderIntoTarget(target);
    focusElementById('confirmation-heading');
    writePageDiagnostic('Test mode seeded confirmation flow.');
    setTimeout(async () => {
      await window.voiceCli?.session?.sendInput?.('yes');
      viewState.lastOutcome = 'completed';
      await maybeAutoSelectLatestHistory();
      await renderIntoTarget(target);
      focusElementById('runtime-heading');
      writePageDiagnostic('Test mode auto-approved confirmation flow.');
    }, 150);
  }

  if (testMode === 'real-session') {
    viewState.isStartingSession = true;
    viewState.isSessionRunning = false;
    viewState.activePrompt = 'Say hello briefly.';
    viewState.runStartedAt = Date.now();
    viewState.lastOutcome = 'running';
    startTimingRefresh(target);
    await renderIntoTarget(target);
    await window.voiceCli?.session?.start?.('Say hello briefly.');
    viewState.isStartingSession = false;
    viewState.isSessionRunning = false;
    viewState.lastOutcome = 'completed';
    stopTimingRefresh();
    await maybeAutoSelectLatestHistory();
    await renderIntoTarget(target);
    writePageDiagnostic('Test mode started real IPC-backed session flow.');
  }

  if (window.voiceCli?.electron?.shouldAutoExit?.()) {
    writePageDiagnostic('Auto-exit requested.');
    setTimeout(() => {
      stopTimingRefresh();
      window.close();
    }, testMode === 'confirmation' ? 1200 : 900);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  mount().catch((error) => {
    writePageDiagnostic(`Mount failed: ${error instanceof Error ? error.message : String(error)}`);
  });
});
