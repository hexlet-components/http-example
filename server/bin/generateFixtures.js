import fs from 'node:fs/promises';
import path from 'node:path';
import { generateInitData } from '../src/utils.js';

const { dirname } = import.meta;

const data = generateInitData();
const actions = Object.keys(data).map((model) => {
  const preparedData = JSON.stringify(data[model], null ,2);
  const fullPath = path.join(dirname, `../../__fixtures__/${model}.json`)
  return fs.writeFile(fullPath, preparedData);
})
Promise.all(actions).then(() => console.log('Finished!'));

