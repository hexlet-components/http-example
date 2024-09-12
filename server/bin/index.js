#!/usr/bin/env node

import app from '../index.js';

const port = process.env.PORT || 5000;
const host = process.env.host || '0.0.0.0';

console.log('Port: ', port);

app(host, port);
