import { CarReader } from "@ipld/car";
import { decode } from "@ipld/dag-cbor";
import fs from "fs";
import path from "path";
import {
  isCommitBlock,
  isRecordBlock,
  isTreeNode,
  writeCommitInfo,
  writeRecord,
} from "./utils";

export async function extract(carFilePath: string, outputDir = null) {
  if (!fs.existsSync(carFilePath)) {
    throw new Error(`CAR file not found: ${carFilePath}`);
  }

  const carBuffer = fs.readFileSync(carFilePath);
  const reader = await CarReader.fromBytes(carBuffer);

  const basename = path.basename(carFilePath, ".car");
  const dir = outputDir || basename;

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  console.log(`Extracting CAR file: ${carFilePath}`);
  console.log(`Output directory: ${dir}`);

  let recordCount = 0;
  let commitCid = null;

  for await (const { cid, bytes } of reader.blocks()) {
    try {
      const decoded = decode<Record<string, unknown>>(bytes);

      if (isCommitBlock(decoded)) {
        commitCid = cid;
        await writeCommitInfo(dir, decoded);
      } else if (isRecordBlock(decoded)) {
        await writeRecord(dir, decoded, cid);
        recordCount++;
      } else if (isTreeNode(decoded)) {
        continue;
      }
    } catch (error: any) {
      console.warn(`Warning: Could not decode block ${cid}: ${error.message}`);
    }
  }

  console.log(`Extracted ${recordCount} records`);
  console.log(`Repository data written to: ${dir}`);
}
