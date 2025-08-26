# uncar 
Convert bluesky export's .car to JSON files.


## Install
### Build with Bun
#### Requirements
- git
- bun (>= 1.2.9)
```shell
git clone --single-branch --depth 1 --branch 1.0.0 https://github.com/jrmmendes/uncar uncar \
&& cd uncar && bun install && bun run build && bun link
```

## Usage
Output of `uncar --help`:
```shell
Usage:
  uncar <command> <car-file> [output-directory]

Commands:
  extract    Extract all records from CAR file to JSON files
  list       List all records in the CAR file

Examples:
  uncar extract repo.car
  uncar extract repo.car ./output
  uncar list repo.car
```
