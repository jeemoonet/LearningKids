# DOC-DEP-001 部署手册

## 1. 部署配置

项目部署元数据位于 `.jeemoo/project.json`：

| 字段 | 值 |
|------|-----|
| serverId | JeemooApps |
| remotePath | /home/ubuntu/junior-math |
| 构建产物 | `dist/` |

服务器详情见用户目录 `~/.jeemoo/servers.json`，SSH 密钥存放于 `~/.jeemoo/keys/`。

## 2. 前置要求

- Node.js 18+
- PowerShell 5.1+（Windows）
- `~/.jeemoo/keys/JeemooApps.pem` 已就位

## 3. 部署步骤

### 一键部署

```powershell
.\scripts\deploy.ps1
```

### 常用参数

| 参数 | 说明 |
|------|------|
| `-SkipBuild` | 跳过 `npm run build`，直接上传已有 `dist/` |
| `-DryRun` | 仅打印将要执行的命令，不实际上传 |

### 手动部署

```powershell
npm run build
scp -i $env:USERPROFILE\.jeemoo\keys\JeemooApps.pem -r dist/* ubuntu@81.70.187.19:/home/ubuntu/junior-math/
```

## 4. Nginx 配置（待办）

部署后需在服务器配置 Nginx 反向代理或静态文件服务，将域名指向 `remotePath`。

## 5. 回滚

保留上一版 `dist/` 备份，或通过 Git 检出历史版本重新构建部署。
