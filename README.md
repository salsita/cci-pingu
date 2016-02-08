# cci-pingu

Periodically check for new builds (artifacts) on CircleCI and install them locally in turn.

## Installation

```
git@github.com:salsita/cci-pingu.git
npm install
npm run build-pkg
```

After this, you will find the tool built in `dist` directory and packaged up as `cci-pingu.tgz` file in the root directory of the project repository.

## Configuration file

To be able to start the tool, you'll need to provide configuration file. You can put it anywhere and write it from scratch, or you can copy and edit the default template `default.json` that is in `config` directory. All config files from `config` directory (except for `default.json`) will be part of the compiled bundle.

Config file is a JSON file with configuration object. The keys there have the follwoing meaning

| Name | Mandatory | Type | Default | Meaning |
| ---- |:---------:|:----:|:-------:| ------- |
| token | * | string | | Your CircleCI API token that will be used when talking to CircleCI. Make sure you can access your project with this token. |
| organisation | * | string | | The name of your github organisation (or user) under which the monitored project lives on CircleCI. |
| project | * | string | | The name of the project you'd like to watch and install locally. |
| branch | * | string| | The project repository branch to monitor. |
| artifacts | * | array of strings | | List of artifact names that will be downloaded for successful build. Actually, it is list of artifact name *prefixes* so that you can have "test" string in the `artifacts` array and it would match "test-1.2.3.tgz" artifact on CircleCI. |
| script | * | string | | Filename of executable (typically script) that will be able to install the artifacts locally. |
| interval | | integer | 60 | When running in continuous mode, this number specifies the number of seconds between two consecutive checks on CircleCI. |
| directory | | string | /tmp | The name of the directory in which build-related sub-directories storing the artifacts will be created. Make sure the directory exists and you have write permissions there. |
| last | | integer | 0 | The number of the latest build successfully installed locally. This field is auto-updated by the tool after each successful installation. |
| timeout | | integer | 45 | How long to wait for downloading an artifact (per-artifact-download setting). If downloading takes longer than provided number of seconds, it is considered failed. |

## How it works

When the tool is started, it reads the configuration file specified as command-line argument. The structure of the configuration file is described above.

Unless you also pass specific CircleCI build number, the first thing cci-pingu does is figuring out what is the latest successful CircleCI build for given project on specified branch.

This number (or number passed explicitly on command line as the build number to install) is then compared with the number of the latest CircleCI build installed locally (and stored in config file under `last` key).

If that build is already installed locally, nothing happens and either the tool terminates (when started with `--run-once` option, or when you passed the CircleCI build number to be installed explicitly), or (in continuous mode, which is the default operation mode)it waits `interval` seconds and tries again.

When the tool finds out that the latest CircleCI build (or the build provided on command line explicitly) is not installed locally, it retrieves the information about given build, including the artifacts of the build, and then compiles a list of artifacts that needs to be downloaded by comparing the list of artifacts listed in configuration file. As mentioned above, the list from configuration file is actually list of artifact name *prefixes*, so when you have "test" in the `artifacts` array of the configuration file, and the build info indicates that there are two artifacts on CircleCI, "test-1.2.3.tgz" and "test-db-0.1.2.dump", then both the artifacts will match the prefix and will be added to the list of artifacts to be donwloaded.

Once we know the list of the artifacts, the tool will create a new directory under `directory` from the config file. The name of the directory is called `build-<CCI-build-number>[.installation-attempt-number]`. The installation attempt number is only used in case there already was some attempt to install the exact same build, but it failed for any reason.

After the driectory is created, cci-pingu will download all the artifacts from the compiled list.

When all of the artifacts are downloaded into that directory, the tool starts executable (typically installation bash script) specified in the configuration file as `script`. This script must take one command line argument, and that is the directory with the downloaded artifacts. It is expected that the script knows how to use the artifacts and what exactly to do with them to successfuly install them locally.

In case the return value of the installation script is 0, the installation is considered successful (in which case the `last` field of the configuration file is updated), otherwise it is considered failed.

In continuous mode (the default operation mode) the tool waits `interval` seconds and starts the check / installation again. If started with `--run-once` or when the CircleCI build number is passed explicitly on command line, then cci-pingu terminates.

## Command line options
