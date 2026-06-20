# DOC-DEP-001 部署手册

## 1. 部署配置

项目部署元数据位于 `.jeemoo/project.json`：

| 字段 | 值 |
|------|-----|
| name | LearningKids |
| serverId | OpenClaw1Y |
| remotePath | /home/ubuntu/LearningKids |
| staticPath | /var/www/fx |
| service | learningkids-api |
| 构建产物 | `dist/` |

服务器详情见用户目录 `~/.jeemoo/servers.json`，SSH 密钥存放于 `~/.jeemoo/keys/`。

## 2. 前置要求

- Node.js 18+
- PowerShell 5.1+（Windows）
- `~/.jeemoo/keys/` 中对应服务器的 SSH 密钥已就位

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
# 将 dist/* 上传到 project.json 中配置的 remotePath
```

## 4. 服务端更新

部署静态资源后，可按 `project.json` 中的 `updateScript` 重启 API 并同步到 `staticPath`：

```bash
sudo systemctl restart learningkids-api && sudo rsync -a --delete dist-staging/ /var/www/fx/
```

## 5. 回滚

保留上一版 `dist/` 备份，或通过 Git 检出历史版本重新构建部署。
