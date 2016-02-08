# cci-pingu

Periodically checks for new builds (artifacts) on CircleCI and installs them in turn.

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

## Execution
