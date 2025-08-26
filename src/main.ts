import { Command } from "commander";
import { list } from "./commands/list";
import { version } from "../package.json";

const program = new Command();

program
  .name("uncar")
  .version(version, "-v, --version", "output the current version");

program
  .command("list")
  .description("List all records in the CAR file")
  .argument("<carFilePath>", "path of the CAR file")
  .action(list);

program
  .command("extract")
  .description("Extract all records from CAR file to JSON files")
  .argument("<carFilePath>", "path of the CAR file")
  .argument("[outputDirectory]", "directory to save extracted JSON files");

await program.parseAsync(process.argv);
