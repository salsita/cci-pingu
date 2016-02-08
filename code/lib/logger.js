// Module that overrides console functions:
// + log()   ... the highest (most verbose) logging level
// + info()
// + warn()
// + error() ... the lowest (least verbose) logging level
//
// Features:
// + timestamp as part of the logged message
// + (optionally) application name as part of the logged messsage
// + log-level as part of the message
// + logging based on log-level
//
// Interface:
// + install(level = null, name = null)
//       Set new console handlers:
//       - level: 'log' || 'info' (default) || 'warn' || 'error'
//       - name :  any string (not set by default)
//       Return true on success, false on failure.
// + uninstall()
//       Release installed handlers, restore console original behavior.
//       Return true on success, false on failure.
// + level(value = null)
//       Get or set logging level, anything above that level will be logged:
//       - value: 'log' || 'info' || 'warn' || 'error'
//       If value is not provided, current log-level is returned.
//       On error, setter returns false.
// + name(name = null)
//       Get or set application name.
//       - name: any string
//       If value is not provided, current application name is returned.

// need to be able to inject different console object for unit tests...
let _console = console;

const levels = {
  log: 4,
  info: 3,
  warn: 2,
  error: 1
};

const state = {
  // original console handlers
  _log: null,
  _info: null,
  _warn: null,
  _error: null,
  // log level
  level: levels.info,
  // application name
  name: null
};

// pad with zeros from left
function pad(what, len = 2, c = '0') {
  let res = '' + what;
  while (res.length < len) { res = c + res; }
  return res;
}

const fnNames = ['log', 'info', 'warn', 'error'];
const logNames = fnNames.map( (name) => pad(name, 5, ' ').toUpperCase() );

// return string that will be prepended before logged message
function getPrefix() {
  const d = new Date();
  const res =
    d.getFullYear() + '/' +
    pad(d.getMonth() + 1) + '/' +
    pad(d.getDate()) + ' ' +
    pad(d.getHours()) + ':' +
    pad(d.getMinutes()) + ':' +
    pad(d.getSeconds()) + '.' +
    pad(d.getMilliseconds(), 3);
  return '[' + res + (state.name && state.name.length ? ' - ' + state.name : '') + ']';
}

export default {

  // set new handlers:
  //     level: 'log' || 'info' || 'warn' || 'error'
  //     name :  string
  // return true on success, false on failure
  install: (level = null, name = null) => {
    if (state._log) { return false; }
    if (level) {
      if (!(level in levels)) { return false; }
      state.level = levels[level];
    }
    if (name) { state.name = name; }
    fnNames.forEach( (n) => {
      const refName = '_' + n;
      state[refName] = _console[n];
      _console[n] = (...args) => {
        if (levels[n] > state.level) { return undefined; }
        const prefix = getPrefix() + ' ' + logNames[logNames.length - levels[n]] + ':';
        args.unshift(prefix);
        return state[refName].apply(_console, args);
      };
    });
    return true;
  },

  // release new handlers, restore original behavior,
  // return true on success, false on failure
  uninstall: () => {
    if (!state._log) { return false; }
    fnNames.forEach( (name) => {
      const refName = '_' + name;
      _console[name] = state[refName];
      state[refName] = null;
    });
    state.name = null;
    state.level = levels.log;
    return true;
  },

  // set / get level
  level: (value = null) => {
    if (!value) { return fnNames[fnNames.legth - state.level]; }
    if (!(value in levels)) { return false; }
    state.level = levels[value];
    return value;
  },

  // set / get name
  name: (name = null) => {
    if (typeof name !== 'string') { return state.name; }
    state.name = name;
    return name;
  },

  // injector for unit tests
  _inject: obj => {
    _console = obj;
  }

};
