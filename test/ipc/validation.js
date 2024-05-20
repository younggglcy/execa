import test from 'ava';
import {execa} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {foobarString} from '../helpers/input.js';
import {getStdio} from '../helpers/stdio.js';

setFixtureDirectory();

const stdioIpc = getStdio(3, 'ipc');

const testRequiredIpcSubprocess = async (t, methodName, options) => {
	const subprocess = execa('empty.js', options);
	const {message} = await t.throws(() => subprocess[methodName]());
	t.true(message.includes(`subprocess.${methodName}() can only be used`));
	await subprocess;
};

test('Cannot use subprocess.sendMessage() without ipc option', testRequiredIpcSubprocess, 'sendMessage', {});
test('Cannot use subprocess.sendMessage() with ipc: false', testRequiredIpcSubprocess, 'sendMessage', {ipc: false});
test('Cannot use subprocess.sendMessage() with stdio: [..., "ipc"]', testRequiredIpcSubprocess, 'sendMessage', stdioIpc);
test('Cannot use subprocess.getOneMessage() without ipc option', testRequiredIpcSubprocess, 'getOneMessage', {});
test('Cannot use subprocess.getOneMessage() with ipc: false', testRequiredIpcSubprocess, 'getOneMessage', {ipc: false});
test('Cannot use subprocess.getOneMessage() with stdio: [..., "ipc"]', testRequiredIpcSubprocess, 'getOneMessage', stdioIpc);
test('Cannot use subprocess.exchangeMessage() without ipc option', testRequiredIpcSubprocess, 'exchangeMessage', {});
test('Cannot use subprocess.exchangeMessage() with ipc: false', testRequiredIpcSubprocess, 'exchangeMessage', {ipc: false});
test('Cannot use subprocess.exchangeMessage() with stdio: [..., "ipc"]', testRequiredIpcSubprocess, 'exchangeMessage', stdioIpc);
test('Cannot use subprocess.getEachMessage() without ipc option', testRequiredIpcSubprocess, 'getEachMessage', {});
test('Cannot use subprocess.getEachMessage() with ipc: false', testRequiredIpcSubprocess, 'getEachMessage', {ipc: false});
test('Cannot use subprocess.getEachMessage() with stdio: [..., "ipc"]', testRequiredIpcSubprocess, 'getEachMessage', stdioIpc);

const testRequiredIpcExports = async (t, methodName, options) => {
	const {message} = await t.throwsAsync(execa('ipc-any.js', [methodName], options));
	t.true(message.includes(`${methodName}() can only be used`));
};

test('Cannot use exports.sendMessage() without ipc option', testRequiredIpcExports, 'sendMessage', {});
test('Cannot use exports.sendMessage() with ipc: false', testRequiredIpcExports, 'sendMessage', {ipc: false});
test('Cannot use exports.getOneMessage() without ipc option', testRequiredIpcExports, 'getOneMessage', {});
test('Cannot use exports.getOneMessage() with ipc: false', testRequiredIpcExports, 'getOneMessage', {ipc: false});
test('Cannot use exports.exchangeMessage() without ipc option', testRequiredIpcExports, 'exchangeMessage', {});
test('Cannot use exports.exchangeMessage() with ipc: false', testRequiredIpcExports, 'exchangeMessage', {ipc: false});
test('Cannot use exports.getEachMessage() without ipc option', testRequiredIpcExports, 'getEachMessage', {});
test('Cannot use exports.getEachMessage() with ipc: false', testRequiredIpcExports, 'getEachMessage', {ipc: false});

const testPostDisconnection = async (t, methodName) => {
	const subprocess = execa('empty.js', {ipc: true});
	await subprocess;
	const {message} = t.throws(() => subprocess[methodName](foobarString));
	t.true(message.includes(`subprocess.${methodName}() cannot be used`));
};

test('subprocess.sendMessage() after disconnection', testPostDisconnection, 'sendMessage');
test('subprocess.getOneMessage() after disconnection', testPostDisconnection, 'getOneMessage');
test('subprocess.exchangeMessage() after disconnection', testPostDisconnection, 'exchangeMessage');
test('subprocess.getEachMessage() after disconnection', testPostDisconnection, 'getEachMessage');

const testPostDisconnectionSubprocess = async (t, methodName) => {
	const subprocess = execa('ipc-disconnect.js', [methodName], {ipc: true});
	subprocess.disconnect();
	const {message} = await t.throwsAsync(subprocess);
	t.true(message.includes(`${methodName}() cannot be used`));
};

test('exports.sendMessage() after disconnection', testPostDisconnectionSubprocess, 'sendMessage');
test('exports.getOneMessage() after disconnection', testPostDisconnectionSubprocess, 'getOneMessage');
test('exports.exchangeMessage() after disconnection', testPostDisconnectionSubprocess, 'exchangeMessage');
test('exports.getEachMessage() after disconnection', testPostDisconnectionSubprocess, 'getEachMessage');

