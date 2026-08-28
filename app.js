// 後端 API 組態設定
const CONFIG = {
    // HCM 系統基底網址
    BASE_URL: 'https://tw-hcm.usiglobal.com/servlet/jform',
    // 登入驗證 API
    LOGIN_PARAMS: '?file=hrm8w.pkg,hrm8w_usi.pkg&locale=TW&init_func=B3.8',
    // 直連打卡 API 端點（可依實際後端封包改寫）
    CLOCK_ENDPOINT: '/servlet/jform'
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

// 更新時鐘
function updateClock() {
    const now = new Date();
    document.getElementById('current-date').innerText = now.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' });
    document.getElementById('current-time').innerText = now.toTimeString().split(' ')[0];
}
setInterval(updateClock, 1000);
updateClock();

// 1. 直連登入 API
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    loginMsg.className = 'message info';
    loginMsg.innerText = '正在直連後台 API 進行驗證...';

    try {
        // 發送真實 HTTP POST 至 HCM 後台登入端點
        const response = await fetch(`${CONFIG.BASE_URL}${CONFIG.LOGIN_PARAMS}`, {
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

        // 儲存 session 資訊
        sessionData.username = username;
        sessionData.isLoggedIn = true;

        // 切換介面至直接打卡頁面
        userDisplay.innerText = username;
        loginSection.classList.add('hidden');
        clockSection.classList.remove('hidden');
        loginMsg.innerText = '';

    } catch (err) {
        console.error('Login Fetch Error:', err);
        // 注意：跨網域 (CORS) 存取可能在瀏覽器觸發 error，但請求仍可能送出
        loginMsg.className = 'message error';
        loginMsg.innerText = '連線失敗或存在 CORS 跨網域限制。請確認後端 API 允許跨網域存取。';
    }
});

// 2. 按鈕直接呼叫後台打卡 API (不跳轉/不透過原畫面UI)
async function triggerDirectClockAPI(type) {
    const typeText = type === 'IN' ? '上班' : '下班';
    clockMsg.className = 'message info';
    clockMsg.innerText = `正在直接呼叫後台 ${typeText} 打卡 API...`;

    // 依據原本封包結構構建參數
    const payload = new URLSearchParams({
        'func_id': 'B3.8',
        'action': 'CLOCK',
        'clock_type': type, // 'IN' 或 'OUT'
        'emp_id': sessionData.username,
        'clock_time': new Intl.DateTimeFormat('sv-SE', { dateStyle: 'short', timeStyle: 'medium' }).format(new Date())
    });

    try {
        // 直接發送 API 請求給後台伺服器
        const response = await fetch(`${CONFIG.BASE_URL}${CONFIG.CLOCK_ENDPOINT}`, {
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
        console.error('Clock API Error:', err.message);
        clockMsg.className = 'message error';
        clockMsg.innerText = `⚠️ 請求發送完畢（若有 CORS 限制屬正常現象）：${err.message}`;
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
