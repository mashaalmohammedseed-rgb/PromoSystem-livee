require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static('public'));

app.post('/api/register', async (req, res) => {
  try {
    const { name, phone, country, document, inviterId } = req.body;
    if (!name || !country) return res.status(400).json({ error: 'الاسم والدولة مطلوبان.' });

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    
    let text = `📥 طلب تسجيل جديد\nالاسم: ${name}\nالهاتف: ${phone || '-'}\nالدولة: ${country}\nالمستند: ${document || '-'}\nوقت الإرسال: ${new Date().toLocaleString()}`;

    if (inviterId) {
      text += `\n\n🔗 تمت الدعوة بواسطة: ${inviterId}`;
      text += `\n💰 نظام الأرباح: 30% للمسجل، 30% للداعي، 40% لنا.`;
    } else {
      text += `\n💰 نظام الأرباح: 50% للمسجل، 50% لنا.`;
    }

    if (botToken && chatId) {
      await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML'
      });
    }

    return res.json({ message: 'تم استقبال بياناتك وسيتم التواصل معك قريباً.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'حدث خطأ داخلي. حاول لاحقاً.' });
  }
});

app.listen(port, () => console.log(`Server running on port ${port}`));
