export default {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      const data = await request.json();
      const targetUrl = 'https://tw-hcm.usiglobal.com/servlet/jform?file=hrm8w.pkg,hrm8w_usi.pkg&locale=TW&init_func=B3.8';

      // 1. 發送帳密至 HCM 進行認證並取得 Session Cookie
      const loginParams = new URLSearchParams({
        'func': 'login',
        'emp_id': data.emp_id,
        'password': data.pass
      });

      const loginResp = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: loginParams
      });

      const cookies = loginResp.headers.get('set-cookie') || '';

      // 2. 帶入 Cookie 發送打卡 API (B3.8)
      const clockParams = new URLSearchParams({
        'func': 'clock_in',
        'init_func': 'B3.8'
      });

      const clockResp = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cookie': cookies
        },
        body: clockParams
      });

      return new Response(JSON.stringify({
        success: true,
        message: '打卡成功！'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (e) {
      return new Response(JSON.stringify({
        success: false,
        message: e.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};
