// Loader
setTimeout(()=>{
  document.getElementById("loader").style.display="none";
  document.getElementById("main").style.display="block";
},1500);

// FAQ toggle
function toggleFAQ(el){
  let ans=el.nextElementSibling;
  ans.style.display = ans.style.display==="block"?"none":"block";
}

// Counters
document.querySelectorAll('.counter').forEach(counter=>{
  let target = +counter.innerText;
  let count=0;
  let speed=target/80;
  function update(){count+=speed;if(count<target){counter.innerText=Math.ceil(count);requestAnimationFrame(update);}else{counter.innerText=target;}}
  update();
});

// Form submission
const form = document.getElementById('regForm');
const status = document.getElementById('status');
const dataBox = document.getElementById('dataBox');

function loadData(){
  const data=JSON.parse(localStorage.getItem('users')||"[]");
  if(data.length===0){dataBox.innerHTML="لا توجد بيانات محفوظة";return;}
  let html="<table><tr><th>الاسم</th><th>الهاتف</th><th>الدولة</th><th>المستند</th></tr>";
  data.forEach(u=>{
    html+=`<tr><td>${u.name}</td><td>${u.phone}</td><td>${u.country}</td><td>${u.document}</td></tr>`;
  });
  html+="</table>";
  dataBox.innerHTML=html;
}
loadData();

form.addEventListener('submit', async e=>{
  e.preventDefault();
  status.textContent = 'جارٍ الإرسال...';
  status.className = 'msg'; // Clear previous status class
  const payload={
    name:document.getElementById('name').value.trim(),
    phone:document.getElementById('phone').value.trim(),
    country:document.getElementById('country').value.trim(),
    document:document.getElementById('document').value
  };

  // حفظ مؤقت
  const arr = JSON.parse(localStorage.getItem('users')||"[]");
  arr.push(payload);
  localStorage.setItem('users',JSON.stringify(arr));
  loadData();

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
