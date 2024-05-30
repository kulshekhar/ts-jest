"use strict";(self.webpackChunkts_jest_docs=self.webpackChunkts_jest_docs||[]).push([[1268],{3669:(e,n,t)=>{t.r(n),t.d(n,{assets:()=>r,contentTitle:()=>c,default:()=>p,frontMatter:()=>i,metadata:()=>l,toc:()=>a});var o=t(4848),s=t(8453);const i={title:"TypeScript Config option"},c=void 0,l={id:"getting-started/options/tsconfig",title:"TypeScript Config option",description:"The tsconfig option allows you to define which tsconfig JSON file to use. An inline compiler options object can also be specified instead of a file path.",source:"@site/versioned_docs/version-27.1/getting-started/options/tsconfig.md",sourceDirName:"getting-started/options",slug:"/getting-started/options/tsconfig",permalink:"/ts-jest/docs/27.1/getting-started/options/tsconfig",draft:!1,unlisted:!1,editUrl:"https://github.com/kulshekhar/ts-jest/edit/main/website/versioned_docs/version-27.1/getting-started/options/tsconfig.md",tags:[],version:"27.1",lastUpdatedBy:"renovate[bot]",lastUpdatedAt:1717064786e3,frontMatter:{title:"TypeScript Config option"}},r={},a=[{value:"Examples",id:"examples",level:3},{value:"Path to a <code>tsconfig</code> file",id:"path-to-a-tsconfig-file",level:4},{value:"Inline compiler options",id:"inline-compiler-options",level:4},{value:"Disable auto-lookup",id:"disable-auto-lookup",level:4}];function d(e){const n={a:"a",code:"code",h3:"h3",h4:"h4",p:"p",pre:"pre",...(0,s.R)(),...e.components};return(0,o.jsxs)(o.Fragment,{children:[(0,o.jsxs)(n.p,{children:["The ",(0,o.jsx)(n.code,{children:"tsconfig"})," option allows you to define which ",(0,o.jsx)(n.code,{children:"tsconfig"})," JSON file to use. An inline ",(0,o.jsx)(n.a,{href:"https://www.typescriptlang.org/docs/handbook/compiler-options.html#compiler-options",children:"compiler options"})," object can also be specified instead of a file path."]}),"\n",(0,o.jsxs)(n.p,{children:["By default ",(0,o.jsx)(n.code,{children:"ts-jest"})," will try to find a ",(0,o.jsx)(n.code,{children:"tsconfig.json"})," in your project. If it cannot find one, it will use the default TypeScript ",(0,o.jsx)(n.a,{href:"https://www.typescriptlang.org/docs/handbook/compiler-options.html#compiler-options",children:"compiler options"}),"; except, ",(0,o.jsx)(n.code,{children:"ES2015"})," is used as ",(0,o.jsx)(n.code,{children:"target"})," instead of ",(0,o.jsx)(n.code,{children:"ES5"}),"."]}),"\n",(0,o.jsxs)(n.p,{children:["If you need to use defaults and force ",(0,o.jsx)(n.code,{children:"ts-jest"})," to use the defaults even if there is a ",(0,o.jsx)(n.code,{children:"tsconfig.json"})," in your project, you can set this option to ",(0,o.jsx)(n.code,{children:"false"}),"."]}),"\n",(0,o.jsx)(n.h3,{id:"examples",children:"Examples"}),"\n",(0,o.jsxs)(n.h4,{id:"path-to-a-tsconfig-file",children:["Path to a ",(0,o.jsx)(n.code,{children:"tsconfig"})," file"]}),"\n",(0,o.jsxs)(n.p,{children:["The path should be relative to the current working directory where you start Jest from. You can also use ",(0,o.jsx)(n.code,{children:"<rootDir>"})," in the path to start from the project root dir."]}),"\n",(0,o.jsx)(n.pre,{children:(0,o.jsx)(n.code,{className:"language-js",children:"// jest.config.js\nmodule.exports = {\n  // [...]\n  globals: {\n    'ts-jest': {\n      tsconfig: 'tsconfig.test.json',\n    },\n  },\n}\n"})}),"\n",(0,o.jsx)(n.pre,{children:(0,o.jsx)(n.code,{className:"language-json",children:'// OR package.json\n{\n  // [...]\n  "jest": {\n    "globals": {\n      "ts-jest": {\n        "tsconfig": "tsconfig.test.json"\n      }\n    }\n  }\n}\n'})}),"\n",(0,o.jsx)(n.h4,{id:"inline-compiler-options",children:"Inline compiler options"}),"\n",(0,o.jsxs)(n.p,{children:["Refer to the TypeScript ",(0,o.jsx)(n.a,{href:"https://www.typescriptlang.org/docs/handbook/compiler-options.html#compiler-options",children:"compiler options"})," for reference.\nIt's basically the same object you'd put in your ",(0,o.jsx)(n.code,{children:"tsconfig.json"}),"'s ",(0,o.jsx)(n.code,{children:"compilerOptions"}),"."]}),"\n",(0,o.jsx)(n.pre,{children:(0,o.jsx)(n.code,{className:"language-js",children:"// jest.config.js\nmodule.exports = {\n  // [...]\n  globals: {\n    'ts-jest': {\n      tsconfig: {\n        importHelpers: true,\n      },\n    },\n  },\n}\n"})}),"\n",(0,o.jsx)(n.pre,{children:(0,o.jsx)(n.code,{className:"language-json",children:'// OR package.json\n{\n  // [...]\n  "jest": {\n    "globals": {\n      "ts-jest": {\n        "tsconfig": {\n          "importHelpers": true\n        }\n      }\n    }\n  }\n}\n'})}),"\n",(0,o.jsx)(n.h4,{id:"disable-auto-lookup",children:"Disable auto-lookup"}),"\n",(0,o.jsxs)(n.p,{children:["By default ",(0,o.jsx)(n.code,{children:"ts-jest"})," will try to find a ",(0,o.jsx)(n.code,{children:"tsconfig.json"})," in your project. But you may not want to use it at all and keep TypeScript default options. You can achieve this by setting ",(0,o.jsx)(n.code,{children:"tsconfig"})," to ",(0,o.jsx)(n.code,{children:"false"}),"."]}),"\n",(0,o.jsx)(n.pre,{children:(0,o.jsx)(n.code,{className:"language-js",children:"// jest.config.js\nmodule.exports = {\n  // [...]\n  globals: {\n    'ts-jest': {\n      tsconfig: false,\n    },\n  },\n}\n"})}),"\n",(0,o.jsx)(n.pre,{children:(0,o.jsx)(n.code,{className:"language-json",children:'// OR package.json\n{\n  // [...]\n  "jest": {\n    "globals": {\n      "ts-jest": {\n        "tsconfig": false\n      }\n    }\n  }\n}\n'})})]})}function p(e={}){const{wrapper:n}={...(0,s.R)(),...e.components};return n?(0,o.jsx)(n,{...e,children:(0,o.jsx)(d,{...e})}):d(e)}},8453:(e,n,t)=>{t.d(n,{R:()=>c,x:()=>l});var o=t(6540);const s={},i=o.createContext(s);function c(e){const n=o.useContext(i);return o.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function l(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(s):e.components||s:c(e.components),o.createElement(i.Provider,{value:n},e.children)}}}]);