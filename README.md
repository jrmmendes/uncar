# uncar 
Convert bluesky export's .car to JSON files.


## Install
```shell
npm i -g @jrmmendes/uncar 
```

## Build with Bun
### Requirements
- git
- bun (>= 1.2.9)
```shell
git clone --single-branch --depth 1 --branch v1.1.0 https://github.com/jrmmendes/uncar uncar \
&& cd uncar && bun install && bun run build && bun link
```

## Usage
Output of `uncar --help`:
```shell
Usage: uncar [options] [command]

Options:
  -v, --version                            output the current version
  -h, --help                               display help for command

Commands:
  list <carFilePath>                       List all records in the CAR file
  extract <carFilePath> [outputDirectory]  Extract all records from CAR file to JSON files
  help [command]                           display help for command
```
