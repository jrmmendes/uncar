import fs from 'fs';
import path from 'path';
import { CarReader } from '@ipld/car';
import { decode } from '@ipld/dag-cbor';

class CarExtractor {
    constructor(carFilePath) {
        this.carFilePath = carFilePath;
        this.outputDir = null;
    }

    async extract(outputDir = null) {
        if (!fs.existsSync(this.carFilePath)) {
            throw new Error(`CAR file not found: ${this.carFilePath}`);
        }

        const carBuffer = fs.readFileSync(this.carFilePath);
        const reader = await CarReader.fromBytes(carBuffer);
        
        const basename = path.basename(this.carFilePath, '.car');
        this.outputDir = outputDir || basename;
        
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }

        console.log(`Extracting CAR file: ${this.carFilePath}`);
        console.log(`Output directory: ${this.outputDir}`);

        let recordCount = 0;
        let commitCid = null;

        for await (const { cid, bytes } of reader.blocks()) {
            try {
                const decoded = decode(bytes);
                
                if (this.isCommitBlock(decoded)) {
                    commitCid = cid;
                    await this.writeCommitInfo(decoded);
                } else if (this.isRecordBlock(decoded)) {
                    await this.writeRecord(cid, decoded);
                    recordCount++;
                } else if (this.isTreeNode(decoded)) {
                    continue;
                }
            } catch (error) {
                console.warn(`Warning: Could not decode block ${cid}: ${error.message}`);
            }
        }

        console.log(`Extracted ${recordCount} records`);
        console.log(`Repository data written to: ${this.outputDir}`);
    }

    isCommitBlock(data) {
        return data && typeof data === 'object' && 
               (data.version !== undefined || data.did !== undefined || data.rev !== undefined);
    }

    isRecordBlock(data) {
        return data && typeof data === 'object' && 
               data.$type && typeof data.$type === 'string' && 
               data.$type.startsWith('app.');
    }

    isTreeNode(data) {
        return data && typeof data === 'object' && 
               !data.$type && (data.l || data.e);
    }

    async writeCommitInfo(commit) {
        const commitPath = path.join(this.outputDir, '_commit.json');
        const commitJson = JSON.stringify(commit, null, 2);
        fs.writeFileSync(commitPath, commitJson);
        console.log(`Commit info: ${commitPath}`);
    }

    async writeRecord(cid, record) {
        if (!record.$type) return;

        const collection = record.$type;
        const rkey = this.extractRecordKey(record, cid);
        const recordPath = `${collection}/${rkey}`;
        const fullPath = path.join(this.outputDir, recordPath + '.json');
        
        const dir = path.dirname(fullPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        const recordJson = JSON.stringify(record, null, 2);
        fs.writeFileSync(fullPath, recordJson);
        
        console.log(`Record: ${recordPath}`);
    }

    extractRecordKey(record, cid) {
        if (record.rkey) return record.rkey;
        
        if (record.$type === 'app.bsky.actor.profile') {
            return 'self';
        }
        
        return cid.toString().slice(-12);
    }

    static async listRecords(carFilePath) {
        const extractor = new CarExtractor(carFilePath);
        const carBuffer = fs.readFileSync(carFilePath);
        const reader = await CarReader.fromBytes(carBuffer);
        
        console.log(`=== Records in ${path.basename(carFilePath)} ===`);
        console.log('Collection/RecordKey\t\tCID');
        
        for await (const { cid, bytes } of reader.blocks()) {
            try {
                const decoded = decode(bytes);
                
                if (extractor.isRecordBlock(decoded)) {
                    const collection = decoded.$type;
                    const rkey = extractor.extractRecordKey(decoded, cid);
                    const recordKey = `${collection}/${rkey}`;
                    console.log(`${recordKey}\t${cid}`);
                }
            } catch (error) {
                continue;
            }
        }
    }
}

function showUsage() {
    console.log('Usage:');
    console.log('  uncar <command> <car-file> [output-directory]');
    console.log('');
    console.log('Commands:');
    console.log('  extract    Extract all records from CAR file to JSON files');
    console.log('  list       List all records in the CAR file');
    console.log('');
    console.log('Examples:');
    console.log('  uncar extract repo.car');
    console.log('  uncar extract repo.car ./output');
    console.log('  uncar list repo.car');
}

async function main() {
    const args = process.argv.slice(2);
    
    if (args.length < 2) {
        showUsage();
        process.exit(1);
    }
    
    const [command, carFile, outputDir] = args;
    
    if (!fs.existsSync(carFile)) {
        console.error(`Error: CAR file not found: ${carFile}`);
        process.exit(1);
    }
    
    try {
        switch (command) {
            case 'extract':
                const extractor = new CarExtractor(carFile);
                await extractor.extract(outputDir);
                break;
                
            case 'list':
                await CarExtractor.listRecords(carFile);
                break;
                
            default:
                console.error(`Error: Unknown command: ${command}`);
                showUsage();
                process.exit(1);
        }
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { CarExtractor };
