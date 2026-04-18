# ChatDome Web

ChatDome 官方静态介绍页（HTML/CSS/JS）。

---

## 1. 必要目录（最少版）

```bash
sudo mkdir -p /var/www/chatdome.com/html
sudo chown -R $USER:$USER /var/www/chatdome.com/html
```

### 1.1 目录说明（只保留当前 `conf.d` 方案）

| 目录 | 是否手动创建 | 是否必须 | 用途 |
|---|---|---|---|
| `/var/www/chatdome.com/html` | 是 | 是 | 网站静态文件目录；Nginx `root` 与 `certbot --webroot` 都用它。 |
| `/etc/nginx/conf.d` | 通常否（系统已存在） | 是 | 你当前 Nginx 实际加载的站点配置目录。 |
| `/etc/letsencrypt` | 否（certbot 自动生成） | HTTPS 必需 | 存放证书与续期配置。 |
| `/opt/chatdome-web` | 是 | 否（可选） | 仅用于放自动更新脚本。 |

---

## 2. Nginx 配置（`conf.d`）

先确认仍是 `conf.d` 路线：

```bash
grep -n "include" /etc/nginx/nginx.conf
```

站点配置文件只写到 `/etc/nginx/conf.d/chatdome.org.conf`，不要写进 `/etc/nginx/nginx.conf`。

编辑配置文件：

```bash
sudo vim /etc/nginx/conf.d/chatdome.org.conf
```

先用 HTTP 配置（证书签发前）：

```nginx
server {
    # 监听 IPv4 的 80 端口（HTTP）
    listen 80;
    # 监听 IPv6 的 80 端口（HTTP）
    listen [::]:80;

    # 当前 server 块匹配的域名
    server_name chatdome.org www.chatdome.org;

    # 站点根目录（静态文件从这里读取）
    root /var/www/chatdome.com/html;
    # 目录请求时默认返回的首页文件
    index index.html;

    # 主路由规则：先找文件，再找目录，最后回退到 index.html（SPA）
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 禁止访问隐藏文件/目录（例如 .git、.env）
    # 但保留 .well-known 给证书校验使用
    location ~ /\.(?!well-known) {
        deny all;
    }
}
```

#### Nginx 服务命令

```bash
sudo systemctl stop nginx
sudo systemctl status nginx     # 看是否已停止
sudo systemctl start nginx      # 重新启动
sudo systemctl restart nginx    # 重启
sudo systemctl disable --now nginx
```

---

## 3. 自动更新脚本（可选）

如果你需要“一条命令从 Git 更新站点”，再安装：

```bash
sudo mkdir -p /opt/chatdome-web
sudo wget -O /opt/chatdome-web/deploy-chatdome-web.sh \
  https://raw.githubusercontent.com/ChatDome/ChatDome-web/main/deploy/deploy-chatdome-web.sh
sudo chmod +x /opt/chatdome-web/deploy-chatdome-web.sh
```

执行部署：

```bash
SITE_ROOT=/var/www/chatdome.com/html \
  /opt/chatdome-web/deploy-chatdome-web.sh
```

### 3.1 后续更新网站（固定流程）

本地改完代码后先推送：

```bash
git add .
git commit -m "update web"
git push origin main
```

然后在服务器执行更新（拉最新 `main` 并覆盖站点目录）：

```bash
SITE_ROOT=/var/www/chatdome.com/html \
  /opt/chatdome-web/deploy-chatdome-web.sh
```

如果要部署指定版本（例如 tag），使用：

```bash
REF_PATH=refs/tags/v1.0.0 \
SITE_ROOT=/var/www/chatdome.com/html \
  /opt/chatdome-web/deploy-chatdome-web.sh
```

更新后快速自测：

```bash
curl -I -H "Host: chatdome.org" http://127.0.0.1/
curl -I https://chatdome.org
```

---

## 4. 生效与测试

```bash
sudo nginx -t
sudo systemctl reload nginx
```

最关键的本机自测：

```bash
curl -I -H "Host: chatdome.org" http://127.0.0.1/
curl -H "Host: chatdome.org" http://127.0.0.1/ | head
```

公网排查：

```bash
curl -I -H "Host: chatdome.org" http://YOUR_SERVER_PUBLIC_IP/
curl -I https://chatdome.org
```

---

## 5. HTTPS 证书配置（注释版）

我们使用 **Let's Encrypt**。它是公开受信任的 CA，签发的是 DV（域名验证）证书，主流浏览器默认信任。

### 5.1 安装 Certbot（固定用 snap 版，避免旧版依赖冲突）

