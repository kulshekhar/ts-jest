"use strict";(self.webpackChunkts_jest_docs=self.webpackChunkts_jest_docs||[]).push([[1966],{4137:function(e,t,n){n.d(t,{Zo:function(){return c},kt:function(){return d}});var r=n(7294);function o(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function i(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}function a(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?i(Object(n),!0).forEach((function(t){o(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):i(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function s(e,t){if(null==e)return{};var n,r,o=function(e,t){if(null==e)return{};var n,r,o={},i=Object.keys(e);for(r=0;r<i.length;r++)n=i[r],t.indexOf(n)>=0||(o[n]=e[n]);return o}(e,t);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(e);for(r=0;r<i.length;r++)n=i[r],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(o[n]=e[n])}return o}var p=r.createContext({}),l=function(e){var t=r.useContext(p),n=t;return e&&(n="function"==typeof e?e(t):a(a({},t),e)),n},c=function(e){var t=l(e.components);return r.createElement(p.Provider,{value:t},e.children)},u={inlineCode:"code",wrapper:function(e){var t=e.children;return r.createElement(r.Fragment,{},t)}},f=r.forwardRef((function(e,t){var n=e.components,o=e.mdxType,i=e.originalType,p=e.parentName,c=s(e,["components","mdxType","originalType","parentName"]),f=l(n),d=o,m=f["".concat(p,".").concat(d)]||f[d]||u[d]||i;return n?r.createElement(m,a(a({ref:t},c),{},{components:n})):r.createElement(m,a({ref:t},c))}));function d(e,t){var n=arguments,o=t&&t.mdxType;if("string"==typeof e||o){var i=n.length,a=new Array(i);a[0]=f;var s={};for(var p in t)hasOwnProperty.call(t,p)&&(s[p]=t[p]);s.originalType=e,s.mdxType="string"==typeof e?e:o,a[1]=s;for(var l=2;l<i;l++)a[l]=n[l];return r.createElement.apply(null,a)}return r.createElement.apply(null,n)}f.displayName="MDXCreateElement"},4998:function(e,t,n){n.r(t),n.d(t,{assets:function(){return c},contentTitle:function(){return p},default:function(){return d},frontMatter:function(){return s},metadata:function(){return l},toc:function(){return u}});var r=n(7462),o=n(3366),i=(n(7294),n(4137)),a=["components"],s={title:"Stringify content option"},p=void 0,l={unversionedId:"getting-started/options/stringifyContentPathRegex",id:"version-27.0/getting-started/options/stringifyContentPathRegex",title:"Stringify content option",description:"The stringifyContentPathRegex option has been kept for backward compatibility of HTML_TRANSFORM",source:"@site/versioned_docs/version-27.0/getting-started/options/stringifyContentPathRegex.md",sourceDirName:"getting-started/options",slug:"/getting-started/options/stringifyContentPathRegex",permalink:"/ts-jest/docs/27.0/getting-started/options/stringifyContentPathRegex",draft:!1,editUrl:"https://github.com/kulshekhar/ts-jest/edit/main/website/versioned_docs/version-27.0/getting-started/options/stringifyContentPathRegex.md",tags:[],version:"27.0",lastUpdatedBy:"Ahn",lastUpdatedAt:1662988724,formattedLastUpdatedAt:"Sep 12, 2022",frontMatter:{title:"Stringify content option"}},c={},u=[{value:"Example",id:"example",level:3}],f={toc:u};function d(e){var t=e.components,n=(0,o.Z)(e,a);return(0,i.kt)("wrapper",(0,r.Z)({},f,n,{components:t,mdxType:"MDXLayout"}),(0,i.kt)("p",null,"The ",(0,i.kt)("inlineCode",{parentName:"p"},"stringifyContentPathRegex")," option has been kept for backward compatibility of ",(0,i.kt)("inlineCode",{parentName:"p"},"__HTML_TRANSFORM__"),"\nIt's a regular expression pattern used to match the path of file to be transformed.\nIf it matches, the file will be exported as a module exporting its content."),(0,i.kt)("p",null,"Let's say for example that you have a file ",(0,i.kt)("inlineCode",{parentName:"p"},"foo.ts")," which contains ",(0,i.kt)("inlineCode",{parentName:"p"},'export default "bar"'),", and your ",(0,i.kt)("inlineCode",{parentName:"p"},"stringifyContentPathRegex")," is set to ",(0,i.kt)("inlineCode",{parentName:"p"},"foo\\\\.ts$"),", the resulting module won't be the result of compiling ",(0,i.kt)("inlineCode",{parentName:"p"},"foo.ts")," source, but instead it'll be a module which exports the string ",(0,i.kt)("inlineCode",{parentName:"p"},'"export default \\"bar\\""'),"."),(0,i.kt)("p",null,(0,i.kt)("strong",{parentName:"p"},"CAUTION"),": Whatever file(s) you want to match with ",(0,i.kt)("inlineCode",{parentName:"p"},"stringifyContentPathRegex")," pattern, you must ensure the Jest ",(0,i.kt)("inlineCode",{parentName:"p"},"transform")," option pointing to ",(0,i.kt)("inlineCode",{parentName:"p"},"ts-jest")," matches them. You may also have to add the extension(s) of this/those file(s) to ",(0,i.kt)("inlineCode",{parentName:"p"},"moduleFileExtensions")," Jest option."),(0,i.kt)("h3",{id:"example"},"Example"),(0,i.kt)("p",null,"In the ",(0,i.kt)("inlineCode",{parentName:"p"},"jest.config.js")," version, you could do as in the ",(0,i.kt)("inlineCode",{parentName:"p"},"package.json")," version of the config, but extending from the preset will ensure more compatibility without any changes when updating."),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-js"},"// jest.config.js\n// Here `defaults` can be replaced with any other preset\nconst { defaults: tsjPreset } = require('ts-jest/presets')\n\nmodule.exports = {\n  // [...]\n  moduleFileExtensions: [...tsjPreset.moduleFileExtensions, 'html'],\n  transform: {\n    ...tsjPreset.transform,\n    '\\\\.html$': 'ts-jest',\n  },\n  globals: {\n    'ts-jest': {\n      stringifyContentPathRegex: /\\.html$/,\n    },\n  },\n}\n")),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-json"},'// OR package.json\n{\n  // [...]\n  "jest": {\n    "moduleFileExtensions": ["js", "ts", "html"],\n    "transform": {\n      "\\\\.(html|ts|js)$": "ts-jest"\n    },\n    "globals": {\n      "ts-jest": {\n        "stringifyContentPathRegex": "\\\\.html$"\n      }\n    }\n  }\n}\n')))}d.isMDXComponent=!0}}]);