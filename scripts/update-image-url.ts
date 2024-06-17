import * as fs from 'fs';
import * as readline from 'readline';
import * as path from 'path';
import * as process from 'process';

const MAX_CONCURRENT_OPERATIONS = 1;
let activeOperations = 0;
const operationQueue: (() => void)[] = [];

// Function to get user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve));
}

const readFile = (filePath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};

const writeFile = (filePath: string, data: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, data, 'utf8', (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

const processFile = async (filePath: string, oldUrl: string, newUrl: string) => {
  try {
    const data = await readFile(filePath);
    const newData = data.replace(oldUrl, newUrl);
    await writeFile(filePath, newData);
    console.log(`Updated file: ${filePath}`);
  } catch (err) {
    console.error(`Error processing file ${filePath}: ${err}`);
  } finally {
    activeOperations--;
    processQueue();
  }
};

const processQueue = () => {
  while (operationQueue.length > 0 && activeOperations < MAX_CONCURRENT_OPERATIONS) {
    const nextOperation = operationQueue.shift();
    if (nextOperation) {
      activeOperations++;
      nextOperation();
    }
  }
};

const queueOperation = (operation: () => void) => {
  operationQueue.push(operation);
  processQueue();
};

const updateIndexJsonFiles = async (dir: string, oldUrl: string, newUrl: string) => {
  const files = await fs.promises.readdir(dir);

  await Promise.all(
    files.map(async (file) => {
      const filePath = path.join(dir, file);
      const stats = await fs.promises.stat(filePath);

      if (stats.isDirectory()) {
        await updateIndexJsonFiles(filePath, oldUrl, newUrl);
      } else if (file === 'index.json') {
        queueOperation(() => processFile(filePath, oldUrl, newUrl));
      }
    })
  );
};

(async () => {
  const collectionAddress = '0x176976F7B3Be1D40A3703A88250cdF11bB77f62c';
  const oldUrl = await askQuestion('Enter the old image base URL: ');
  const newUrl = await askQuestion('Enter the new image base URL: ');
  const folderPath = path.join(process.cwd(), collectionAddress);

  await updateIndexJsonFiles(folderPath, oldUrl, newUrl);

  // Wait for the queue to be fully processed
  const interval = setInterval(() => {
    if (operationQueue.length === 0 && activeOperations === 0) {
      clearInterval(interval);
      console.log('All files processed');
      rl.close();
    }
  }, 100);
})();
