import assert from 'assert';
import cfgFile from './cfg-file';

cfgFile._mute();

describe('Config file module', () => {
  it('# should report missing config', () => {
    try {
      cfgFile.setFilename('unit-test-data/missing.json').read();
      assert.fail();
    } catch (e) {
      assert.strictEqual(e.message, 'cannot read file');
    }
  });

  it('# should report invalid config', () => {
    try {
      cfgFile.setFilename('unit-test-data/invalid.json').read();
      assert.fail();
    } catch (e) {
      assert.strictEqual(e.message, 'cannot parse file');
    }
  });

  it('# should report missing mandatory config field', () => {
    try {
      cfgFile.setFilename('unit-test-data/missing-key.json').read();
      assert.fail();
    } catch (e) {
      assert.strictEqual(e.message, 'missing mandatory field');
    }
  });

  it('# should report if both "branch" and "ignore_branch" fields are missing', () => {
    try {
      cfgFile.setFilename('unit-test-data/missing-branch1.json').read();
      assert.fail();
    } catch (e) {
      assert.strictEqual(e.message, 'either "branch" field or "ignore_branch" (true) field must be provided');
    }
  });

  it('# should report missing "branch" field if "ignore_branch" is set to (false)', () => {
    try {
      cfgFile.setFilename('unit-test-data/missing-branch2.json').read();
      assert.fail();
    } catch (e) {
      assert.strictEqual(e.message, 'either "branch" field or "ignore_branch" (true) field must be provided');
    }
  });

  it('# should return config object with defaults', () => {
    try {
      const data = cfgFile.setFilename('unit-test-data/minimal.json').read();
      assert.strictEqual(typeof data, 'object');
      assert.strictEqual(data.token, 'token');
      assert.strictEqual(data.hosting, 'hosting');
      assert.strictEqual(data.organisation, 'organisation');
      assert.strictEqual(data.project, 'project');
      assert.strictEqual(data.branch, 'branch');
      assert.strictEqual(data.artifacts, 'artifacts');
      assert.strictEqual(data.script, 'script');
      assert.strictEqual(typeof data.order_by, 'string');
      assert.strictEqual(typeof data.interval, 'number');
      assert.strictEqual(typeof data.directory, 'string');
      assert.strictEqual(typeof data.last, 'number');
      assert.strictEqual(typeof data.timeout, 'number');
    } catch (e) {
      assert.fail();
    }
  });

  it('# should not overwrite set config optional fields with with defaults', () => {
    try {
      const data = cfgFile.setFilename('unit-test-data/full.json').read();
      assert.strictEqual(typeof data, 'object');
      assert.strictEqual(data.token, 'token');
      assert.strictEqual(data.hosting, 'hosting');
      assert.strictEqual(data.organisation, 'organisation');
      assert.strictEqual(data.project, 'project');
      assert.strictEqual(data.branch, 'branch');
      assert.strictEqual(data.artifacts, 'artifacts');
      assert.strictEqual(data.script, 'script');
      assert.strictEqual(data.order_by, 'order_by');
      assert.strictEqual(data.interval, 'interval');
      assert.strictEqual(data.directory, 'directory');
      assert.strictEqual(data.last, 'last');
      assert.strictEqual(data.timeout, 'timeout');
    } catch (e) {
      assert.fail();
    }
  });

  it('# should not write config file', () => {
    try {
      assert.strictEqual(cfgFile.setFilename('/this/directory/does/not/exist').write({}), false);
    } catch (e) {
      assert.fail();
    }
  });

  it('# should write config file and ignore private keys', () => {
    try {
      const data1 = cfgFile.setFilename('unit-test-data/full.json').read();
      data1._private = 'private';
      const res = cfgFile.setFilename('unit-test-data/write.json').write(data1);
      assert.strictEqual(res, true);
      const data2 = cfgFile.read();
      assert.strictEqual(typeof data2._private, 'undefined');
      data2._private = 'private';
      assert.deepEqual(data1, data2);
    } catch (e) {
      assert.fail();
    }
  });
});
