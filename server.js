require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const app = express();

// ⚠️ تعديل 1: Vercel لا يحتاج لتعريف البورت يدوياً أو استخدام app.listen
// app.use(bodyParser.json()); // استبدلها بـ express.json() أسرع وأحدث
app.use(express.json());
app.use(express.static('public'));

app.post('/api/register', async (req, res) => {
  try {
    const { name, phone, country, document, inviterId } = req.body;
    if (!name || !country || !document) return res.status(400).json({ error: 'الاسم والدولة ونوع المستند مطلوبان.' });

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    // تأكد من وجود القيم قبل إرسال الطلب لتجنب كراش السيرفر
    if (!botToken || !chatId) {
        console.error("Missing Environment Variables!");
        return res.status(500).json({ error: 'إعدادات البوت غير مكتملة على السيرفر.' });
    }

    let text = `📥 <b>طلب تسجيل جديد</b>\n\n👤 الاسم: ${name}\n📞 الهاتف: ${phone || '-'}\n🌍 الدولة: ${country}\n📄 المستند: ${document || '-'}\n⏰ الوقت: ${new Date().toLocaleString('ar-EG')}`;
    
    if (inviterId) {
        text += `\n\n🔗 تمت الدعوة بواسطة: <code>${inviterId}</code>`;
        text += `\n💰 نظام الأرباح: 30% مسجل | 30% داعي | 40% إدارة`;
    } else {
        text += `\n\n💰 نظام الأرباح: 50% مسجل | 50% إدارة`;
    }

    await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML'
    });

    return res.json({ message: 'تم استقبال بياناتك وسيتم التواصل معك قريباً.' });
  } catch (err) {
    console.error("Telegram API Error:", err.response ? err.response.data : err.message);
    res.status(500).json({ error: 'حدث خطأ في الاتصال بتليجرام.' });
  }
});

// ⚠️ تعديل 2: تصدير التطبيق بدلاً من app.listen
// هذا هو السر لعمل Node.js على Vercel كـ Serverless Function
module.exports = app; 
