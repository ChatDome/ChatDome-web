document.addEventListener('DOMContentLoaded', () => {
    const terminalBody = document.getElementById('terminal-body');
    if (!terminalBody) return;

    const sequence = [
        { type: 'user', text: '帮我查一下现在有没有人在暴力破解 SSH？', delay: 1000 },
        { type: 'sys', text: '[Sentinel] Thinking...', delay: 800, replaceNext: true },
        { type: 'sys', text: '[Sentinel] 加载 YAML Command Pack [ssh-audit.yaml]...', delay: 1200 },
        { type: 'sys', text: '[Sentinel] 正在受限沙箱中执行命令...', delay: 500 },
        { type: 'cmd', text: '$ journalctl -u sshd --since "5m ago" | grep "Failed password"', delay: 1500 },
        { type: 'alert', text: '>> ALERT: IP 192.168.1.100 在过去 5 分钟内触发 32 次 Failed password 记录。', delay: 1000 },
        { type: 'sys', text: '[Sentinel] 风险评估: HIGH. 触发拦截规则.', delay: 800 },
        { type: 'bot', text: '检测到针对 sshd 的持续暴力破解行为。\n攻击源: 192.168.1.100\n失败次数: 32 / 5min\n\n建议封禁该 IP，是否执行？\n/ban 192.168.1.100', delay: 2000 },
        { type: 'user', text: '/ban 192.168.1.100', delay: 2500 },
        { type: 'sys', text: '[Sentinel] 收到审批指令，进入执行流程...', delay: 600 },
        { type: 'sys', text: '[Sentinel] 执行: 写入黑名单并阻断流量...', delay: 800 },
        { type: 'bot', text: '✅ 操作完成。\n\nIP 192.168.1.100 已写入黑名单，后续连接将被自动拒绝。\nSentinel 将持续监控该威胁源。', delay: 1500 }
    ];

    let currentLine = null;
    let seqIndex = 0;

    function createLine(type) {
        const div = document.createElement('div');
        div.className = 't-line';
        
        let prefix = '';
        if (type === 'user') {
            div.classList.add('t-user');
            prefix = 'user@telegram:~$ ';
        } else if (type === 'sys' || type === 'cmd') {
            div.classList.add('t-sys');
        } else if (type === 'alert') {
            div.classList.add('t-alert');
        } else if (type === 'bot') {
            div.classList.add('t-bot');
        }

        div.innerHTML = `<span class="prefix">${prefix}</span><span class="content"></span><span class="t-cursor"></span>`;
        terminalBody.appendChild(div);
        terminalBody.scrollTop = terminalBody.scrollHeight;
        return div;
    }

    function typeText(element, text, speed, callback) {
        let i = 0;
        const contentSpan = element.querySelector('.content');
        
        // Handle pre-formatted text with newlines
        if (text.includes('\n')) {
            text = text.replace(/\n/g, '<br>');
        }

        function type() {
            if (i < text.length) {
                // Quick hack for <br>
                if (text.substr(i, 4) === '<br>') {
                    contentSpan.innerHTML += '<br>';
                    i += 4;
                } else {
                    contentSpan.innerHTML += text.charAt(i);
                    i++;
                }
                setTimeout(type, speed + (Math.random() * 30));
            } else {
                if (callback) callback();
            }
        }
        type();
    }

    function processSequence() {
        if (seqIndex >= sequence.length) {
            // Loop animation after a pause
            setTimeout(() => {
                terminalBody.innerHTML = '';
                seqIndex = 0;
                processSequence();
            }, 8000);
            return;
        }

        const step = sequence[seqIndex];
        
        setTimeout(() => {
            if (currentLine && currentLine.querySelector('.t-cursor')) {
                currentLine.querySelector('.t-cursor').remove();
            }

            // If previous step was marked replaceNext, remove it
            if (seqIndex > 0 && sequence[seqIndex - 1].replaceNext) {
                currentLine.remove();
            }

            currentLine = createLine(step.type);
            const speed = step.type === 'sys' || step.type === 'alert' ? 10 : 30; // sys messages appear faster

            typeText(currentLine, step.text, speed, () => {
                seqIndex++;
                processSequence();
            });

        }, step.delay);
    }

    // Start animation
    processSequence();
});
