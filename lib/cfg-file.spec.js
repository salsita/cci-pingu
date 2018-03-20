import assert from 'assert';
import cfgFile from './cfg-file';

cfgFile._mute();

describe('Config file module', () => {
  it('# should report missing config', () => {
    try {
      cfgFile.setFilename('unit-test-data/missing.json').read();
      assert.fail();
    } catch (e) {
      assert.equal(e.message, 'cannot read file');
    }
  });

  it('# should report invalid config', () => {
    try {
      cfgFile.setFilename('unit-test-data/invalid.json').read();
      assert.fail();
    } catch (e) {
      assert.equal(e.message, 'cannot parse file');
    }
  });

  it('# should report missing mandatory config field', () => {
    try {
      cfgFile.setFilename('unit-test-data/missing-key.json').read();
      assert.fail();
    } catch (e) {
      assert.equal(e.message, 'missing mandatory field');
    }
  });

  it('# should report if both "branch" and "ignore_branch" fields are missing', () => {
    try {
      cfgFile.setFilename('unit-test-data/missing-branch1.json').read();
      assert.fail();
    } catch (e) {
      assert.equal(e.message, 'either "branch" field or "ignore_branch" (true) field must be provided');
    }
  });

  it('# should report missing "branch" field if "ignore_branch" is set to (false)', () => {
    try {
      cfgFile.setFilename('unit-test-data/missing-branch2.json').read();
      assert.fail();
    } catch (e) {
      assert.equal(e.message, 'either "branch" field or "ignore_branch" (true) field must be provided');
    }
  });

  it('# should return config object with defaults', () => {
    try {
      const data = cfgFile.setFilename('unit-test-data/minimal.json').read();
      assert.equal(typeof data, 'object');
      assert.equal(data.token, 'token');
      assert.equal(data.hosting, 'hosting');
      assert.equal(data.organisation, 'organisation');
      assert.equal(data.project, 'project');
      assert.equal(data.branch, 'branch');
      assert.equal(data.artifacts, 'artifacts');
      assert.equal(data.script, 'script');
      assert.equal(typeof data.interval, 'number');
      assert.equal(typeof data.directory, 'string');
      assert.equal(typeof data.last, 'number');
      assert.equal(typeof data.timeout, 'number');
    } catch (e) {
      assert.fail();
    }
  });

  it('# should not overwrite set config optional fields with with defaults', () => {
    try {
      const data = cfgFile.setFilename('unit-test-data/full.json').read();
      assert.equal(typeof data, 'object');
      assert.equal(data.token, 'token');
      assert.equal(data.hosting, 'hosting');
      assert.equal(data.organisation, 'organisation');
      assert.equal(data.project, 'project');
      assert.equal(data.branch, 'branch');
      assert.equal(data.artifacts, 'artifacts');
      assert.equal(data.script, 'script');
      assert.equal(data.interval, 'interval');
      assert.equal(data.directory, 'directory');
      assert.equal(data.last, 'last');
      assert.equal(data.timeout, 'timeout');
    } catch (e) {
      assert.fail();
    }
  });

  it('# should not write config file', () => {
    try {
      assert.equal(cfgFile.setFilename('/this/directory/does/not/exist').write({}), false);
    } catch (e) {
      assert.fail();
    }
  });

  it('# should write config file and ignore private keys', () => {
    try {
      const data1 = cfgFile.setFilename('unit-test-data/full.json').read();
      data1._private = 'private';
      const res = cfgFile.setFilename('unit-test-data/write.json').write(data1);
      assert.equal(res, true);
      const data2 = cfgFile.read();
      assert.equal(typeof data2._private, 'undefined');
      data2._private = 'private';
      assert.deepEqual(data1, data2);
    } catch (e) {
      assert.fail();
    }
  });
});
