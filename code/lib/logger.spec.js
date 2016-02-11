// tested module:
import logger from './logger';
import assert from 'assert';

// mocks:
const myDate = () => {
  // 2015/01/02 03:04:05.006
  return {
    getFullYear: () => 2015,
    getMonth: () => 0,
    getDay: () => 2,
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

describe('Logger module', () => {
  it('# should use standard console when logger is not installed', () => {
    myConsole.log('LOG text');
    myConsole.info('INFO text');
    myConsole.warn('WARN text');
    myConsole.error('ERROR text');
    assert.equal(log.length, 4);
    let name;
    let args;
    name = log[0].name;
    args = log[0].args;
    assert.equal(name, 'log');
    assert.equal(args, 'LOG text');
    name = log[1].name;
    args = log[1].args;
    assert.equal(name, 'info');
    assert.equal(args, 'INFO text');
    name = log[2].name;
    args = log[2].args;
    assert.equal(name, 'warn');
    assert.equal(args, 'WARN text');
    name = log[3].name;
    args = log[3].args;
    assert.equal(name, 'error');
    assert.equal(args, 'ERROR text');
  });
});

/*

logger.install();
console.log('LOG text');
console.info('INFO text');
console.warn('WARN text');
console.error('ERROR text');

logger.install();
console.log('LOG text');
console.info('INFO text');
console.warn('WARN text');
console.error('ERROR text');

logger.uninstall();
console.log('LOG text');
console.info('INFO text');
console.warn('WARN text');
console.error('ERROR text');

logger.uninstall();
console.log('LOG text');
console.info('INFO text');
console.warn('WARN text');
console.error('ERROR text');

logger.install('log', 'my cool app name');
console.log('LOG text');
console.info('INFO text');
console.warn('WARN text');
console.error('ERROR text');

logger.uninstall();
logger.install('warn');
console.log('LOG text');
console.info('INFO text');
console.warn('WARN text');
console.error('ERROR text');

logger.uninstall();
logger.install();
console.log('LOG text');
console.info('INFO text');
console.warn('WARN text');
console.error('ERROR text');
logger.name('app name');
console.log('LOG text');
console.info('INFO text');
console.warn('WARN text');
console.error('ERROR text');
logger.level('warn');
console.log('LOG text');
console.info('INFO text');
console.warn('WARN text');
console.error('ERROR text');

*/
