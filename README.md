# ChatDome Web 🛡️

这是 [ChatDome](https://github.com/ChatDome/ChatDome) 的官方介绍网页，采用了极简、零依赖的 **原生 HTML5 + CSS3 + Vanilla JS** 架构开发。具有纯粹的静态特性，能够以极高的性能运行，并且完美契合了“极客”、“暗黑”与“赛博安全”的视觉美学。

## 🚀 最佳部署实践 (面向未来的多子域名架构)

考虑到未来可能需要为 API 端点、控制台界面等分配独立的子域名，强烈建议在服务端采用 **Nginx** 作为统一的流量入口。以下是规范的部署方案：

### 1. 建立规范的发布目录
不要将代码混入默认的 `/var/www/html` 目录，也不要把 Git 仓库直接 `clone` 到网站根目录。网站根目录只存放已经发布的静态文件，避免 `.git`、脚本、配置文件等被公网访问。

```bash
# 1. 创建 ChatDome 官网的发布目录 (以 chatdome.com 为例)
sudo mkdir -p /var/www/chatdome.com/html

# 2. 赋予当前服务器用户操作权限
sudo chown -R $USER:$USER /var/www/chatdome.com/html
```

### 2. 编写 Nginx 独立配置
Nginx 管理多站点的核心法则是：**一个域名，一份独立配置**。

创建专门属于该静态主页的配置文件：
```bash
sudo vim /etc/nginx/sites-available/chatdome.com
```

写入以下支持扩展的配置，并将 `yourdomain.com` 替换为您刚购买的域名：
```nginx
server {
    listen 80;
    listen [::]:80;

    # 这里填写顶级域名和 www 域名
    server_name yourdomain.com www.yourdomain.com;

    # 指向代码所在目录
    root /var/www/chatdome.com/html;
    index index.html;

    # 独立的日志记录，方便排障与流量监控
    access_log /var/log/nginx/chatdome_access.log;
    error_log /var/log/nginx/chatdome_error.log;

    # SPA及静态文件路由规则
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 安全兜底：禁止访问 .git、.env、.vscode 等隐藏文件/目录
    # 保留 .well-known 用于 Let's Encrypt 等证书签发校验
    location ~ /\.(?!well-known) {
        deny all;
    }
}
```

### 3. 安装自动更新脚本
自动更新脚本位于 `deploy/deploy-chatdome-web.sh`。它会从 GitHub 下载压缩包，解压到临时目录，校验核心文件后再同步到 Nginx 网站目录。

首次在服务器安装脚本：

```bash
sudo mkdir -p /opt/chatdome-web
sudo wget -O /opt/chatdome-web/deploy-chatdome-web.sh \
  https://raw.githubusercontent.com/ChatDome/ChatDome-web/main/deploy/deploy-chatdome-web.sh
sudo chmod +x /opt/chatdome-web/deploy-chatdome-web.sh
```

每次本地调试完成并 `git push` 后，在服务器执行：

```bash
SITE_ROOT=/var/www/chatdome.com/html \
  /opt/chatdome-web/deploy-chatdome-web.sh
```

默认会拉取 `main` 分支。如果要发布指定 tag：

```bash
REF_PATH=refs/tags/v0.2.1 \
SITE_ROOT=/var/www/chatdome.com/html \
  /opt/chatdome-web/deploy-chatdome-web.sh
```

脚本默认会在同步完成后执行 `nginx -t` 并重载 Nginx。如只想更新文件、不重载 Nginx：

```bash
RELOAD_NGINX=0 \
SITE_ROOT=/var/www/chatdome.com/html \
  /opt/chatdome-web/deploy-chatdome-web.sh
```

如果希望服务器定时自动拉取最新版本，可以用 `crontab -e` 添加：

```cron
*/5 * * * * SITE_ROOT=/var/www/chatdome.com/html /opt/chatdome-web/deploy-chatdome-web.sh >> /var/log/chatdome-web-deploy.log 2>&1
```

### 4. 上线与测试
配置完成后，将该配置“激活”并重启 Nginx：

```bash
# 将配置软链接到 enabled 目录进行激活
sudo ln -s /etc/nginx/sites-available/chatdome.com /etc/nginx/sites-enabled/

# 测试 Nginx 配置文件是否无语法错误
sudo nginx -t

# 平滑重启以加载新站点
sudo systemctl restart nginx
```

---

## 🔮 未来扩容：子域名挂载演示

假如未来你开发了后端的接口服务，需要运行在 `api.yourdomain.com`，整个流程将极其简单且不会干扰主站：

1. 在服务器启动后端服务，例如运行在本地 `localhost:8080` 端口。
2. 创建新的配置文件：`sudo vim /etc/nginx/sites-available/api.chatdome.com`
3. 填入反向代理配置：
   ```nginx
   server {
       listen 80;
       server_name api.yourdomain.com;
       
       location / {
           proxy_pass http://127.0.0.1:8080;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```
4. `ln -s` 生成软链并 `sudo nginx -s reload`。

### 🛡️ 安全合规提醒
部署完成后，请务必前往域名 DNS 服务商与云服务器的安全组设置中，确保 **开放了 TCP 的 80 (HTTP) 和 443 (HTTPS) 端口**，并为您的主站配置免费的 SSL 证书（如 Let's Encrypt），以确保数据通信安全。
