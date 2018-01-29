import * as fs from 'fs';
import * as path from 'path';

/**
 * Logger file that enables logging things just once. Does this by traversing the array of previously recorded
 * logs to see if the exact same message has already been logged
 * @type {any[]}
 */

const logs: any[] = [];
let logsFlushed: boolean = false;

function shouldLog(): boolean {
  // If the env variable is set and the logs have not already been flushed, log the line
  return process.env.TS_JEST_DEBUG && !logsFlushed;
}

// Log function. Only logs prior to calls to flushLogs.
export function logOnce(...thingsToLog: any[]) {
  if (!shouldLog()) {
    return;
  }
  logs.push(thingsToLog);
}

// This function JSONifies logs and flushes them to disk.
export function flushLogs() {
  if (!shouldLog()) {
    return; // only output stuff for the first invocation and if logging is enabled.
  }
  logsFlushed = true;
  const rootPath = path.resolve(__dirname, '../');
  const JSONifiedLogs = logs.map(convertToJSONIfPossible);
  const logString = JSONifiedLogs.join('\n');
  const filePath = path.resolve(rootPath, 'debug.txt');
  fs.writeFileSync(filePath, logString);
}

function includes<T>(array: T[], subject: T) {
  return array.indexOf(subject) !== -1;
}

function convertToJSONIfPossible(object: any): string {
  try {
    return JSON.stringify(object, null, 2);
  } catch {
    return object.toString(); // if unable to parse, simply return the string variant
  }
}
