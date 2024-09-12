#!/usr/bin/env node

import app from '../index.js';

const port = process.env.port ?? 5037;
const host = process.env.host ?? '0.0.0.0';

app(host, port);
