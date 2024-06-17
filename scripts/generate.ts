import { promises as fs } from 'fs';
import * as readline from 'readline';
import * as path from 'path';
import * as process from 'process';

// Function to get user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askQuestion(query: string): Promise<string> {
    return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
    try {
        //const collectionAddress: string = await askQuestion('Enter the collection address: '); 
        const collectionAddress = '0x176976F7B3Be1D40A3703A88250cdF11bB77f62c'
        const metaId = await askQuestion('Enter the ID for the meta file: ');
        const startId = parseInt(await askQuestion('Enter the starting ID: '), 10);
        const count = parseInt(await askQuestion('Enter the number of copies to create: '), 10);

        rl.close();

        const filePath = path.join(process.cwd(), collectionAddress, metaId, 'index.json');
        const indexFile = await fs.readFile(filePath, 'utf8');
        const indexData = JSON.parse(indexFile);

        for (let i = 0; i < count; i++) {
            const folderId = (startId + i).toString();
            const folderPath = path.join(process.cwd(), collectionAddress, folderId);

            indexData.id = folderId;

            await fs.mkdir(folderPath, { recursive: true });
            await fs.writeFile(path.join(folderPath, 'index.json'), JSON.stringify(indexData, null, 2));

            console.log(`Created folder: ${path.join(collectionAddress, folderId)}`);
        }
        
        console.log('Operation completed successfully.');
    } catch (error) {
        console.error('An error occurred:', error);
        rl.close();
    }
}

main();
