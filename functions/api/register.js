function clean(value, maxLength) {
  return String(value ?? '').trim().slice(0, maxLength);
}

function escapeHtml(value) {
  return String(value ?? '-').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[character]));
}

function json(data, status = 200, origin = '') {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=UTF-8',
      ...(origin ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' } : {})
    }
  });
}

export async function onRequestOptions({ request }) {
  const origin = request.headers.get('Origin') || '';
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      Vary: 'Origin'
    }
  });
}

export async function onRequestPost({ request, env }) {
  const origin = request.headers.get('Origin') || '';
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'بيانات الطلب غير صالحة.' }, 400, origin);
  }

  const name = clean(body.name, 120);
  const phone = clean(body.phone, 40);
  const country = clean(body.country, 80);
  const documentType = clean(body.docType || body.document, 80);
  const inviterId = clean(body.inviterId, 80);

  if (name.length < 2 || phone.length < 5 || !country || !documentType) {
    return json({ error: 'يرجى إكمال بيانات التسجيل المطلوبة.' }, 400, origin);
  }

  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
    return json({ error: 'خدمة التسجيل غير مهيأة حاليًا، حاول لاحقًا.' }, 503, origin);
  }

  const text = [
    '<b>طلب تسجيل جديد</b>',
    '',
    `الاسم: ${escapeHtml(name)}`,
    `الهاتف: ${escapeHtml(phone)}`,
    `الدولة: ${escapeHtml(country)}`,
    `نوع الوثيقة المختار: ${escapeHtml(documentType)}`,
    `كود الإحالة: <code>${escapeHtml(inviterId || 'Direct')}</code>`,
    `الوقت: ${escapeHtml(new Date().toLocaleString('ar-EG'))}`
  ].join('\n');

  try {
    const telegramResponse = await fetch(`https://api.telegram.org/bot${encodeURIComponent(env.TELEGRAM_BOT_TOKEN)}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: env.TELEGRAM_CHAT_ID,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      })
    });

    if (!telegramResponse.ok) {
      console.error('Telegram API returned an error', telegramResponse.status);
      return json({ error: 'تعذر إرسال التسجيل حاليًا، حاول مرة أخرى.' }, 502, origin);
    }

    return json({ message: 'تم استقبال بيانات التسجيل بنجاح.' }, 200, origin);
  } catch (error) {
    console.error('Telegram request failed', error);
    return json({ error: 'تعذر إرسال التسجيل حاليًا، حاول مرة أخرى.' }, 502, origin);
  }
}
