---
id: processing
title: Processing flow
---

_These are internal technical documents. If you're not a contributor to `ts-jest`, but simply trying to use the library you'll find nothing of value here_

## Jest process

```plantuml
start

:require('file');

if (has a transform?) then (yes)
if (transformer has getCacheKey?) then (yes)
:transformer.getCacheKey(...);
else (no)
:use jest built-in;
endif

if (in cache?) then (yes)
:use cache content;
else (no)
:transformer.process(...);
:update cache;
endif

else (no)
endif

:require();

end
```

## `ts-jest` process

```plantuml
|processor|
start

:tsJest.process(source);

if (should stringify?) then (yes)
:json stringify;
-> update
source;

else (no)
endif

if (filename ends with .d.ts) then (yes)
:wipe source;
note right
no need to compile
definition files
end note

else (no)

|#Thistle|compiler (cached)|
if (isolated modules?) then (yes)
else (no)
:create and cache
ts lang service;
endif

-> source;

if (in persistent cache?) then (yes)
:update mem cache
from persistent cache;

else (no)
if (isolated modules?) then (yes)
:compile with
transpileModule;
note left
files will be compiled
as isolated modules
end note

    else (no)
      :compile with
      service;
      note left
        make use of the service
        created above and cached

        mem cache is used when
        reading files
      end note

    endif

    :custom AST
    transformers;
    note left
      here is where hoisting of
      jest.mock is done, as well as
      user-defined transformations
      based on config
    end note

    -> compiled source;

    :fix source maps;
    :update mem cache;
    :update persistent cache;

endif
|processor|

-> update
source;

endif

if (should use babel?) then (yes)
:babelJest.process(source);
note left
calls babel-jest
processor
end note
-> update
source;

else (no)
endif

if (has afterProcess hook?) then (yes)
:call afterProcess hook;
-> update
source;
note left
if the hook returns
something it'll be
used as new source
end note

endif

:transformed source;

end
```
