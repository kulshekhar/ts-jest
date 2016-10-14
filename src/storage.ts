import { handlerExec } from './handler-exec';

export class Storage {
    public static environment: 'auto' | 'browser' | 'node' = 'auto';
    // Only install once if called multiple times
    public static errorFormatterInstalled = false;
    public static uncaughtShimInstalled = false;
    // If true, the caches are reset before a stack trace formatting operation
    public static emptyCacheBetweenOperations = false;
    // Maps a file path to a string containing the file contents
    public static fileContentsCache = {};
    // Maps a file path to a source map for that file
    public static sourceMapCache = {};
    // Regex for detecting source maps
    public static reSourceMap = /^data:application\/json[^,]+base64,/;
    // Priority list of retrieve handlers
    public static retrieveFileHandlers = [];
    public static retrieveMapHandlers = [];
    // Can be overridden by the retrieveSourceMap option to install. Takes a
    // generated source filename; returns a {map, optional url} object, or null if
    // there is no source map.  The map field may be either a string or the parsed
    // JSON object (ie, it must be a valid argument to the SourceMapConsumer
    // constructor).
    public static retrieveSourceMap = handlerExec(Storage.retrieveMapHandlers);
    public static retrieveFile = handlerExec(Storage.retrieveFileHandlers);
    public static isInBrowser() {
        if (this.environment === 'browser')
            return true;
        if (this.environment === 'node')
            return false;
        return ((typeof window !== 'undefined') && (typeof XMLHttpRequest === 'function') && !(window['require'] && window['module'] && window['process'] && window['process']['type'] === 'renderer'));
    }
}
