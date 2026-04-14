require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path'); // ضروري لتحديد مسارات الملفات
const app = express();

app.use(express.json());

// 1. إخبار السيرفر بمكان ملفات الواجهة (مجلد public)
app.use(express.static(path.join(__dirname, 'public')));

// 2. نقطة استقبال بيانات التسجيل
app.post('/api/register', async (req, res) => {
  try {
    const { name, phone, country, document, inviterId } = req.body;

    // التحقق من وجود المتغيرات السرية في Render
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
        console.error("Missing Env Variables!");
        return res.status(500).json({ error: 'إعدادات البوت غير مكتملة على السيرفر.' });
    }

    // تجهيز نص الرسالة
    let text = `📥 <b>طلب تسجيل جديد</b>\n\n`;
    text += `👤 الاسم: ${name}\n`;
    text += `📞 الهاتف: ${phone || '-'}\n`;
    text += `🌍 الدولة: ${country}\n`;
    text += `📄 المستند: ${document || '-'}\n`;
    text += `⏰ الوقت: ${new Date().toLocaleString('ar-EG')}\n`;
    
    if (inviterId) {
        text += `\n🔗 تمت الدعوة بواسطة: <code>${inviterId}</code>\n`;
        text += `💰 نظام الأرباح: 30% مسجل | 30% داعي | 40% إدارة`;
    } else {
        text += `\n💰 نظام الأرباح: 50% مسجل | 50% إدارة`;
    }

    // إرسال الرسالة إلى تليجرام
    await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML'
    });

    return res.json({ message: 'تم استقبال بياناتك بنجاح!' });

  } catch (err) {
    console.error("Telegram API Error:", err.response ? err.response.data : err.message);
    res.status(500).json({ error: 'حدث خطأ في الاتصال بتليجرام.' });
  }
});

// 3. هذا الجزء يحل مشكلة "Cannot GET /" 
// يخبر السيرفر بفتح index.html دائماً عند طلب الرابط الرئيسي
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 4. تشغيل السيرفر على المنفذ المطلوب لـ Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
