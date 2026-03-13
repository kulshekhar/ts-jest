---
id: 调试
ts-is.log
---

您可以通过设置环境变量来激活调试记录器`TS_JEST_LOG`在运行测试之前。
记录器的输出将在**ts-is.log**使用哪个 Jest 配置或 TypeScript 配置等。

在当前工作目录中。`ts-它是`作品，包括处理哪些文件，
使用哪个 Jest 配置或 TypeScript 配置等。

**Linux/苹果系统PowerShell 选项卡

```
导出 TS_JEST_LOG=ts-jest.log
```

**Windows**

```命令提示符选项卡
设置 TS_JEST_LOG=ts-jest.log
```

```PowerShell 选项卡
$env:TS_JEST_LOG = 'ts-jest.log'
```
