# cci-pingu

Periodically check for new builds (artifacts) on CircleCI and install them locally in turn.

## Installation

```
> git clone git@github.com:salsita/cci-pingu.git
> npm install
> npm run build-pkg
```

After this, you will find the tool built in `dist` directory and packaged up as `cci-pingu.tgz` file in the root directory of the project repository.

Then you fine-tune your own configuration and you are good to go:

```
> cp config/default.json config/my.json
> vi my.json
> node dist/cci-pingu --config=config/my.json
```

## Configuration file

To be able to start the tool, you'll need to provide its configuration file. You can put it anywhere and write it from scratch, or you can copy and edit the default template `default.json` that is in `config` directory. All config files from `config` directory (except for `default.json`) will be part of the compiled bundle.

Config file is a JSON file with configuration object. The keys there have the following meaning:

| Name | Mandatory | Type | Default | Meaning |
| ---- |:---------:|:----:|:-------:| ------- |
| token | * | string | | Your CircleCI API token that will be used when talking to CircleCI. Make sure you can access your project with this token. |
| organisation | * | string | | The name of your github organisation (or user) under which the monitored project lives on CircleCI. |
| project | * | string | | The name of the project you'd like to watch and install locally. |
| branch | * | string| | The project repository branch to monitor. |
| artifacts | * | array of strings | | List of artifact names that will be downloaded for successful build. Actually, it is list of artifact name *prefixes* so that you can have "test" string in the `artifacts` array and it would match "test-1.2.3.tgz" artifact on CircleCI. |
| script | * | string | | Filename of executable (typically script) that is able to install the artifacts locally. |
| interval | | integer | 60 | When running in continuous mode, this number specifies the number of seconds between two consecutive checks on CircleCI. |
| directory | | string | /tmp | The name of the directory in which build-related sub-directories storing the artifacts will be created. Make sure the directory exists and you have write permissions there. |
| last | | integer | 0 | The number of the latest build successfully installed locally. This field is auto-updated by the tool after each successful installation. |
| timeout | | integer | 45 | How long to wait for downloading an artifact (per-artifact-download setting). If downloading takes longer than provided number of seconds, it is considered failed. |

## How it works

When the tool is started, it reads the configuration file specified as command-line argument. The structure of the configuration file is described above.

Unless you also pass specific CircleCI build number, the first thing cci-pingu does is figuring out what is the latest successful CircleCI build for given project on specified branch.

This number (or number passed explicitly on command line as the build number to install) is then compared with the number of the latest CircleCI build installed locally (and stored in config file under `last` key).

If that build is already installed locally, nothing happens and either the tool terminates (when started with `--run-once` option, or when you passed the CircleCI build number to be installed explicitly), or (in continuous mode, which is the default operation mode) it waits `interval` seconds and tries again.

When the tool finds out that the latest CircleCI build (or the build provided on command line explicitly) is not installed locally, it retrieves the information about given build, including the artifacts of the build, and then compiles a list of artifacts that needs to be downloaded by comparing the list of artifacts listed in configuration file. As mentioned above, the list from configuration file is actually list of artifact name *prefixes*, so when you have "test" in the `artifacts` array of the configuration file, and the build info indicates that there are two artifacts on CircleCI, "test-1.2.3.tgz" and "test-db-0.1.2.dump", then both the artifacts will match the prefix and will be added to the list of artifacts to be donwloaded.

Once we know the list of the artifacts, the tool will create a new directory under `directory` from the config file. The name of the directory is `build-<CCI-build-number>[.installation-attempt-number]`. The installation attempt number is only used in case there already was some attempt to install the exact same build, but it failed for any reason.

After the directory is created, cci-pingu will download all the artifacts from the compiled list.

When all of the artifacts are downloaded into that directory, the tool starts executable (typically installation bash script) specified in the configuration file as `script`. This script must take one command line argument, and that is the name of the directory into which the artifacts from CircleCI were downloaded. It is expected that the script knows how to use the artifacts and what exactly to do with them to successfuly install them locally.

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
| `--run-once` | `-1` | | boolean | Do NOT run as a monitoring daemon, exit after one CicrleCI check. |
| `--help` | `-h` | | boolean | Print help and exit. |
| `--version` | `-v` | | boolean | Print version and exit. |
| `--install` | `-i` | | integer | Install given build (overrides the `branch` setting from configuration file). Implies `--run-once` command line option. |

All logs go to `stdout`, feel free to redirect as needed.

## `package.json` npm scripts

```
> npm run build
```
Generate version file, lint the ES6 source code, transpile the ES6 source code into `dist` directory (using babel with `.babelrc` as the configuration file) and verify the (transpiled) tests pass on the (transpiled) code.

```
> npm run gen-ver
```
Generate `code/lib/version.js` file exporting the current version of the tool, as taken from `package.json` itself. Used as part of the `build` script.

```
> npm run lint
```
Lint the (ES6) source code, uses `.eslintrc` as the configuration file. Used as part of the `build` script.

```
> npm run test
```
Verify the (transpiled) tests pass on the (traspiled) code. Used as part of the `build` script.

```
> npm start
```
Start the tool in tool with `config/default.json` configuration file in debug mode. Note: the tool must be built first (so you need to run `npm run build` prior to `npm start`). Also, the `default.json` file needs to be updated with project-related information and CCI API token before starting the tool.

```
> npm run build-pkg
```
Build the tool as in `npm run build`, install run-time `node_modules` to `dist` directory, copy over the configuration files (except for `default.json`), remove unnecessary files (test specs) and package the `dist` directory as a tarball.
