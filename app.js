// 後端 API 組態設定
// 使用 corsproxy.io 代理轉接，解決跨網域 (CORS) 限制
const PROXY = 'https://corsproxy.io/?';
const HCM_BASE = 'https://tw-hcm.usiglobal.com/servlet/jform';

const CONFIG = {
    // 登入驗證 API
    LOGIN_URL: `${PROXY}${encodeURIComponent(HCM_BASE + '?file=hrm8w.pkg,hrm8w_usi.pkg&locale=TW&init_func=B3.8')}`,
    // 打卡 API
    CLOCK_URL: `${PROXY}${encodeURIComponent(HCM_BASE)}`
};

// 全域狀態儲存
let sessionData = {
    username: '',
    token: '',
    isLoggedIn: false
};

// DOM 元素選取
const loginSection = document.getElementById('login-section');
const clockSection = document.getElementById('clock-section');
const loginForm = document.getElementById('login-form');
const loginMsg = document.getElementById('login-msg');
const clockMsg = document.getElementById('clock-msg');
const userDisplay = document.getElementById('user-display');

// 即時時鐘更新
function updateClock() {
    const now = new Date();
    document.getElementById('current-date').innerText = now.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' });
    document.getElementById('current-time').innerText = now.toTimeString().split(' ')[0];
}
setInterval(updateClock, 1000);
updateClock();

// 1. 直連登入 API (經 Proxy 轉發)
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    loginMsg.className = 'message info';
    loginMsg.innerText = '正在透過 Proxy 連線後台 API 進行驗證...';

    try {
        const response = await fetch(CONFIG.LOGIN_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                'USER': username,
                'PASSWORD': password,
                'ACTION': 'LOGIN'
            })
        });

        if (response.ok) {
            sessionData.username = username;
            sessionData.isLoggedIn = true;

            userDisplay.innerText = username;
            loginSection.classList.add('hidden');
            clockSection.classList.remove('hidden');
            loginMsg.innerText = '';
        } else {
            loginMsg.className = 'message error';
            loginMsg.innerText = `登入請求失敗 (HTTP ${response.status})`;
        }
    } catch (err) {
        console.error('Login Fetch Error:', err);
        loginMsg.className = 'message error';
        loginMsg.innerText = `連線錯誤：${err.message}`;
    }
});

// 2. 直連打卡 API (經 Proxy 轉發)
async function triggerDirectClockAPI(type) {
    const typeText = type === 'IN' ? '上班' : '下班';
    clockMsg.className = 'message info';
    clockMsg.innerText = `正在呼叫後台 ${typeText} 打卡 API...`;

    const payload = new URLSearchParams({
        'func_id': 'B3.8',
        'action': 'CLOCK',
        'clock_type': type, // 'IN' 或 'OUT'
        'emp_id': sessionData.username,
        'clock_time': new Intl.DateTimeFormat('sv-SE', { dateStyle: 'short', timeStyle: 'medium' }).format(new Date())
    });

    try {
        const response = await fetch(CONFIG.CLOCK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: payload
        });

        if (response.ok) {
            const nowTime = new Date().toLocaleTimeString();
            clockMsg.className = 'message success';
            clockMsg.innerText = `✅ 後台 API 回應成功！${typeText}打卡時間：${nowTime}`;
        } else {
            clockMsg.className = 'message error';
            clockMsg.innerText = `❌ 後台 API 回應異常 (HTTP ${response.status})`;
        }
    } catch (err) {
        console.error('Clock API Error:', err);
        clockMsg.className = 'message error';
        clockMsg.innerText = `⚠️ 請求失敗：${err.message}`;
    }
}

// 事件繫結
document.getElementById('clock-in-btn').addEventListener('click', () => triggerDirectClockAPI('IN'));
document.getElementById('clock-out-btn').addEventListener('click', () => triggerDirectClockAPI('OUT'));

// 登出
document.getElementById('logout-btn').addEventListener('click', () => {
    sessionData = { username: '', token: '', isLoggedIn: false };
    clockSection.classList.add('hidden');
    loginSection.classList.remove('hidden');
    loginForm.reset();
});
