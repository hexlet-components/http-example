import fs from 'node:fs';
import path from 'node:path';
import yaml from 'yaml';
import { getInitData } from '../server/utils.js';

const { dirname } = import.meta;

const state = getInitData();

const version = '1.0';
const openapiFilePath = path.join(dirname, '..', `tsp-output/@typespec/openapi3/openapi.${version}.yaml`);

const openapiContent = fs.readFileSync(openapiFilePath, 'utf-8');
const parsedOpenapi = yaml.parse(openapiContent);

const processTree = (tree) => {
  const paths = Object.keys(tree.paths);
  const pathsData = paths.reduce((acc, key) => {
    const regex = /(?<=\{)(.*)(?=\})/;
    const found = key.match(regex);
    if (!found) {
      return acc;
    }
    return [
      ...acc, {
      currentPath: key,
      idPath: found[0],
    }];
  }, []);
  for (const { currentPath, idPath } of pathsData) {
    const regex = /^\/\w*/;
    const found = currentPath.match(regex);
    console.log('found: ', found);
    const name = found[0].replace('/', '');
    const id = state[name][0].id;
    const methods = Object.values(tree.paths[currentPath]);
    for (const currentMethod of methods) {
      const parameter = currentMethod.parameters.find((item) => item.name === idPath);
      parameter.example = id;
    }
  }
};

processTree(parsedOpenapi);

const result = yaml.stringify(parsedOpenapi);

fs.writeFileSync(openapiFilePath, result, 'utf-8');
