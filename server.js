require('dotenv').config();

const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const PUBLIC_ORIGIN = 'https://mashaalmohammedseed-rgb.github.io';
const ALLOWED_ORIGINS = new Set([
  'https://mashaalmohammedseed-rgb.github.io',
  'https://promosystem-ofn1.onrender.com',
  ...(process.env.ALLOWED_ORIGIN ? process.env.ALLOWED_ORIGIN.split(',').map((origin) => origin.trim()) : [])
]);

app.use(express.json({ limit: '20kb' }));

app.use((req, res, next) => {
  const origin = req.get('origin');
  if (origin && (ALLOWED_ORIGINS.has(origin) || origin === PUBLIC_ORIGIN)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(express.static(path.join(__dirname, 'public'), {
  extensions: ['html']
}));

app.get('/healthz', (_req, res) => {
  res.json({ ok: true });
});

function escapeHtml(value) {
  return String(value ?? '-').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[character]));
}

function clean(value, maxLength) {
  return String(value ?? '').trim().slice(0, maxLength);
}

app.post('/api/register', async (req, res) => {
  const name = clean(req.body.name, 120);
  const phone = clean(req.body.phone, 40);
  const country = clean(req.body.country, 80);
  const documentType = clean(req.body.docType || req.body.document, 80);
  const inviterId = clean(req.body.inviterId, 80);

  if (name.length < 2 || phone.length < 5 || !country || !documentType) {
    return res.status(400).json({ error: 'يرجى إكمال بيانات التسجيل المطلوبة.' });
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!botToken || !chatId) {
    console.error('Telegram environment variables are not configured.');
    return res.status(503).json({ error: 'خدمة التسجيل غير مهيأة حاليًا، حاول لاحقًا.' });
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
    await axios.post(`https://api.telegram.org/bot${encodeURIComponent(botToken)}/sendMessage`, {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true
    }, { timeout: 10000 });

    return res.json({ message: 'تم استقبال بيانات التسجيل بنجاح.' });
  } catch (error) {
    console.error('Telegram API error:', error.response?.data || error.message);
    return res.status(502).json({ error: 'تعذر إرسال التسجيل حاليًا، حاول مرة أخرى.' });
  }
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
