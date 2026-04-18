# ChatDome Web 🛡️

这是 [ChatDome](https://github.com/ChatDome/ChatDome) 的官方介绍网页，采用了极简、零依赖的 **原生 HTML5 + CSS3 + Vanilla JS** 架构开发。具有纯粹的静态特性，能够以极高的性能运行，并且完美契合了“极客”、“暗黑”与“赛博安全”的视觉美学。

## 🚀 最佳部署实践 (面向未来的多子域名架构)

考虑到未来可能需要为 API 端点、控制台界面等分配独立的子域名，强烈建议在服务端采用 **Nginx** 作为统一的流量入口。以下是规范的部署方案：

### 1. 建立规范的目录体系
不要将代码混入默认的 `/var/www/html` 目录。建议按照域名名称来划分文件夹，为未来的子域名扩容打好基础：

```bash
# 1. 创建 ChatDome 官网的存放目录 (以 chatdome.com 为例)
sudo mkdir -p /var/www/chatdome.com/html

# 2. 赋予当前服务器用户操作权限
sudo chown -R $USER:$USER /var/www/chatdome.com/html

# 3. 将本仓库代码克隆或拉取到该目录下
git clone https://github.com/ChatDome/ChatDome-web.git /var/www/chatdome.com/html
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
}
```

### 3. 上线与测试
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
