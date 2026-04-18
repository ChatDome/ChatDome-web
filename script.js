/* =========================================================================
   ChatDome / Interactions & Micro-Animations
   ========================================================================= */

document.addEventListener('DOMContentLoaded', () => {

    // 1. Navbar Glass Effect on Scroll
    const nav = document.querySelector('.glass-nav');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            nav.style.background = 'rgba(7, 9, 15, 0.85)';
            nav.style.boxShadow = '0 4px 30px rgba(0, 0, 0, 0.5)';
        } else {
            nav.style.background = 'rgba(7, 9, 15, 0.5)';
            nav.style.boxShadow = 'none';
        }
    });

    // 2. Typewriter Effect for Terminal
    const terminalLines = [
        { type: 'user', text: '有没有人在爆破我的SSH？' },
        { type: 'bot', text: '正在扫描 /var/log/auth.log...' },
        { type: 'bot-alert', text: '⚠️ 发现异常：IP 185.xxx.xxx.xxx 在过去10分钟尝试登录 root 账户 342 次。' },
        { type: 'bot', text: '已为你自动屏蔽该 IP，并添加到 Sentinel 哨兵黑名单。需要发送全量巡检报告吗？' }
    ];

    const typeWriterContainer = document.getElementById('typewriter-container');
    let lineIndex = 0;

    async function typeLine(lineObj) {
        const lineEl = document.createElement('div');
        lineEl.className = `line-${lineObj.type}`;
        typeWriterContainer.appendChild(lineEl);

        const chars = lineObj.text.split('');
        for (let i = 0; i < chars.length; i++) {
            lineEl.textContent += chars[i];
            // 极客打字机的停顿感
            const delay = lineObj.type === 'user' ? (Math.random() * 50 + 20) : (Math.random() * 10 + 5);
            await new Promise(r => setTimeout(r, delay));
        }
        
        await new Promise(r => setTimeout(r, 600)); // 两行之间的思考时间
    }

    async function startTypeWriter() {
        await new Promise(r => setTimeout(r, 1000)); // 初始延迟
        for (const line of terminalLines) {
            await typeLine(line);
        }
        // 打字结束后光标闪烁
        const cursor = document.createElement('span');
        cursor.textContent = '█';
        cursor.style.animation = 'blink 1s step-end infinite';
        cursor.style.color = 'var(--cyber-blue)';
        typeWriterContainer.lastChild.appendChild(cursor);
    }
    
    // 全局样式中未定义 blink，这里动态注入
    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0; }
        }
    `;
    document.head.appendChild(style);

    startTypeWriter();

    // 3. Scroll Reveal Animation for Bento Cards
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const cards = document.querySelectorAll('.bento-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(40px)';
        card.style.transition = `all 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.1}s`;
        observer.observe(card);
    });

    // 4. Glow hover tracking (Optional slick effect)
    document.querySelectorAll('.bento-card').forEach(card => {
        card.addEventListener('mousemove', e => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        });
    });
});
