[![Dependency Status](https://img.shields.io/david/salsita/cci-pingu.svg)](https://david-dm.org/salsita/cci-pingu)
[![devDependency Status](https://img.shields.io/david/dev/salsita/cci-pingu.svg)](https://david-dm.org/salsita/cci-pingu?type=dev)
![Downloads](https://img.shields.io/npm/dm/cci-pingu.svg?style=flat)
![Licence](https://img.shields.io/npm/l/cci-pingu.svg?style=flat)
[![Known Vulnerabilities](https://snyk.io/test/github/salsita/cci-pingu/badge.svg)](https://snyk.io/test/github/salsita/cci-pingu)

# cci-pingu

Periodically check for new builds (artifacts) on CircleCI and install them locally in turn.

## Installation

```
$ npm i cci-pingu
```

Installing this module adds a runnable file into your `node_modules/.bin` directory. If installed globally (with the `-g` option), you can run `cci-pingu`, otherwise you can run `./node_modules/.bin/cci-pingu`.

To use the tool, you need to provide configuration file to it. You can copy the [config template](https://github.com/salsita/cci-pingu/blob/master/config/default.json), edit it with actual values and you are good to go!

## Configuration file format

Config file is a JSON file with configuration object. The keys there have the following meaning:

| Name | Mandatory | Type | Default | Meaning |
| ---- |:---------:|:----:|:-------:| ------- |
| cci_url | | string | `https://circleci.com` | Base-URL of CircleCI. Use with self-hosted CircleCI installations. |
| token | * | string | | Your CircleCI API token that will be used when talking to CircleCI. Make sure you can access your project with this token. |
| hosting | * | string | | "github" or "bitbucket"; where you repo is hosted. |
| organisation | * | string | | The name of your github / bitbucket organisation (or user) under which the monitored project lives on CircleCI. |
| project | * | string | | The name of the project you'd like to watch and install locally. |
| branch (1) | | string| | The project repository branch to monitor. |
| ignore_branch (1) | | boolean | `false` | If set to `true`, process builds from all branches. |
| workflows_job_name | | string | | When specified, the tool only looks for successful builds created as part of worflows by job with specified name. |
| artifacts | * | array of strings | | List of artifact names that will be downloaded for successful build. Actually, it is list of artifact name *substrings* so that you can have "test" string in the `artifacts` array and it would match "test-1.2.3.tgz" artifact on CircleCI. |
| order_by | | string | `build_num` | When looking for the latest build, use this field in [response](https://circleci.com/docs/api/v1-reference/#recent-builds-project) to define the order (`stop_time` could be an interesting option for someone, too). |
| script | * | string | | Filename of executable (typically script) that is able to install the artifacts locally. |
| interval | | integer | `60` | When running in continuous mode, this number specifies the number of seconds between two consecutive checks on CircleCI. |
| directory | | string | `/tmp` | The name of the directory in which build-related sub-directories storing the artifacts will be created. Make sure the directory exists and you have write permissions there. |
| last | | integer | `0` | The number of the latest build successfully installed locally. This field is auto-updated by the tool after each successful installation. |
| timeout | | integer | `45` | How long to wait for downloading an artifact (per-artifact-download setting). If downloading takes longer than provided number of seconds, it is considered failed. |

(1) One of "branch" and "ignore_branch" fields must be provided. If "ignore_branch" is set to `false` (default),
the "branch" field must be provided.

## How it works

When the tool is started, it reads the configuration file specified as command-line argument. The structure of the configuration file is described above.

Unless you also pass specific CircleCI build number, the first thing cci-pingu does is figuring out what is the latest successful CircleCI build for given project on specified branch, or any branch in case ignore_branch is set to `true`.  The order in which the latest successful build is looked up is defined with the `order_by` configuration option, and it is looked up in 100 lastest builds by `build_num`. In case `workflows_job_name` configuration option is provided, the successful builds are filtered on this specified workflows job name, other builds are not even considered.

This number (or number passed explicitly on command line as the build number to install) is then compared with the number of the latest CircleCI build installed locally (and stored in config file under `last` key).

If that build is already installed locally, it is either installed again (in case you used `--install` option), or the build is ignored. Then the tool either terminates (when started with `--run-once` or `--install` option), or (in continuous mode, which is the default operation mode) it waits `interval` seconds and tries again.

When the tool finds out that the latest CircleCI build (or the build provided on command line explicitly) is not installed locally, it retrieves the information about given build, including the artifacts of the build, and then compiles a list of artifacts that needs to be downloaded by comparing the list of artifacts listed in configuration file. As mentioned above, the list from configuration file is actually list of artifact name *substrings*, so when you have "test" in the `artifacts` array of the configuration file, and the build info indicates that there are two artifacts on CircleCI, "test-1.2.3.tgz" and "test-db-0.1.2.dump", then both the artifacts will match the substring and will be added to the list of artifacts to be donwloaded.

Once we know the list of the artifacts, the tool will create a new directory under `directory` from the config file. The name of the directory is `build-<CCI-build-number>[.installation-attempt-number]`. The installation attempt number is only used in case there already was some attempt to install the exact same build, but it failed for any reason.

After the directory is created, cci-pingu will download all the artifacts from the compiled list.

When all of the artifacts are downloaded into that directory, the tool starts executable (typically installation bash script) specified in the configuration file as `script`. This script must take two command line arguments, which are:
* the name of the directory into which the artifacts from CircleCI were downloaded, and
* the build number currently processed.
It is expected that the script knows how to use the artifacts and what exactly to do with them to successfuly install them locally.

It might be a good idea to delete the directories from previous installations, and leave the last *N* artifact directories there, to keep the disk space occupied with these directories limited.

```
(ls -td build-* | head -n 5; ls -d build-*) | sort | uniq -u | xargs rm -rf
```

In case the return value of the installation script is 0, the installation is considered successful (in which case the `last` field of the configuration file is updated), otherwise it is considered failed.

In continuous mode (the default operation mode) the tool waits `interval` seconds and starts the check / installation again. If started with `--run-once` or when the CircleCI build number is passed explicitly on command line, then cci-pingu terminates.

## Command line options

| Long name | Short name | Mandatory | Value type | Description |
| --------- |:----------:|:---------:|:----------:| ----------- |
| `--config` | `-c` | * | string | Path to configuration JSON file. |
| `--debug` | `-d` | | boolean | Log verbosely. |
| `--silent` | `-s` | | boolean | Log errors only. |
| `--no-time` | | | boolean | Do NOT prefix output lines with timestamp and log-level. |
| `--run-once` | `-1` | | boolean | Do NOT run as a monitoring daemon. |
| `--help` | `-h` | | boolean | Print help and exit. |
| `--version` | `-v` | | boolean | Print version and exit. |
| `--install` | `-i` | | integer | Install given build (ignore cfg `branch`). |

All logs go to `stdout`, feel free to redirect as needed.

## Building from code

```
$ git clone git@github.com:salsita/cci-pingu.git
$ cd cci-pingu
$ npm i
$ npm run build
```

### `package.json` npm scripts

```
$ npm run build
```
Generate version file, lint the ES6 source code, transpile the ES6 source code into `dist` directory, and verify the (transpiled) tests pass on the (transpiled) code.

```
$ npm run babel
```
Transpiles (using babel with `.babelrc` configuration file) the ES6 source code from `lib` directory and `cci-pingu.js` file into `dist` directory, that is referenced from binary `bin/cci-pingu`.

```
$ npm run gen-ver
```
Generate `lib/version.js` file exporting the current version of the tool, as taken from `package.json` itself.

```
$ npm run lint
```
Lint the (ES6) source code, using `.eslintrc.json` configuration file.

```
$ npm test
```
Verify the (transpiled) tests pass on the (traspiled) code. The test runner is mocha.

```
$ npm start
```
Start the tool in tool with `config/default.json` configuration file in debug mode. Note: the tool must be built first (so you need to run `npm run build` prior to `npm start`). Also, the `default.json` file needs to be updated with project-related information and CCI API token before starting the tool.

## Licence

The MIT License (MIT)

Copyright (c) 2016--2019 Salsita Software

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