const testInvalidPayload = async (t, methodName, serialization, message) => {
	const subprocess = execa('empty.js', {ipc: true, serialization});
	await t.throwsAsync(subprocess[methodName](message), {message: /type is invalid/});
	await subprocess;
};

const cycleObject = {};
cycleObject.self = cycleObject;
const toJsonCycle = {toJSON: () => ({test: true, toJsonCycle})};

test('subprocess.sendMessage() cannot send undefined', testInvalidPayload, 'sendMessage', 'advanced', undefined);
test('subprocess.sendMessage() cannot send bigints', testInvalidPayload, 'sendMessage', 'advanced', 0n);
test('subprocess.sendMessage() cannot send symbols', testInvalidPayload, 'sendMessage', 'advanced', Symbol('test'));
test('subprocess.sendMessage() cannot send functions', testInvalidPayload, 'sendMessage', 'advanced', () => {});
test('subprocess.sendMessage() cannot send promises', testInvalidPayload, 'sendMessage', 'advanced', Promise.resolve());
test('subprocess.sendMessage() cannot send proxies', testInvalidPayload, 'sendMessage', 'advanced', new Proxy({}, {}));
test('subprocess.sendMessage() cannot send Intl', testInvalidPayload, 'sendMessage', 'advanced', new Intl.Collator());
test('subprocess.sendMessage() cannot send undefined, JSON', testInvalidPayload, 'sendMessage', 'json', undefined);
test('subprocess.sendMessage() cannot send bigints, JSON', testInvalidPayload, 'sendMessage', 'json', 0n);
test('subprocess.sendMessage() cannot send symbols, JSON', testInvalidPayload, 'sendMessage', 'json', Symbol('test'));
test('subprocess.sendMessage() cannot send functions, JSON', testInvalidPayload, 'sendMessage', 'json', () => {});
test('subprocess.sendMessage() cannot send cycles, JSON', testInvalidPayload, 'sendMessage', 'json', cycleObject);
test('subprocess.sendMessage() cannot send cycles in toJSON(), JSON', testInvalidPayload, 'sendMessage', 'json', toJsonCycle);
test('subprocess.exchangeMessage() cannot send undefined', testInvalidPayload, 'exchangeMessage', 'advanced', undefined);
test('subprocess.exchangeMessage() cannot send bigints', testInvalidPayload, 'exchangeMessage', 'advanced', 0n);
test('subprocess.exchangeMessage() cannot send symbols', testInvalidPayload, 'exchangeMessage', 'advanced', Symbol('test'));
test('subprocess.exchangeMessage() cannot send functions', testInvalidPayload, 'exchangeMessage', 'advanced', () => {});
test('subprocess.exchangeMessage() cannot send promises', testInvalidPayload, 'exchangeMessage', 'advanced', Promise.resolve());
test('subprocess.exchangeMessage() cannot send proxies', testInvalidPayload, 'exchangeMessage', 'advanced', new Proxy({}, {}));
test('subprocess.exchangeMessage() cannot send Intl', testInvalidPayload, 'exchangeMessage', 'advanced', new Intl.Collator());
test('subprocess.exchangeMessage() cannot send undefined, JSON', testInvalidPayload, 'exchangeMessage', 'json', undefined);
test('subprocess.exchangeMessage() cannot send bigints, JSON', testInvalidPayload, 'exchangeMessage', 'json', 0n);
test('subprocess.exchangeMessage() cannot send symbols, JSON', testInvalidPayload, 'exchangeMessage', 'json', Symbol('test'));
test('subprocess.exchangeMessage() cannot send functions, JSON', testInvalidPayload, 'exchangeMessage', 'json', () => {});
test('subprocess.exchangeMessage() cannot send cycles, JSON', testInvalidPayload, 'exchangeMessage', 'json', cycleObject);
test('subprocess.exchangeMessage() cannot send cycles in toJSON(), JSON', testInvalidPayload, 'exchangeMessage', 'json', toJsonCycle);

const testSubprocessInvalidPayload = async (t, methodName, fixtureName) => {
	const subprocess = execa(fixtureName, {ipc: true});
	await subprocess.sendMessage([undefined]);
	const {message} = await t.throwsAsync(subprocess);
	t.true(message.includes(`${methodName}()'s argument type is invalid`));
};

test('exports.sendMessage() validates payload', testSubprocessInvalidPayload, 'sendMessage', 'ipc-echo-item.js');
test('exports.exchangeMessage() validates payload', testSubprocessInvalidPayload, 'exchangeMessage', 'ipc-echo-item-exchange.js');
