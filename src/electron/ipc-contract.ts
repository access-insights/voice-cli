export interface IpcContract {
  session: {
    start: 'session:start';
    sendInput: 'session:send-input';
    getHistory: 'session:get-history';
  };
  settings: {
    load: 'settings:load';
    save: 'settings:save';
  };
}

export function createIpcContract(): IpcContract {
  return {
    session: {
      start: 'session:start',
      sendInput: 'session:send-input',
      getHistory: 'session:get-history',
    },
    settings: {
      load: 'settings:load',
      save: 'settings:save',
    },
  };
}
