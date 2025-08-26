import fs from 'node:fs';
import path from 'node:path';

import { CarReader } from '@ipld/car';
import { decode } from '@ipld/dag-cbor';
import { extractRecordKey, isRecordBlock } from './utils';

export const list = async (carFilePath: string) => {
  const carBuffer = fs.readFileSync(carFilePath);
  const reader = await CarReader.fromBytes(carBuffer);

  console.log(`=== Records in ${path.basename(carFilePath)} ===`);
  console.log('Collection/RecordKey\t\tCID');

  for await (const { cid, bytes } of reader.blocks()) {
    try {
      const decoded = decode<{ $type: string }>(bytes);

      if (isRecordBlock(decoded)) {
        const collection = decoded.$type;
        const rkey = extractRecordKey(decoded, cid);
        const recordKey = `${collection}/${rkey}`;
        console.log(`${recordKey}\t${cid}`);
      }
    } catch (error) {
      console.error(error);
      continue;
    }
  }
}
