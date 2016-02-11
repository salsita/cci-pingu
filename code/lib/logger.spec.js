// tested module:
import logger from './logger';
import assert from 'assert';

// mocks:
const myDate = () => {
  // 2015/01/02 03:04:05.006
  return {
    getFullYear: () => 2015,
    getMonth: () => 0,
    getDate: () => 2,
    getHours: () => 3,
    getMinutes: () => 4,
    getSeconds: () => 5,
    getMilliseconds: () => 6
  };
};
let log = [];
function logArgs(fnName, ...args) { log.push({ name: fnName, args }); }
const myConsole = {
  log: logArgs.bind(myConsole, 'log'),
  info: logArgs.bind(myConsole, 'info'),
  warn: logArgs.bind(myConsole, 'warn'),
  error: logArgs.bind(myConsole, 'error')
};

logger._inject(myConsole, myDate);
beforeEach(() => { log = []; });

const testConsoleFns = () => {
  myConsole.log('LOG text');
  myConsole.info('INFO text');
  myConsole.warn('WARN text');
  myConsole.error('ERROR text');
};

const verifyResults = (expected) => {
  assert.equal(log.length, expected.length);
  expected.forEach((expItem, i) => {
    const logItem = log[i];
    assert.equal(expItem.name, logItem.name);
    const args = logItem.args;
    assert.equal(expItem.args.length, args.length);
    expItem.args.forEach((argItem, j) => {
      assert.deepEqual(argItem, args[j]);
    });
  });
};

describe('Logger module', () => {
  it('# should use standard console when logger is not installed', () => {
    testConsoleFns();
    verifyResults([
      { name: 'log',   args: [ 'LOG text' ] },
      { name: 'info',  args: [ 'INFO text' ] },
      { name: 'warn',  args: [ 'WARN text' ] },
      { name: 'error', args: [ 'ERROR text' ] }
    ]);
  });

  it('# should use logger formatting when logger is installed, log info and above', () => {
    assert.equal(logger.install(), true);
    testConsoleFns();
    verifyResults([
      { name: 'info',  args: [ '[2015/01/02 03:04:05.006]  INFO:', 'INFO text' ] },
      { name: 'warn',  args: [ '[2015/01/02 03:04:05.006]  WARN:', 'WARN text' ] },
      { name: 'error', args: [ '[2015/01/02 03:04:05.006] ERROR:', 'ERROR text' ] }
    ]);
  });

  it('# should ignore subsequent install() invocations', () => {
    assert.equal(logger.install(), false);
    testConsoleFns();
    verifyResults([
      { name: 'info',  args: [ '[2015/01/02 03:04:05.006]  INFO:', 'INFO text' ] },
      { name: 'warn',  args: [ '[2015/01/02 03:04:05.006]  WARN:', 'WARN text' ] },
      { name: 'error', args: [ '[2015/01/02 03:04:05.006] ERROR:', 'ERROR text' ] }
    ]);
  });

  it('# should restore original console functions on uninstall', () => {
    assert.equal(logger.uninstall(), true);
    testConsoleFns();
    verifyResults([
      { name: 'log',   args: [ 'LOG text' ] },
      { name: 'info',  args: [ 'INFO text' ] },
      { name: 'warn',  args: [ 'WARN text' ] },
      { name: 'error', args: [ 'ERROR text' ] }
    ]);
  });

  it('# should ignore subsequent uninstall() invocations', () => {
    assert.equal(logger.uninstall(), false);
    testConsoleFns();
    verifyResults([
      { name: 'log',   args: [ 'LOG text' ] },
      { name: 'info',  args: [ 'INFO text' ] },
      { name: 'warn',  args: [ 'WARN text' ] },
      { name: 'error', args: [ 'ERROR text' ] }
    ]);
  });

  it('# should use provided log level and application name in log messages', () => {
    assert.equal(logger.install('log', 'APP NAME'), true);
    testConsoleFns();
    verifyResults([
      { name: 'log',   args: [ '[2015/01/02 03:04:05.006 - APP NAME]   LOG:', 'LOG text' ] },
      { name: 'info',  args: [ '[2015/01/02 03:04:05.006 - APP NAME]  INFO:', 'INFO text' ] },
      { name: 'warn',  args: [ '[2015/01/02 03:04:05.006 - APP NAME]  WARN:', 'WARN text' ] },
      { name: 'error', args: [ '[2015/01/02 03:04:05.006 - APP NAME] ERROR:', 'ERROR text' ] }
    ]);
  });

  it('# should return application name and log level currently set', () => {
    assert.equal(logger.name(), 'APP NAME');
    assert.equal(logger.level(), 'log');
  });

  it('# should set new log level', () => {
    assert.equal(logger.level('warn'), 'warn');
    testConsoleFns();
    verifyResults([
      { name: 'warn',  args: [ '[2015/01/02 03:04:05.006 - APP NAME]  WARN:', 'WARN text' ] },
      { name: 'error', args: [ '[2015/01/02 03:04:05.006 - APP NAME] ERROR:', 'ERROR text' ] }
    ]);
  });

  it('# should ignore unknown log level', () => {
    assert.equal(logger.level('unknown'), false);
    testConsoleFns();
    verifyResults([
      { name: 'warn',  args: [ '[2015/01/02 03:04:05.006 - APP NAME]  WARN:', 'WARN text' ] },
      { name: 'error', args: [ '[2015/01/02 03:04:05.006 - APP NAME] ERROR:', 'ERROR text' ] }
    ]);
  });

  it('# should set new application name', () => {
    assert.equal(logger.name('NEW NAME'), 'NEW NAME');
    testConsoleFns();
    verifyResults([
      { name: 'warn',  args: [ '[2015/01/02 03:04:05.006 - NEW NAME]  WARN:', 'WARN text' ] },
      { name: 'error', args: [ '[2015/01/02 03:04:05.006 - NEW NAME] ERROR:', 'ERROR text' ] }
    ]);
  });

  it('# should reset application name', () => {
    assert.equal(logger.name(''), '');
    testConsoleFns();
    verifyResults([
      { name: 'warn',  args: [ '[2015/01/02 03:04:05.006]  WARN:', 'WARN text' ] },
      { name: 'error', args: [ '[2015/01/02 03:04:05.006] ERROR:', 'ERROR text' ] }
    ]);
  });
});