```bash
cat /etc/os-release
```

Debian/Ubuntu：

```bash
sudo apt update
sudo apt install -y snapd
```

CentOS/RHEL/Rocky/Alma：

```bash
sudo dnf install -y snapd
sudo systemctl enable --now snapd.socket
sudo ln -sf /var/lib/snapd/snap /snap
```

通用安装（两类系统都执行）：

```bash
sudo snap install core
sudo snap refresh core
sudo snap install --classic certbot
sudo ln -sf /snap/bin/certbot /usr/local/bin/certbot
/usr/local/bin/certbot --version
```

### 5.2 申请证书（webroot 模式）

如果你已经有 `chatdome.org` 和 `www.chatdome.org` 两条 DNS 记录：

```bash
sudo /usr/local/bin/certbot certonly --webroot \
  -w /var/www/chatdome.com/html \
  -d chatdome.org -d www.chatdome.org
```

如果你还没有 `www` 记录，先只申请主域名：

```bash
sudo /usr/local/bin/certbot certonly --webroot \
  -w /var/www/chatdome.com/html \
  -d chatdome.org
```

如果校验失败，常见原因是 DNS 记录缺失或 Cloudflare 代理影响验证；可临时切 `DNS only`（灰云）再签发。

### 5.3 把 Nginx 配置改为 HTTPS（同一个 `conf.d` 文件）

要编辑的文件：

```bash
sudo vim /etc/nginx/conf.d/chatdome.org.conf
```

```nginx
server {
    # 监听 IPv4 的 80 端口（HTTP）
    listen 80;
    # 监听 IPv6 的 80 端口（HTTP）
    listen [::]:80;

    # 当前 server 块匹配的域名
    server_name chatdome.org www.chatdome.org;

    # ACME 验证目录（用于证书签发/续期）
    location ^~ /.well-known/acme-challenge/ {
        root /var/www/chatdome.com/html;
    }

    # 其余 HTTP 请求全部跳转到 HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    # 监听 IPv4 的 443 端口（HTTPS）
    listen 443 ssl;
    # 监听 IPv6 的 443 端口（HTTPS）
    listen [::]:443 ssl;
    # 启用 HTTP/2（新版写法，避免 listen ... http2 弃用告警）
    http2 on;

    # 当前 server 块匹配的域名
    server_name chatdome.org www.chatdome.org;

    # 证书公钥链文件（certbot 生成）
    ssl_certificate /etc/letsencrypt/live/chatdome.org/fullchain.pem;
    # 证书私钥文件（certbot 生成）
    ssl_certificate_key /etc/letsencrypt/live/chatdome.org/privkey.pem;

    # 站点根目录（静态文件从这里读取）
    root /var/www/chatdome.com/html;
    # 目录请求时默认返回的首页文件
    index index.html;

    # 主路由规则：先找文件，再找目录，最后回退到 index.html（SPA）
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 禁止访问隐藏文件/目录（例如 .git、.env）
    # 但保留 .well-known 给证书校验使用
    location ~ /\.(?!well-known) {
        deny all;
    }
}
```

生效配置：

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 5.4 Cloudflare 必改项

源站证书生效后，把 Cloudflare `SSL/TLS` 模式改为：

- `Full (strict)`（推荐）

不要再使用 `Flexible`。同时确认服务器防火墙/安全组已放行 `80` 和 `443`。

### 5.5 HTTPS 自测

```bash
curl -I -H "Host: chatdome.org" http://127.0.0.1/
curl -I https://chatdome.org
```

### 5.6 证书自动续期（建议）

Let's Encrypt 证书有效期通常是 **90 天**。建议长期开启自动续期，不要等到到期当天再手动处理。

先做续期演练：

```bash
sudo /usr/local/bin/certbot renew --dry-run
```

如系统没有自动续期任务，可加 cron：

```bash
sudo crontab -e
```

```cron
15 3 * * * /usr/local/bin/certbot renew --quiet --post-hook "systemctl reload nginx"
```

### 5.7 证书到期时间查询

查看 Certbot 记录的证书到期信息：

```bash
sudo /usr/local/bin/certbot certificates
```

直接看当前站点证书的生效/到期时间：

```bash
sudo openssl x509 -in /etc/letsencrypt/live/chatdome.org/fullchain.pem -noout -dates
```

检查“是否将在 30 天内过期”（返回非 0 代表需要尽快续签）：

```bash
sudo openssl x509 -checkend 2592000 -noout \
  -in /etc/letsencrypt/live/chatdome.org/fullchain.pem
```
