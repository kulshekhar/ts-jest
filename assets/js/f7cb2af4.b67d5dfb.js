"use strict";(self.webpackChunkts_jest_docs=self.webpackChunkts_jest_docs||[]).push([[4985],{4137:function(e,t,n){n.d(t,{Zo:function(){return u},kt:function(){return m}});var a=n(7294);function r(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function o(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);t&&(a=a.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,a)}return n}function i(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?o(Object(n),!0).forEach((function(t){r(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):o(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function s(e,t){if(null==e)return{};var n,a,r=function(e,t){if(null==e)return{};var n,a,r={},o=Object.keys(e);for(a=0;a<o.length;a++)n=o[a],t.indexOf(n)>=0||(r[n]=e[n]);return r}(e,t);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(a=0;a<o.length;a++)n=o[a],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(r[n]=e[n])}return r}var l=a.createContext({}),p=function(e){var t=a.useContext(l),n=t;return e&&(n="function"==typeof e?e(t):i(i({},t),e)),n},u=function(e){var t=p(e.components);return a.createElement(l.Provider,{value:t},e.children)},c={inlineCode:"code",wrapper:function(e){var t=e.children;return a.createElement(a.Fragment,{},t)}},f=a.forwardRef((function(e,t){var n=e.components,r=e.mdxType,o=e.originalType,l=e.parentName,u=s(e,["components","mdxType","originalType","parentName"]),f=p(n),m=r,d=f["".concat(l,".").concat(m)]||f[m]||c[m]||o;return n?a.createElement(d,i(i({ref:t},u),{},{components:n})):a.createElement(d,i({ref:t},u))}));function m(e,t){var n=arguments,r=t&&t.mdxType;if("string"==typeof e||r){var o=n.length,i=new Array(o);i[0]=f;var s={};for(var l in t)hasOwnProperty.call(t,l)&&(s[l]=t[l]);s.originalType=e,s.mdxType="string"==typeof e?e:r,i[1]=s;for(var p=2;p<o;p++)i[p]=n[p];return a.createElement.apply(null,i)}return a.createElement.apply(null,n)}f.displayName="MDXCreateElement"},425:function(e,t,n){n.d(t,{Z:function(){return i}});var a=n(7294),r=n(6010),o="tabItem_Ymn6";function i(e){var t=e.children,n=e.hidden,i=e.className;return a.createElement("div",{role:"tabpanel",className:(0,r.Z)(o,i),hidden:n},t)}},4259:function(e,t,n){n.d(t,{Z:function(){return m}});var a=n(7462),r=n(7294),o=n(6010),i=n(1048),s=n(3609),l=n(1943),p=n(2957),u="tabList__CuJ",c="tabItem_LNqP";function f(e){var t,n,i=e.lazy,f=e.block,m=e.defaultValue,d=e.values,g=e.groupId,b=e.className,h=r.Children.map(e.children,(function(e){if((0,r.isValidElement)(e)&&"value"in e.props)return e;throw new Error("Docusaurus error: Bad <Tabs> child <"+("string"==typeof e.type?e.type:e.type.name)+'>: all children of the <Tabs> component should be <TabItem>, and every <TabItem> should have a unique "value" prop.')})),y=null!=d?d:h.map((function(e){var t=e.props;return{value:t.value,label:t.label,attributes:t.attributes}})),v=(0,s.l)(y,(function(e,t){return e.value===t.value}));if(v.length>0)throw new Error('Docusaurus error: Duplicate values "'+v.map((function(e){return e.value})).join(", ")+'" found in <Tabs>. Every value needs to be unique.');var k=null===m?m:null!=(t=null!=m?m:null==(n=h.find((function(e){return e.props.default})))?void 0:n.props.value)?t:h[0].props.value;if(null!==k&&!y.some((function(e){return e.value===k})))throw new Error('Docusaurus error: The <Tabs> has a defaultValue "'+k+'" but none of its children has the corresponding value. Available values are: '+y.map((function(e){return e.value})).join(", ")+". If you intend to show no default tab, use defaultValue={null} instead.");var j=(0,l.U)(),T=j.tabGroupChoices,N=j.setTabGroupChoices,x=(0,r.useState)(k),C=x[0],w=x[1],O=[],J=(0,p.o5)().blockElementScrollPositionUntilNextRender;if(null!=g){var S=T[g];null!=S&&S!==C&&y.some((function(e){return e.value===S}))&&w(S)}var _=function(e){var t=e.currentTarget,n=O.indexOf(t),a=y[n].value;a!==C&&(J(t),w(a),null!=g&&N(g,String(a)))},E=function(e){var t,n=null;switch(e.key){case"ArrowRight":var a,r=O.indexOf(e.currentTarget)+1;n=null!=(a=O[r])?a:O[0];break;case"ArrowLeft":var o,i=O.indexOf(e.currentTarget)-1;n=null!=(o=O[i])?o:O[O.length-1]}null==(t=n)||t.focus()};return r.createElement("div",{className:(0,o.Z)("tabs-container",u)},r.createElement("ul",{role:"tablist","aria-orientation":"horizontal",className:(0,o.Z)("tabs",{"tabs--block":f},b)},y.map((function(e){var t=e.value,n=e.label,i=e.attributes;return r.createElement("li",(0,a.Z)({role:"tab",tabIndex:C===t?0:-1,"aria-selected":C===t,key:t,ref:function(e){return O.push(e)},onKeyDown:E,onFocus:_,onClick:_},i,{className:(0,o.Z)("tabs__item",c,null==i?void 0:i.className,{"tabs__item--active":C===t})}),null!=n?n:t)}))),i?(0,r.cloneElement)(h.filter((function(e){return e.props.value===C}))[0],{className:"margin-top--md"}):r.createElement("div",{className:"margin-top--md"},h.map((function(e,t){return(0,r.cloneElement)(e,{key:t,hidden:e.props.value!==C})}))))}function m(e){var t=(0,i.Z)();return r.createElement(f,(0,a.Z)({key:String(t)},e))}},8602:function(e,t,n){n.r(t),n.d(t,{assets:function(){return f},contentTitle:function(){return u},default:function(){return g},frontMatter:function(){return p},metadata:function(){return c},toc:function(){return m}});var a=n(7462),r=n(3366),o=(n(7294),n(4137)),i=n(4259),s=n(425),l=["components"],p={title:"TypeScript Config option"},u=void 0,c={unversionedId:"getting-started/options/tsconfig",id:"getting-started/options/tsconfig",title:"TypeScript Config option",description:"The tsconfig option allows you to define which tsconfig JSON file to use. An inline compiler options object can also be specified instead of a file path.",source:"@site/docs/getting-started/options/tsconfig.md",sourceDirName:"getting-started/options",slug:"/getting-started/options/tsconfig",permalink:"/ts-jest/docs/next/getting-started/options/tsconfig",draft:!1,editUrl:"https://github.com/kulshekhar/ts-jest/edit/main/website/docs/getting-started/options/tsconfig.md",tags:[],version:"current",lastUpdatedBy:"Ahn",lastUpdatedAt:1663094696,formattedLastUpdatedAt:"Sep 13, 2022",frontMatter:{title:"TypeScript Config option"}},f={},m=[{value:"Examples",id:"examples",level:3},{value:"Path to a <code>tsconfig</code> file",id:"path-to-a-tsconfig-file",level:4},{value:"Inline compiler options",id:"inline-compiler-options",level:4},{value:"Disable auto-lookup",id:"disable-auto-lookup",level:4}],d={toc:m};function g(e){var t=e.components,n=(0,r.Z)(e,l);return(0,o.kt)("wrapper",(0,a.Z)({},d,n,{components:t,mdxType:"MDXLayout"}),(0,o.kt)("p",null,"The ",(0,o.kt)("inlineCode",{parentName:"p"},"tsconfig")," option allows you to define which ",(0,o.kt)("inlineCode",{parentName:"p"},"tsconfig")," JSON file to use. An inline ",(0,o.kt)("a",{parentName:"p",href:"https://www.typescriptlang.org/docs/handbook/compiler-options.html#compiler-options"},"compiler options")," object can also be specified instead of a file path."),(0,o.kt)("p",null,"By default ",(0,o.kt)("inlineCode",{parentName:"p"},"ts-jest")," will try to find a ",(0,o.kt)("inlineCode",{parentName:"p"},"tsconfig.json")," in your project. If it cannot find one, it will use the default TypeScript ",(0,o.kt)("a",{parentName:"p",href:"https://www.typescriptlang.org/docs/handbook/compiler-options.html#compiler-options"},"compiler options"),"; except, ",(0,o.kt)("inlineCode",{parentName:"p"},"ES2015")," is used as ",(0,o.kt)("inlineCode",{parentName:"p"},"target")," instead of ",(0,o.kt)("inlineCode",{parentName:"p"},"ES5"),"."),(0,o.kt)("p",null,"If you need to use defaults and force ",(0,o.kt)("inlineCode",{parentName:"p"},"ts-jest")," to use the defaults even if there is a ",(0,o.kt)("inlineCode",{parentName:"p"},"tsconfig.json")," in your project, you can set this option to ",(0,o.kt)("inlineCode",{parentName:"p"},"false"),"."),(0,o.kt)("h3",{id:"examples"},"Examples"),(0,o.kt)("h4",{id:"path-to-a-tsconfig-file"},"Path to a ",(0,o.kt)("inlineCode",{parentName:"h4"},"tsconfig")," file"),(0,o.kt)("p",null,"The path should be relative to the current working directory where you start Jest from. You can also use ",(0,o.kt)("inlineCode",{parentName:"p"},"<rootDir>")," in the path to start from the project root dir."),(0,o.kt)(i.Z,{groupId:"code-examples",mdxType:"Tabs"},(0,o.kt)(s.Z,{value:"js",label:"JavaScript",mdxType:"TabItem"},(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-js",metastring:"tab",tab:!0},"/** @type {import('ts-jest').JestConfigWithTsJest} */\nmodule.exports = {\n  // [...]\n  transform: {\n    '<regex_match_files': [\n      'ts-jest',\n      {\n        tsconfig: 'tsconfig.test.json',\n      },\n    ],\n  },\n}\n"))),(0,o.kt)(s.Z,{value:"ts",label:"TypeScript",mdxType:"TabItem"},(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-ts",metastring:"tab",tab:!0},"import type { JestConfigWithTsJest } from './types'\n\nconst jestConfig: JestConfigWithTsJest = {\n  // [...]\n  transform: {\n    '<regex_match_files': [\n      'ts-jest',\n      {\n        tsconfig: 'tsconfig.test.json',\n      },\n    ],\n  },\n}\n\nexport default jestConfig\n"))),(0,o.kt)(s.Z,{value:"JSON",mdxType:"TabItem"},(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-JSON",metastring:"tab",tab:!0},'{\n  // [...]\n  "jest": {\n    "transform": {\n      "<regex_match_files>": [\n        "ts-jest",\n        {\n          "tsconfig": "tsconfig.test.json"\n        }\n      ]\n    }\n  }\n}\n')))),(0,o.kt)("h4",{id:"inline-compiler-options"},"Inline compiler options"),(0,o.kt)("p",null,"Refer to the TypeScript ",(0,o.kt)("a",{parentName:"p",href:"https://www.typescriptlang.org/docs/handbook/compiler-options.html#compiler-options"},"compiler options")," for reference.\nIt's basically the same object you'd put in your ",(0,o.kt)("inlineCode",{parentName:"p"},"tsconfig.json"),"'s ",(0,o.kt)("inlineCode",{parentName:"p"},"compilerOptions"),"."),(0,o.kt)(i.Z,{groupId:"code-examples",mdxType:"Tabs"},(0,o.kt)(s.Z,{value:"js",label:"JavaScript",mdxType:"TabItem"},(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-js",metastring:"tab",tab:!0},"/** @type {import('ts-jest').JestConfigWithTsJest} */\nmodule.exports = {\n  // [...]\n  transform: {\n    '<regex_match_files': [\n      'ts-jest',\n      {\n        tsconfig: {\n          importHelpers: true,\n        },\n      },\n    ],\n  },\n}\n"))),(0,o.kt)(s.Z,{value:"ts",label:"TypeScript",mdxType:"TabItem"},(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-ts",metastring:"tab",tab:!0},"import type { JestConfigWithTsJest } from './types'\n\nconst jestConfig: JestConfigWithTsJest = {\n  // [...]\n  transform: {\n    '<regex_match_files': [\n      'ts-jest',\n      {\n        tsconfig: {\n          importHelpers: true,\n        },\n      },\n    ],\n  },\n}\n\nexport default jestConfig\n"))),(0,o.kt)(s.Z,{value:"JSON",mdxType:"TabItem"},(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-JSON",metastring:"tab",tab:!0},'{\n  // [...]\n  "jest": {\n    "transform": {\n      "<regex_match_files>": [\n        "ts-jest",\n        {\n          "tsconfig": {\n            "importHelpers": true\n          }\n        }\n      ]\n    }\n  }\n}\n')))),(0,o.kt)("h4",{id:"disable-auto-lookup"},"Disable auto-lookup"),(0,o.kt)("p",null,"By default ",(0,o.kt)("inlineCode",{parentName:"p"},"ts-jest")," will try to find a ",(0,o.kt)("inlineCode",{parentName:"p"},"tsconfig.json")," in your project. But you may not want to use it at all and keep TypeScript default options. You can achieve this by setting ",(0,o.kt)("inlineCode",{parentName:"p"},"tsconfig")," to ",(0,o.kt)("inlineCode",{parentName:"p"},"false"),"."),(0,o.kt)(i.Z,{groupId:"code-examples",mdxType:"Tabs"},(0,o.kt)(s.Z,{value:"js",label:"JavaScript",mdxType:"TabItem"},(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-js",metastring:"tab",tab:!0},"/** @type {import('ts-jest').JestConfigWithTsJest} */\nmodule.exports = {\n  // [...]\n  transform: {\n    '<regex_match_files': [\n      'ts-jest',\n      {\n        tsconfig: false,\n      },\n    ],\n  },\n}\n"))),(0,o.kt)(s.Z,{value:"ts",label:"TypeScript",mdxType:"TabItem"},(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-ts",metastring:"tab",tab:!0},"import type { JestConfigWithTsJest } from './types'\n\nconst jestConfig: JestConfigWithTsJest = {\n  // [...]\n  transform: {\n    '<regex_match_files': [\n      'ts-jest',\n      {\n        tsconfig: false,\n      },\n    ],\n  },\n}\n\nexport default jestConfig\n"))),(0,o.kt)(s.Z,{value:"JSON",mdxType:"TabItem"},(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-JSON",metastring:"tab",tab:!0},'{\n  // [...]\n  "jest": {\n    "transform": {\n      "<regex_match_files>": [\n        "ts-jest",\n        {\n          "tsconfig": {\n            "tsconfig": false\n          }\n        }\n      ]\n    }\n  }\n}\n')))))}g.isMDXComponent=!0}}]);