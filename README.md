# Merit IT Feedback Software

一个最小版本的 IT 需求反馈系统，使用 Cloudflare Pages + Pages Functions + D1。

## 功能

- 员工提交软件需求反馈
- 字段包含需求类型、任务、反馈人、优先级、描述
- 管理员输入密码后查看全部需求
- 支持简体中文和繁体中文切换

## 本地运行

安装依赖：

```bash
npm install
```

本地 D1 表会在第一次提交或管理员查看时自动创建。也可以手动执行迁移：

```bash
npm run db:migrate:local
```

启动开发服务：

```bash
npm run dev
```

配置本地管理员密码。新建 `.dev.vars`，内容参考 `.dev.vars.example`：

```text
ADMIN_PASSWORD=你的后台密码
```

员工提交页：

```text
http://localhost:8788
```

管理员后台：

```text
http://localhost:8788/admin.html
```

## 部署到 Cloudflare Pages

1. 安装并登录 Wrangler：

```bash
npx wrangler login
```

2. 创建 D1 数据库：

```bash
npx wrangler d1 create merit-it-feedback
```

3. 把命令输出里的 `database_id` 填到 `wrangler.toml`。

4. 在远程 D1 执行迁移：

```bash
npm run db:migrate:remote
```

5. 部署 Pages：

```bash
npm run deploy
```

6. 在 Cloudflare Pages 项目设置里确认：

- D1 binding 名称是 `DB`
- 绑定到 `merit-it-feedback`
- 环境变量 `ADMIN_PASSWORD` 设置成你的后台密码

## 字段说明

- 需求类型：开发、维护、其他
- 任务：一句话描述需求
- 反馈人：提交人姓名
- 优先级：极高、中等、较低
- 描述：选填，用于补充详细背景
