# ChatDome Web

ChatDome 官方静态介绍页（HTML/CSS/JS）。

---

## 1. 发布目录

```bash
sudo mkdir -p /var/www/chatdome.com/html
sudo chown -R $USER:$USER /var/www/chatdome.com/html
```

---

## 2. 先判断 Nginx 用哪种配置目录

先看 `nginx.conf` 实际 include 了什么：

```bash
grep -n "include" /etc/nginx/nginx.conf
```

然后按结果二选一：

### A) 如果看到 `include /etc/nginx/conf.d/*.conf;`

使用 `conf.d` 路线：

```bash
sudo vim /etc/nginx/conf.d/chatdome.org.conf
```

```nginx
server {
    # 监听 IPv4 的 80 端口（HTTP）
    listen 80 default_server;
    # 监听 IPv6 的 80 端口（HTTP）
    listen [::]:80 default_server;

    # 当前 server 块匹配的域名
    server_name chatdome.org www.chatdome.org;

    # 站点根目录（静态文件从这里读取）
    root /var/www/chatdome.com/html;
    # 目录请求时默认返回的首页文件
    index index.html;

    # 主路由规则：先找文件，再找目录，最后回退到 index.html
    # 适合 SPA（前端路由）
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

### B) 如果看到 `include /etc/nginx/sites-enabled/*;`

使用 `sites-available/sites-enabled` 路线：

```bash
sudo mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled
sudo vim /etc/nginx/sites-available/chatdome.org
```

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

    # 主路由规则：先找文件，再找目录，最后回退到 index.html
    # 适合 SPA（前端路由）
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

启用配置：

```bash
sudo ln -sf /etc/nginx/sites-available/chatdome.org /etc/nginx/sites-enabled/chatdome.org
```

---

## 3. 安装自动更新脚本

```bash
sudo mkdir -p /opt/chatdome-web
sudo wget -O /opt/chatdome-web/deploy-chatdome-web.sh \
  https://raw.githubusercontent.com/ChatDome/ChatDome-web/main/deploy/deploy-chatdome-web.sh
sudo chmod +x /opt/chatdome-web/deploy-chatdome-web.sh
```

部署：

```bash
SITE_ROOT=/var/www/chatdome.com/html \
  /opt/chatdome-web/deploy-chatdome-web.sh
```

---

## 4. 生效与测试

```bash
sudo nginx -t
sudo systemctl reload nginx
```

最关键的自测命令：

```bash
curl -I -H "Host: chatdome.org" http://127.0.0.1/
curl -H "Host: chatdome.org" http://127.0.0.1/ | head
```

公网排查：

```bash
curl -I -H "Host: chatdome.org" http://YOUR_SERVER_PUBLIC_IP/
curl -I https://chatdome.org
```
