import { retrieveSourceMapURL } from './retrieve-sourceMap-url';

export function defaultRetrieveMapHandler(source) {
  var sourceMappingURL = retrieveSourceMapURL(source);
  if (!sourceMappingURL) return null;

  // Reading source map URL as a data url, because it is always inlined
  var rawData = sourceMappingURL.slice(sourceMappingURL.indexOf(',') + 1);
  var sourceMapData = new Buffer(rawData, 'base64').toString();
  sourceMappingURL = null; //TODO: why `null` instead of `source` as in original sourceMaphandler? 

  if (!sourceMapData) return null;

  return {
    url: sourceMappingURL,
    map: sourceMapData
  };
}