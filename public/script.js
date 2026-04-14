// Helper function to get URL parameters
function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    const results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

// 1. Loader Functionality
setTimeout(()=>{
  document.getElementById("loader").style.display="none";
  document.getElementById("main").style.display="block";
},1500);

// 2. FAQ toggle
function toggleFAQ(el){
  let ans=el.nextElementSibling;
  ans.style.display = ans.style.display==="block"?"none":"block";
}

// 3. Counters
document.querySelectorAll('.counter').forEach(counter=>{
  let target = +counter.innerText;
  if (isNaN(target)) return; // Skip non-numeric counters like '50/50'
  let count=0;
  let speed=target/80;
  function update(){count+=speed;if(count<target){counter.innerText=Math.ceil(count);requestAnimationFrame(update);}else{counter.innerText=target;}}
  update();
});

// 4. Referral System Logic
const referralLinkInput = document.getElementById('referralLink');
const inviterId = getUrlParameter('ref');

// Simple way to generate a unique ID for the user (e.g., a timestamp)
// In a real app, this would be provided by the server after successful registration
const myReferralId = localStorage.getItem('myReferralId') || Date.now().toString(36);
localStorage.setItem('myReferralId', myReferralId);

if (referralLinkInput) {
    referralLinkInput.value = window.location.origin + '?ref=' + myReferralId;
}

window.copyReferralLink = function() {
    referralLinkInput.select();
    document.execCommand('copy');
    alert('تم نسخ رابط الدعوة بنجاح!');
};

// 5. Form Submission Handling
const form = document.getElementById('regForm');
const status = document.getElementById('status');
const dataBox = document.getElementById('dataBox');

function loadData(){
  // This function is now responsible for displaying the user's invited friends
  const invitedFriends = JSON.parse(localStorage.getItem('invitedFriends')||"[]");
  if(invitedFriends.length===0){
    dataBox.innerHTML="لا توجد بيانات محفوظة عن الأصدقاء المدعوين.";
    return;
  }
  
  let html=`
    <p>الأصدقاء الذين سجلوا عبر رابطك: <strong>${invitedFriends.length}</strong></p>
    <table>
      <tr>
        <th>الاسم</th>
        <th>الدولة</th>
        <th>المستند</th>
        <th>الحالة (افتراضية)</th>
      </tr>
  `;
  invitedFriends.forEach(u=>{
    html+=`<tr>
      <td>${u.name}</td>
      <td>${u.country}</td>
      <td>${u.document || '-'}</td>
      <td>تم التسجيل</td>
    </tr>`;
  });
  html+="</table>";
  dataBox.innerHTML=html;
}
loadData();

form.addEventListener('submit', async e=>{
  e.preventDefault();
  status.textContent = 'جارٍ الإرسال...';
  status.className = 'msg'; // Clear previous status class
  
  const name = document.getElementById('name').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const country = document.getElementById('country').value.trim();
  const documentType = document.getElementById('document').value;

  const payload={
    name: name,
    phone: phone,
    country: country,
    document: documentType,
    inviterId: inviterId // Send the inviter's ID if present
  };

  // Simple validation (only name and country are required as per new content)
  if (!name || !country) {
      status.className = 'msg error';
      status.textContent = 'الاسم والدولة مطلوبان.';
      return;
  }

  // Simulate saving the invited friend to the inviter's local storage
  if (inviterId) {
      const inviterFriends = JSON.parse(localStorage.getItem('invitedFriends')||"[]");
      inviterFriends.push(payload);
      localStorage.setItem('invitedFriends', JSON.stringify(inviterFriends));
      loadData(); // Update the dashboard for the inviter (if they are viewing it)
  }

  // إرسال إلى الخادم
  try{
    const res = await fetch('/api/register',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(payload)
    });
    const json = await res.json();
    if(res.ok){
        status.className = 'msg success';
        status.textContent=json.message || 'تم الإرسال بنجاح.';
        form.reset();
    }
    else{
        status.className = 'msg error';
        status.textContent=json.error || 'حدث خطأ أثناء الإرسال.';
    }
  }catch(err){
    status.className = 'msg error';
    status.textContent='خطأ في الاتصال بالخادم.';
    console.error(err);
  }
});
