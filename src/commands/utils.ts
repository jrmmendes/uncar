import path from "node:path";
import fs from "node:fs";
import type { CID } from "@ipld/car/buffer-reader";

export const isCommitBlock = (data: any): boolean => {
  return (
    data &&
    typeof data === "object" &&
    (data.version !== undefined ||
      data.did !== undefined ||
      data.rev !== undefined)
  );
};

export const isRecordBlock = (data: any): boolean => {
  return (
    data &&
    typeof data === "object" &&
    data.$type &&
    typeof data.$type === "string" &&
    data.$type.startsWith("app.")
  );
};

export const isTreeNode = (data: any): boolean => {
  return data && typeof data === "object" && !data.$type && (data.l || data.e);
};

export const writeCommitInfo = async (
  outputDir: string,
  commit: Record<string, unknown>,
) => {
  const commitPath = path.join(outputDir, "_commit.json");
  const commitJson = JSON.stringify(commit, null, 2);
  fs.writeFileSync(commitPath, commitJson);
  console.log(`Commit info: ${commitPath}`);
};

export const extractRecordKey = (record: Record<string, unknown>, cid: CID) => {
  if (record.rkey) return record.rkey;

  if (record.$type === "app.bsky.actor.profile") {
    return "self";
  }

  return cid.toString().slice(-12);
};

export const writeRecord = async (
  outputDir: string,
  record: Record<string, unknown>,
  cid: CID,
) => {
  if (!record.$type) return;

  const collection = record.$type;
  const rkey = extractRecordKey(record, cid);
  const recordPath = `${collection}/${rkey}`;
  const fullPath = path.join(outputDir, recordPath + ".json");

  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const recordJson = JSON.stringify(record, null, 2);
  fs.writeFileSync(fullPath, recordJson);

  console.log(`Record: ${recordPath}`);
};
