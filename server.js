require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// توجيه السيرفر لقراءة ملفات الواجهة من مجلد public
app.use(express.static('public'));

app.post('/api/register', async (req, res) => {
  try {
    const { name, phone, country, document, inviterId } = req.body;
    if (!name || !country || !document) return res.status(400).json({ error: 'الاسم والدولة ونوع المستند مطلوبان.' });

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

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

// ⚠️ تشغيل السيرفر ليتوافق مع Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
