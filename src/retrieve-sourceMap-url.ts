import { defaultRetrieveFileHandler } from './default-retrieve-file-handler';

export function retrieveSourceMapURL(source) {
  // Get the URL of the source map
  var fileData = defaultRetrieveFileHandler(source);
  //        //# sourceMappingURL=foo.js.map                       /*# sourceMappingURL=foo.js.map */
  var re = /(?:\/\/[@#][ \t]+sourceMappingURL=([^\s'"]+?)[ \t]*$)|(?:\/\*[@#][ \t]+sourceMappingURL=([^\*]+?)[ \t]*(?:\*\/)[ \t]*$)/mg;
  // Keep executing the search to find the *last* sourceMappingURL to avoid
  // picking up sourceMappingURLs from comments, strings, etc.
  var lastMatch, match;
  while (match = re.exec(fileData)) lastMatch = match;
  if (!lastMatch) return null;
  return lastMatch[1];
};