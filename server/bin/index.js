#!/usr/bin/env node

import app from '../index.js';

const port = process.env.port ?? 5000;
const host = process.env.host ?? '0.0.0.0';

app(host, port);
