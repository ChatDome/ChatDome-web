document.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('.site-header');
    const chatFeed = document.getElementById('chat-feed');

    const updateHeader = () => {
        header?.classList.toggle('is-scrolled', window.scrollY > 18);
    };

    updateHeader();
    window.addEventListener('scroll', updateHeader, { passive: true });

    const chatMessages = [
        { from: 'me', text: '今晚帮我盯一下这台服务器。' },
        { from: 'bot', text: '收到。哨兵已接管登录、进程和磁盘巡检。' },
        { from: 'alert', text: 'SSH 爆破\n185.xxx 连续尝试 root 登录，10 分钟 342 次。' },
        { from: 'bot', text: '已合并重复告警。建议临时封禁 30 分钟，并保留审计记录。', actions: ['确认封禁', '查看证据'] }
    ];

    const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    async function addMessage(message) {
        if (!chatFeed) {
            return;
        }

        const bubble = document.createElement('div');
        bubble.className = `chat-bubble ${message.from}`;
        chatFeed.appendChild(bubble);

        if (message.from === 'me') {
            bubble.textContent = message.text;
        } else {
            for (const char of message.text) {
                bubble.textContent += char;
                await wait(message.from === 'alert' ? 8 : 13);
            }
        }

        if (message.actions) {
            const actions = document.createElement('div');
            actions.className = 'chat-actions';
            message.actions.forEach(label => {
                const button = document.createElement('button');
                button.type = 'button';
                button.textContent = label;
                actions.appendChild(button);
            });
            bubble.appendChild(actions);
        }

        chatFeed.scrollTop = chatFeed.scrollHeight;
        await wait(message.from === 'me' ? 320 : 420);
    }

    async function startChatPreview() {
        await wait(520);
        for (const message of chatMessages) {
            await addMessage(message);
        }
    }

    startChatPreview();

    const revealItems = document.querySelectorAll('.reveal');

    if (!('IntersectionObserver' in window)) {
        revealItems.forEach(item => item.classList.add('is-visible'));
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.16,
        rootMargin: '0px 0px -48px 0px'
    });

    revealItems.forEach(item => observer.observe(item));
});
