# DSH Remote Console

DSH Remote Console 是 [DeepSeek Harness (DSH)](https://github.com/deepseek-ai/deepseek-harness) Web profile 的移动端增强插件，插件 ID 为 `dsh-mobile`。它通过 Tailscale Serve 将本机 DSH 安全地提供给手机浏览器，无需在公网监听端口。

## 功能

- 显示 DSH 连接、运行、等待操作和就绪状态。
- 统计待处理/已完成会话，并跳转到下一个会话。
- 通过 DSH 官方 Session RPC 停止当前任务。
- 在浏览器页面存活时提供待操作/任务完成通知。
- 支持浏览器的“安装应用”提示。
- 仅在手机/触摸屏布局中显示，不替换 DSH 原有界面。

## 设计

```text
手机浏览器
    |
    | Tailscale HTTPS（Tailnet 内）
    v
Tailscale Serve :8443
    |
    | http://127.0.0.1:3080
    v
DSH Web + dsh-mobile
    |
    v
DSH 官方 Session / RPC / Permission / Reconnect
```

插件不解析会话 JSONL，不创建额外的 DSH 子进程，不提供终端或 `bypassPermissions`。客户端以附加项方式注册到官方 `conversation.input.dock` Slot。

## 环境要求

- Windows 10/11
- DSH `0.1.0-rc.6`
- Node.js `22.19+` 或 `24+`
- Corepack
- [Tailscale](https://tailscale.com/download)（远程访问需要）

## 官方安装方式

DSH 官方插件分发路径是 `dsh plugin --profile <name> add`，支持 npm 包、tarball 和 GitHub 安装。

```sh
# 从 npm（发布后）
dsh plugin --profile web add @wahu/dsh-mobile

# 从本地 tarball
corepack pnpm pack
dsh plugin --profile web add ./wahu-dsh-mobile-0.1.1.tgz

# 从 GitHub（已提供 prepare 构建）
dsh plugin --profile web add github:ZSLsherly/DSH-remote-console
```

> 包名 `@wahu/dsh-mobile`，插件 ID 同为 `dsh-mobile`；包内已声明 `dsh.bundle` 与 `dsh.client` manifest。

## 安装

在 CMD 中执行：

```cmd
git clone https://github.com/ZSLsherly/DSH-remote-console.git
cd /d DSH-remote-console
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\install.ps1
```

安装脚本会完成依赖安装、类型检查、测试、构建，然后把当前目录链接到 DSH `web` profile。

验证 profile：

```cmd
dsh.cmd --profile web --dump-config | findstr /i dsh-mobile
```

## 本机使用

```cmd
dsh.cmd --profile web --port 3080
```

浏览器打开 `http://127.0.0.1:3080`。

## 手机远程访问

### 1. 首次配置

电脑和手机先登录同一个 Tailnet。在电脑 CMD 中执行：

```cmd
cd /d DSH-remote-console
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\start-remote.ps1 -ConfigureServe
```

脚本会：

1. 从 `tailscale status --json` 读取当前设备的 MagicDNS 域名。
2. 配置 Tailscale HTTPS 8443 代理到 `127.0.0.1:3080`。
3. 以该 MagicDNS authority 作为 `--trusted-host` 启动 DSH。
4. 如果端口上已有符合安全要求的 DSH，则验证后复用它。

脚本输出的 `Mobile URL` 就是手机访问地址，例如：

```text
https://device-name.example.ts.net:8443/
```

### 2. 手机登录

1. 在 iOS/Android 安装 Tailscale。
2. 登录与电脑相同的 Tailscale 账号，或加入同一 Tailnet。
3. 确认手机 Tailscale 状态为已连接。
4. 用手机浏览器打开脚本输出的 `Mobile URL`。

DSH 没有额外的账号登录页；Tailnet 成员身份和 ACL 就是访问边界。

### 3. 日常启动

Tailscale Serve 配置会保留。电脑重启后只需：

```cmd
cd /d DSH-remote-console
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\start-remote.ps1
```

如果脚本新启动了 DSH，该 CMD 窗口需要保持打开；按 `Ctrl+C` 停止。

### 4. 连通性验证

新开 CMD：

```cmd
cd /d DSH-remote-console
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\check-remote.ps1
```

检查 Tailscale Serve 状态：

```cmd
"C:\Program Files\Tailscale\tailscale.exe" serve status
```

## 安全边界

- DSH 只监听 `127.0.0.1`，不使用 `0.0.0.0`。
- 远程脚本只配置 Tailscale Serve，不开启 Funnel。
- `--trusted-host` 只加入当前设备的 MagicDNS `:8443` authority。
- Tailscale Serve 默认仅 Tailnet 内可见，请同时维护好 Tailnet ACL。
- 页面通知不是 Web Push；浏览器必须保持页面存活。

停用 8443 代理：

```cmd
"C:\Program Files\Tailscale\tailscale.exe" serve --https=8443 off
```

## 开发

```cmd
corepack.cmd pnpm install
corepack.cmd pnpm run check
```

`check` 依次执行 TypeScript 类型检查、Vitest 测试和 Node/浏览器 bundle 构建。

## License

[MIT](./LICENSE)

## 生态标签

该仓库/包使用以下标签便于 DSH 插件市场与社区索引发现：

- GitHub topics：`dsh-plugin`、`deepseek-harness`、`dsh`、`mobile`、`remote-console`、`tailscale`
- npm keywords：`dsh-plugin`、`deepseek-harness`、`dsh`、`mobile`、`remote-console`、`tailscale`
