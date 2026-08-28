// app.js
const CONFIG = {
    // 填入打卡 API 終端點
    CLOCK_URL: 'https://tw-hcm.usiglobal.com/servlet/jform'
};

// 執行打卡函式
async function submitClockIn(token) {
    try {
        const response = await fetch(CONFIG.CLOCK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                // 依據系統需求帶入 Token 或 Session
                'Authorization': `Bearer ${token}`
            },
            body: new URLSearchParams({
                // 帶入打卡所需的參數 (例如：B3.8 打卡功能代碼)
                'file': 'hrm8w.pkg,hrm8w_usi.pkg',
                'func': 'clock_in'
            })
        });

        if (response.ok) {
            alert('打卡成功！');
        } else {
            alert(`打卡失敗，HTTP 狀態碼: ${response.status}`);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('連線失敗，請檢查 Token 或網路連線');
    }
}
