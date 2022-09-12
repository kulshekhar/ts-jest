"use strict";(self.webpackChunkts_jest_docs=self.webpackChunkts_jest_docs||[]).push([[1752],{4137:function(e,t,n){n.d(t,{Zo:function(){return p},kt:function(){return c}});var a=n(7294);function r(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function s(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);t&&(a=a.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,a)}return n}function i(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?s(Object(n),!0).forEach((function(t){r(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):s(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function l(e,t){if(null==e)return{};var n,a,r=function(e,t){if(null==e)return{};var n,a,r={},s=Object.keys(e);for(a=0;a<s.length;a++)n=s[a],t.indexOf(n)>=0||(r[n]=e[n]);return r}(e,t);if(Object.getOwnPropertySymbols){var s=Object.getOwnPropertySymbols(e);for(a=0;a<s.length;a++)n=s[a],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(r[n]=e[n])}return r}var o=a.createContext({}),d=function(e){var t=a.useContext(o),n=t;return e&&(n="function"==typeof e?e(t):i(i({},t),e)),n},p=function(e){var t=d(e.components);return a.createElement(o.Provider,{value:t},e.children)},m={inlineCode:"code",wrapper:function(e){var t=e.children;return a.createElement(a.Fragment,{},t)}},u=a.forwardRef((function(e,t){var n=e.components,r=e.mdxType,s=e.originalType,o=e.parentName,p=l(e,["components","mdxType","originalType","parentName"]),u=d(n),c=r,k=u["".concat(o,".").concat(c)]||u[c]||m[c]||s;return n?a.createElement(k,i(i({ref:t},p),{},{components:n})):a.createElement(k,i({ref:t},p))}));function c(e,t){var n=arguments,r=t&&t.mdxType;if("string"==typeof e||r){var s=n.length,i=new Array(s);i[0]=u;var l={};for(var o in t)hasOwnProperty.call(t,o)&&(l[o]=t[o]);l.originalType=e,l.mdxType="string"==typeof e?e:r,i[1]=l;for(var d=2;d<s;d++)i[d]=n[d];return a.createElement.apply(null,i)}return a.createElement.apply(null,n)}u.displayName="MDXCreateElement"},425:function(e,t,n){n.d(t,{Z:function(){return i}});var a=n(7294),r=n(6010),s="tabItem_Ymn6";function i(e){var t=e.children,n=e.hidden,i=e.className;return a.createElement("div",{role:"tabpanel",className:(0,r.Z)(s,i),hidden:n},t)}},4259:function(e,t,n){n.d(t,{Z:function(){return c}});var a=n(7462),r=n(7294),s=n(6010),i=n(1048),l=n(3609),o=n(1943),d=n(2957),p="tabList__CuJ",m="tabItem_LNqP";function u(e){var t,n,i=e.lazy,u=e.block,c=e.defaultValue,k=e.values,N=e.groupId,f=e.className,b=r.Children.map(e.children,(function(e){if((0,r.isValidElement)(e)&&"value"in e.props)return e;throw new Error("Docusaurus error: Bad <Tabs> child <"+("string"==typeof e.type?e.type:e.type.name)+'>: all children of the <Tabs> component should be <TabItem>, and every <TabItem> should have a unique "value" prop.')})),g=null!=k?k:b.map((function(e){var t=e.props;return{value:t.value,label:t.label,attributes:t.attributes}})),y=(0,l.l)(g,(function(e,t){return e.value===t.value}));if(y.length>0)throw new Error('Docusaurus error: Duplicate values "'+y.map((function(e){return e.value})).join(", ")+'" found in <Tabs>. Every value needs to be unique.');var j=null===c?c:null!=(t=null!=c?c:null==(n=b.find((function(e){return e.props.default})))?void 0:n.props.value)?t:b[0].props.value;if(null!==j&&!g.some((function(e){return e.value===j})))throw new Error('Docusaurus error: The <Tabs> has a defaultValue "'+j+'" but none of its children has the corresponding value. Available values are: '+g.map((function(e){return e.value})).join(", ")+". If you intend to show no default tab, use defaultValue={null} instead.");var C=(0,o.U)(),v=C.tabGroupChoices,h=C.setTabGroupChoices,w=(0,r.useState)(j),x=w[0],T=w[1],S=[],J=(0,d.o5)().blockElementScrollPositionUntilNextRender;if(null!=N){var E=v[N];null!=E&&E!==x&&g.some((function(e){return e.value===E}))&&T(E)}var O=function(e){var t=e.currentTarget,n=S.indexOf(t),a=g[n].value;a!==x&&(J(t),T(a),null!=N&&h(N,String(a)))},P=function(e){var t,n=null;switch(e.key){case"ArrowRight":var a,r=S.indexOf(e.currentTarget)+1;n=null!=(a=S[r])?a:S[0];break;case"ArrowLeft":var s,i=S.indexOf(e.currentTarget)-1;n=null!=(s=S[i])?s:S[S.length-1]}null==(t=n)||t.focus()};return r.createElement("div",{className:(0,s.Z)("tabs-container",p)},r.createElement("ul",{role:"tablist","aria-orientation":"horizontal",className:(0,s.Z)("tabs",{"tabs--block":u},f)},g.map((function(e){var t=e.value,n=e.label,i=e.attributes;return r.createElement("li",(0,a.Z)({role:"tab",tabIndex:x===t?0:-1,"aria-selected":x===t,key:t,ref:function(e){return S.push(e)},onKeyDown:P,onFocus:O,onClick:O},i,{className:(0,s.Z)("tabs__item",m,null==i?void 0:i.className,{"tabs__item--active":x===t})}),null!=n?n:t)}))),i?(0,r.cloneElement)(b.filter((function(e){return e.props.value===x}))[0],{className:"margin-top--md"}):r.createElement("div",{className:"margin-top--md"},b.map((function(e,t){return(0,r.cloneElement)(e,{key:t,hidden:e.props.value!==x})}))))}function c(e){var t=(0,i.Z)();return r.createElement(u,(0,a.Z)({key:String(t)},e))}},3534:function(e,t,n){n.r(t),n.d(t,{assets:function(){return u},contentTitle:function(){return p},default:function(){return N},frontMatter:function(){return d},metadata:function(){return m},toc:function(){return c}});var a=n(7462),r=n(3366),s=(n(7294),n(4137)),i=n(4259),l=n(425),o=["components"],d={id:"presets",title:"Presets"},p=void 0,m={unversionedId:"getting-started/presets",id:"getting-started/presets",title:"Presets",description:"The presets",source:"@site/docs/getting-started/presets.md",sourceDirName:"getting-started",slug:"/getting-started/presets",permalink:"/ts-jest/docs/next/getting-started/presets",draft:!1,editUrl:"https://github.com/kulshekhar/ts-jest/edit/main/website/docs/getting-started/presets.md",tags:[],version:"current",lastUpdatedBy:"Ahn",lastUpdatedAt:1662988724,formattedLastUpdatedAt:"Sep 12, 2022",frontMatter:{id:"presets",title:"Presets"},sidebar:"docs",previous:{title:"Installation",permalink:"/ts-jest/docs/next/getting-started/installation"},next:{title:"Options",permalink:"/ts-jest/docs/next/getting-started/options"}},u={},c=[{value:"The presets",id:"the-presets",level:3},{value:"Basic usage",id:"basic-usage",level:3},{value:"Advanced",id:"advanced",level:3}],k={toc:c};function N(e){var t=e.components,n=(0,r.Z)(e,o);return(0,s.kt)("wrapper",(0,a.Z)({},k,n,{components:t,mdxType:"MDXLayout"}),(0,s.kt)("h3",{id:"the-presets"},"The presets"),(0,s.kt)("admonition",{type:"important"},(0,s.kt)("p",{parentName:"admonition"},"Starting from ",(0,s.kt)("strong",{parentName:"p"},"v28.0.0"),", ",(0,s.kt)("inlineCode",{parentName:"p"},"ts-jest")," will gradually opt in adoption of ",(0,s.kt)("inlineCode",{parentName:"p"},"esbuild"),"/",(0,s.kt)("inlineCode",{parentName:"p"},"swc")," more to improve the performance. To make the transition smoothly, we introduce ",(0,s.kt)("inlineCode",{parentName:"p"},"legacy")," presets as a fallback when the new codes don't work yet.")),(0,s.kt)("p",null,(0,s.kt)("inlineCode",{parentName:"p"},"ts-jest")," comes with several presets, covering most of the project's base configuration:"),(0,s.kt)("table",null,(0,s.kt)("thead",{parentName:"table"},(0,s.kt)("tr",{parentName:"thead"},(0,s.kt)("th",{parentName:"tr",align:null},"Preset name"),(0,s.kt)("th",{parentName:"tr",align:null},"Description"))),(0,s.kt)("tbody",{parentName:"table"},(0,s.kt)("tr",{parentName:"tbody"},(0,s.kt)("td",{parentName:"tr",align:null},(0,s.kt)("inlineCode",{parentName:"td"},"ts-jest/presets/default"),(0,s.kt)("br",null),"or ",(0,s.kt)("inlineCode",{parentName:"td"},"ts-jest")),(0,s.kt)("td",{parentName:"tr",align:null},"TypeScript files (",(0,s.kt)("inlineCode",{parentName:"td"},".ts"),", ",(0,s.kt)("inlineCode",{parentName:"td"},".tsx"),") will be transformed by ",(0,s.kt)("inlineCode",{parentName:"td"},"ts-jest")," to ",(0,s.kt)("strong",{parentName:"td"},"CommonJS")," syntax, leaving JavaScript files (",(0,s.kt)("inlineCode",{parentName:"td"},".js"),", ",(0,s.kt)("inlineCode",{parentName:"td"},"jsx"),") as-is.")),(0,s.kt)("tr",{parentName:"tbody"},(0,s.kt)("td",{parentName:"tr",align:null},(0,s.kt)("inlineCode",{parentName:"td"},"ts-jest/presets/default-legacy"),(0,s.kt)("br",null),"or ",(0,s.kt)("inlineCode",{parentName:"td"},"ts-jest/legacy")," (",(0,s.kt)("strong",{parentName:"td"},"LEGACY"),")"),(0,s.kt)("td",{parentName:"tr",align:null},"TypeScript files (",(0,s.kt)("inlineCode",{parentName:"td"},".ts"),", ",(0,s.kt)("inlineCode",{parentName:"td"},".tsx"),") will be transformed by ",(0,s.kt)("inlineCode",{parentName:"td"},"ts-jest")," to ",(0,s.kt)("strong",{parentName:"td"},"CommonJS")," syntax, leaving JavaScript files (",(0,s.kt)("inlineCode",{parentName:"td"},".js"),", ",(0,s.kt)("inlineCode",{parentName:"td"},"jsx"),") as-is.")),(0,s.kt)("tr",{parentName:"tbody"},(0,s.kt)("td",{parentName:"tr",align:null},(0,s.kt)("inlineCode",{parentName:"td"},"ts-jest/presets/default-esm"),(0,s.kt)("br",null)),(0,s.kt)("td",{parentName:"tr",align:null},"TypeScript files (",(0,s.kt)("inlineCode",{parentName:"td"},".ts"),", ",(0,s.kt)("inlineCode",{parentName:"td"},".tsx"),") will be transformed by ",(0,s.kt)("inlineCode",{parentName:"td"},"ts-jest")," to ",(0,s.kt)("strong",{parentName:"td"},"ESM")," syntax, leaving JavaScript files (",(0,s.kt)("inlineCode",{parentName:"td"},".js"),", ",(0,s.kt)("inlineCode",{parentName:"td"},"jsx"),") as-is.")),(0,s.kt)("tr",{parentName:"tbody"},(0,s.kt)("td",{parentName:"tr",align:null},(0,s.kt)("inlineCode",{parentName:"td"},"ts-jest/presets/default-esm-legacy"),(0,s.kt)("br",null)," (",(0,s.kt)("strong",{parentName:"td"},"LEGACY"),")"),(0,s.kt)("td",{parentName:"tr",align:null},"TypeScript files (",(0,s.kt)("inlineCode",{parentName:"td"},".ts"),", ",(0,s.kt)("inlineCode",{parentName:"td"},".tsx"),") will be transformed by ",(0,s.kt)("inlineCode",{parentName:"td"},"ts-jest")," to ",(0,s.kt)("strong",{parentName:"td"},"ESM")," syntax, leaving JavaScript files (",(0,s.kt)("inlineCode",{parentName:"td"},".js"),", ",(0,s.kt)("inlineCode",{parentName:"td"},"jsx"),") as-is.")),(0,s.kt)("tr",{parentName:"tbody"},(0,s.kt)("td",{parentName:"tr",align:null},(0,s.kt)("inlineCode",{parentName:"td"},"ts-jest/presets/js-with-ts")),(0,s.kt)("td",{parentName:"tr",align:null},"TypeScript and JavaScript files (",(0,s.kt)("inlineCode",{parentName:"td"},".ts"),", ",(0,s.kt)("inlineCode",{parentName:"td"},".tsx"),", ",(0,s.kt)("inlineCode",{parentName:"td"},".js"),", ",(0,s.kt)("inlineCode",{parentName:"td"},".jsx"),") will be transformed by ",(0,s.kt)("inlineCode",{parentName:"td"},"ts-jest")," to ",(0,s.kt)("strong",{parentName:"td"},"CommonJS")," syntax.",(0,s.kt)("br",null),"You'll need to set ",(0,s.kt)("inlineCode",{parentName:"td"},"allowJs")," to ",(0,s.kt)("inlineCode",{parentName:"td"},"true")," in your ",(0,s.kt)("inlineCode",{parentName:"td"},"tsconfig.json")," file.")),(0,s.kt)("tr",{parentName:"tbody"},(0,s.kt)("td",{parentName:"tr",align:null},(0,s.kt)("inlineCode",{parentName:"td"},"ts-jest/presets/js-with-ts-legacy")," (",(0,s.kt)("strong",{parentName:"td"},"LEGACY"),")"),(0,s.kt)("td",{parentName:"tr",align:null},"TypeScript and JavaScript files (",(0,s.kt)("inlineCode",{parentName:"td"},".ts"),", ",(0,s.kt)("inlineCode",{parentName:"td"},".tsx"),", ",(0,s.kt)("inlineCode",{parentName:"td"},".js"),", ",(0,s.kt)("inlineCode",{parentName:"td"},".jsx"),") will be transformed by ",(0,s.kt)("inlineCode",{parentName:"td"},"ts-jest")," to ",(0,s.kt)("strong",{parentName:"td"},"CommonJS")," syntax.",(0,s.kt)("br",null),"You'll need to set ",(0,s.kt)("inlineCode",{parentName:"td"},"allowJs")," to ",(0,s.kt)("inlineCode",{parentName:"td"},"true")," in your ",(0,s.kt)("inlineCode",{parentName:"td"},"tsconfig.json")," file.")),(0,s.kt)("tr",{parentName:"tbody"},(0,s.kt)("td",{parentName:"tr",align:null},(0,s.kt)("inlineCode",{parentName:"td"},"ts-jest/presets/js-with-ts-esm")),(0,s.kt)("td",{parentName:"tr",align:null},"TypeScript and JavaScript files (",(0,s.kt)("inlineCode",{parentName:"td"},".ts"),", ",(0,s.kt)("inlineCode",{parentName:"td"},".tsx"),", ",(0,s.kt)("inlineCode",{parentName:"td"},".js"),", ",(0,s.kt)("inlineCode",{parentName:"td"},".jsx"),", ",(0,s.kt)("inlineCode",{parentName:"td"},".mjs"),") will be transformed by ",(0,s.kt)("inlineCode",{parentName:"td"},"ts-jest")," to ",(0,s.kt)("strong",{parentName:"td"},"ESM")," syntax.",(0,s.kt)("br",null),"You'll need to set ",(0,s.kt)("inlineCode",{parentName:"td"},"allowJs")," to ",(0,s.kt)("inlineCode",{parentName:"td"},"true")," in your ",(0,s.kt)("inlineCode",{parentName:"td"},"tsconfig.json")," file.")),(0,s.kt)("tr",{parentName:"tbody"},(0,s.kt)("td",{parentName:"tr",align:null},(0,s.kt)("inlineCode",{parentName:"td"},"ts-jest/presets/js-with-ts-esm-legacy")," (",(0,s.kt)("strong",{parentName:"td"},"LEGACY"),")"),(0,s.kt)("td",{parentName:"tr",align:null},"TypeScript and JavaScript files (",(0,s.kt)("inlineCode",{parentName:"td"},".ts"),", ",(0,s.kt)("inlineCode",{parentName:"td"},".tsx"),", ",(0,s.kt)("inlineCode",{parentName:"td"},".js"),", ",(0,s.kt)("inlineCode",{parentName:"td"},".jsx"),", ",(0,s.kt)("inlineCode",{parentName:"td"},".mjs"),") will be transformed by ",(0,s.kt)("inlineCode",{parentName:"td"},"ts-jest")," to ",(0,s.kt)("strong",{parentName:"td"},"ESM")," syntax.",(0,s.kt)("br",null),"You'll need to set ",(0,s.kt)("inlineCode",{parentName:"td"},"allowJs")," to ",(0,s.kt)("inlineCode",{parentName:"td"},"true")," in your ",(0,s.kt)("inlineCode",{parentName:"td"},"tsconfig.json")," file.")),(0,s.kt)("tr",{parentName:"tbody"},(0,s.kt)("td",{parentName:"tr",align:null},(0,s.kt)("inlineCode",{parentName:"td"},"ts-jest/presets/js-with-babel")),(0,s.kt)("td",{parentName:"tr",align:null},"TypeScript files (",(0,s.kt)("inlineCode",{parentName:"td"},".ts"),", ",(0,s.kt)("inlineCode",{parentName:"td"},".tsx"),") will be transformed by ",(0,s.kt)("inlineCode",{parentName:"td"},"ts-jest")," to ",(0,s.kt)("strong",{parentName:"td"},"CommonJS")," syntax, and JavaScript files (",(0,s.kt)("inlineCode",{parentName:"td"},".js"),", ",(0,s.kt)("inlineCode",{parentName:"td"},"jsx"),") will be transformed by ",(0,s.kt)("inlineCode",{parentName:"td"},"babel-jest"),".")),(0,s.kt)("tr",{parentName:"tbody"},(0,s.kt)("td",{parentName:"tr",align:null},(0,s.kt)("inlineCode",{parentName:"td"},"ts-jest/presets/js-with-babel-legacy")," (",(0,s.kt)("strong",{parentName:"td"},"LEGACY"),")"),(0,s.kt)("td",{parentName:"tr",align:null},"TypeScript files (",(0,s.kt)("inlineCode",{parentName:"td"},".ts"),", ",(0,s.kt)("inlineCode",{parentName:"td"},".tsx"),") will be transformed by ",(0,s.kt)("inlineCode",{parentName:"td"},"ts-jest")," to ",(0,s.kt)("strong",{parentName:"td"},"CommonJS")," syntax, and JavaScript files (",(0,s.kt)("inlineCode",{parentName:"td"},".js"),", ",(0,s.kt)("inlineCode",{parentName:"td"},"jsx"),") will be transformed by ",(0,s.kt)("inlineCode",{parentName:"td"},"babel-jest"),".")),(0,s.kt)("tr",{parentName:"tbody"},(0,s.kt)("td",{parentName:"tr",align:null},(0,s.kt)("inlineCode",{parentName:"td"},"ts-jest/presets/js-with-babel-esm")),(0,s.kt)("td",{parentName:"tr",align:null},"TypeScript files (",(0,s.kt)("inlineCode",{parentName:"td"},".ts"),", ",(0,s.kt)("inlineCode",{parentName:"td"},".tsx"),") will be transformed by ",(0,s.kt)("inlineCode",{parentName:"td"},"ts-jest")," to ",(0,s.kt)("strong",{parentName:"td"},"ESM")," syntax, and JavaScript files (",(0,s.kt)("inlineCode",{parentName:"td"},".js"),", ",(0,s.kt)("inlineCode",{parentName:"td"},"jsx"),", ",(0,s.kt)("inlineCode",{parentName:"td"},".mjs"),") will be transformed by ",(0,s.kt)("inlineCode",{parentName:"td"},"babel-jest"),".")),(0,s.kt)("tr",{parentName:"tbody"},(0,s.kt)("td",{parentName:"tr",align:null},(0,s.kt)("inlineCode",{parentName:"td"},"ts-jest/presets/js-with-babel-esm-legacy")," (",(0,s.kt)("strong",{parentName:"td"},"LEGACY"),")"),(0,s.kt)("td",{parentName:"tr",align:null},"TypeScript files (",(0,s.kt)("inlineCode",{parentName:"td"},".ts"),", ",(0,s.kt)("inlineCode",{parentName:"td"},".tsx"),") will be transformed by ",(0,s.kt)("inlineCode",{parentName:"td"},"ts-jest")," to ",(0,s.kt)("strong",{parentName:"td"},"ESM")," syntax, and JavaScript files (",(0,s.kt)("inlineCode",{parentName:"td"},".js"),", ",(0,s.kt)("inlineCode",{parentName:"td"},"jsx"),", ",(0,s.kt)("inlineCode",{parentName:"td"},".mjs"),") will be transformed by ",(0,s.kt)("inlineCode",{parentName:"td"},"babel-jest"),".")))),(0,s.kt)("h3",{id:"basic-usage"},"Basic usage"),(0,s.kt)("p",null,"In most cases, simply setting the ",(0,s.kt)("inlineCode",{parentName:"p"},"preset")," key to the desired preset name in your Jest config should be enough to start\nusing TypeScript with Jest (assuming you added ",(0,s.kt)("inlineCode",{parentName:"p"},"ts-jest")," to your ",(0,s.kt)("inlineCode",{parentName:"p"},"devDependencies")," of course):"),(0,s.kt)(i.Z,{groupId:"code-examples",mdxType:"Tabs"},(0,s.kt)(l.Z,{value:"js",label:"JavaScript",mdxType:"TabItem"},(0,s.kt)("pre",null,(0,s.kt)("code",{parentName:"pre",className:"language-js",metastring:"tab",tab:!0},"/** @type {import('ts-jest').JestConfigWithTsJest} */\nmodule.exports = {\n  // [...]\n  // Replace `ts-jest` with the preset you want to use\n  // from the above list\n  preset: 'ts-jest',\n}\n"))),(0,s.kt)(l.Z,{value:"ts",label:"TypeScript",mdxType:"TabItem"},(0,s.kt)("pre",null,(0,s.kt)("code",{parentName:"pre",className:"language-ts",metastring:"tab",tab:!0},"import type { JestConfigWithTsJest } from './types'\n\nconst jestConfig: JestConfigWithTsJest = {\n  // [...]\n  // Replace `ts-jest` with the preset you want to use\n  // from the above list\n  preset: 'ts-jest',\n}\n\nexport default jestConfig\n"))),(0,s.kt)(l.Z,{value:"JSON",mdxType:"TabItem"},(0,s.kt)("pre",null,(0,s.kt)("code",{parentName:"pre",className:"language-JSON",metastring:"tab",tab:!0},'{\n  // [...]\n  "jest": {\n    // Replace `ts-jest` with the preset you want to use\n    // from the above list\n    "preset": "ts-jest"\n  }\n}\n')))),(0,s.kt)("p",null,(0,s.kt)("strong",{parentName:"p"},"Note:")," presets use ",(0,s.kt)("inlineCode",{parentName:"p"},"testMatch"),", like Jest does in its defaults. If you want to use ",(0,s.kt)("inlineCode",{parentName:"p"},"testRegex")," instead in your configuration, you MUST set ",(0,s.kt)("inlineCode",{parentName:"p"},"testMatch")," to ",(0,s.kt)("inlineCode",{parentName:"p"},"null")," or Jest will bail."),(0,s.kt)("h3",{id:"advanced"},"Advanced"),(0,s.kt)("p",null,"Any preset can also be used with other options.\nIf you're already using another preset, you might want only some specific settings from the chosen ",(0,s.kt)("inlineCode",{parentName:"p"},"ts-jest")," preset.\nIn this case you'll need to use the JavaScript version of Jest config (comment/uncomment according to your use case):"),(0,s.kt)(i.Z,{groupId:"code-examples",mdxType:"Tabs"},(0,s.kt)(l.Z,{value:"js",label:"JavaScript",mdxType:"TabItem"},(0,s.kt)("pre",null,(0,s.kt)("code",{parentName:"pre",className:"language-js",metastring:"tab",tab:!0},"const { defaults: tsjPreset } = require('ts-jest/presets')\n// const { defaultsESM: tsjPreset } = require('ts-jest/presets')\n// const { jsWithTs: tsjPreset } = require('ts-jest/presets')\n// const { jsWithTsESM: tsjPreset } = require('ts-jest/presets')\n// const { jsWithBabel: tsjPreset } = require('ts-jest/presets')\n// const { jsWithBabelESM: tsjPreset } = require('ts-jest/presets')\n\n/** @type {import('ts-jest').JestConfigWithTsJest} */\nmodule.exports = {\n  // [...]\n  transform: {\n    ...tsjPreset.transform,\n    // [...]\n  },\n}\n"))),(0,s.kt)(l.Z,{value:"ts",label:"TypeScript",mdxType:"TabItem"},(0,s.kt)("pre",null,(0,s.kt)("code",{parentName:"pre",className:"language-ts",metastring:"tab",tab:!0},"import type { JestConfigWithTsJest } from './types'\n\nimport { defaults as tsjPreset } from 'ts-jest/presets'\n// import { defaultsESM as tsjPreset } from 'ts-jest/presets';\n// import { jsWithTs as tsjPreset } from 'ts-jest/presets';\n// import { jsWithTsESM as tsjPreset } from 'ts-jest/presets';\n// import { jsWithBabel as tsjPreset } from 'ts-jest/presets';\n// import { jsWithBabelESM as tsjPreset } from 'ts-jest/presets';\n\nconst jestConfig: JestConfigWithTsJest = {\n  // [...]\n  transform: {\n    ...tsjPreset.transform,\n    // [...]\n  },\n}\n\nexport default jestConfig\n")))))}N.isMDXComponent=!0}}]);