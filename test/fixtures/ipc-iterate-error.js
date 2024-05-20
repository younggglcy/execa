#!/usr/bin/env node
import process from 'node:process';
import {foobarString} from '../helpers/input.js';
import {iterateAllMessages} from '../helpers/ipc.js';

const cause = new Error(foobarString);
await Promise.all([
	iterateAllMessages(),
	process.emit('error', cause),
]);
