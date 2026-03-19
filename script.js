

document.addEventListener("DOMContentLoaded", () => {

const STORAGE_KEY="myhome_data";
const BACKUP_KEY="myhome_backups";

let linkData=JSON.parse(localStorage.getItem(STORAGE_KEY))||{};

const categoriesDiv=document.getElementById("categories");
const categorySelect=document.getElementById("categorySelect");


/* 保存 */

function save(){

localStorage.setItem(STORAGE_KEY,JSON.stringify(linkData));

let backups=JSON.parse(localStorage.getItem(BACKUP_KEY))||[];

backups.unshift({
time:new Date().toLocaleString(),
data:JSON.parse(JSON.stringify(linkData))
});

if(backups.length>5)backups.pop();

localStorage.setItem(BACKUP_KEY,JSON.stringify(backups));

}


/* 描画 */

function render(){

categoriesDiv.innerHTML="";
categorySelect.innerHTML="";

for(let category in linkData){

const catDiv=document.createElement("div");
catDiv.className="category";

const title=document.createElement("h2");
title.textContent=category;

const linksDiv=document.createElement("div");
linksDiv.className="links";

title.onclick=()=>{
linksDiv.style.display=
linksDiv.style.display==="none"?"flex":"none";
};

linkData[category].forEach((link,index)=>{

const item=document.createElement("div");
item.className="link-item";

const a=document.createElement("a");
a.href=link.url;
a.target="_blank";

const iconBox=document.createElement("div");
iconBox.className="link-icon";

const icon=document.createElement("img");
icon.src="https://www.google.com/s2/favicons?sz=64&domain="+link.url;

iconBox.appendChild(icon);
a.appendChild(iconBox);

const name=document.createElement("div");
name.className="link-name";
name.textContent=link.name;

const del=document.createElement("button");
del.textContent="削除";
del.className="delete-btn";

del.onclick=()=>{
linkData[category].splice(index,1);
save();
render();
};

item.appendChild(a);
item.appendChild(name);
item.appendChild(del);

linksDiv.appendChild(item);

});

catDiv.appendChild(title);
catDiv.appendChild(linksDiv);
categoriesDiv.appendChild(catDiv);

const option=document.createElement("option");
option.value=category;
option.textContent=category;

categorySelect.appendChild(option);

}

}


/* カテゴリー追加 */

window.addCategory=function(){

const name=prompt("カテゴリー名");

if(!name)return;

if(!linkData[name]){

linkData[name]=[];

save();
render();

}

}


/* リンク追加 */

window.addLink=function(){

const name=document.getElementById("linkName").value;

let url=document.getElementById("linkURL").value;

const cat=categorySelect.value;

if(!name||!url||!cat)return;

if(!url.startsWith("http")){
url="https://"+url;
}

linkData[cat].push({name,url});

save();
render();

document.getElementById("linkName").value="";
document.getElementById("linkURL").value="";

}


/* Enter追加 */

document.getElementById("linkURL").addEventListener("keypress",function(e){
if(e.key==="Enter"){
addLink();
}
});


/* エディタ */

window.toggleEditor=function(){

const panel=document.getElementById("editorPanel");

panel.style.display=
panel.style.display==="none"?"block":"none";

}


/* バックアップ */

window.showBackups=function(){

const backups=JSON.parse(localStorage.getItem(BACKUP_KEY))||[];

if(backups.length===0){
alert("バックアップなし");
return;
}

let text="復元する番号\n\n";

backups.forEach((b,i)=>{
text+=`${i+1} : ${b.time}\n`;
});

const num=prompt(text);

if(!num)return;

const backup=backups[num-1];

if(!backup)return;

linkData=backup.data;

localStorage.setItem(STORAGE_KEY,JSON.stringify(linkData));

render();

}


/* 時計 */

function updateClock(){

const now=new Date();

const h=String(now.getHours()).padStart(2,"0");
const m=String(now.getMinutes()).padStart(2,"0");
const s=String(now.getSeconds()).padStart(2,"0");

document.getElementById("clock").textContent=`${h}:${m}:${s}`;

const options={year:"numeric",month:"long",day:"numeric",weekday:"long"};

document.getElementById("date").textContent=
now.toLocaleDateString("ja-JP",options);

}

setInterval(updateClock,1000);
updateClock();


/* 天気 */

async function updateWeather(){

try{

const lat=33.59;
const lon=130.40;

const url=`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;

const res=await fetch(url);
const weatherData=await res.json();

const temp=weatherData.current_weather.temperature;
const code=weatherData.current_weather.weathercode;

const weatherMap={
0:"快晴 ☀️",
1:"晴れ 🌤",
2:"やや曇り ⛅",
3:"曇り ☁️",
45:"霧 🌫",
48:"霧 🌫",
51:"小雨 🌦",
61:"雨 🌧",
63:"強い雨 🌧",
71:"雪 ❄️"
};

const weather=weatherMap[code]||"天気";

document.getElementById("weather").textContent=
`福岡 ${weather} ${temp}°C`;

}catch(e){

document.getElementById("weather").textContent="天気取得失敗";

}

}

updateWeather();
setInterval(updateWeather,600000);


/* 壁紙 */

window.toggleWallpaper=function(){

const panel=document.getElementById("wallpaperPanel");

panel.style.display=
panel.style.display==="none"?"block":"none";

}

const colorPicker=document.getElementById("colorPicker");

if(colorPicker){

colorPicker.oninput=function(){

document.body.style.background=colorPicker.value;

localStorage.setItem("wallpaperColor",colorPicker.value);

};

}

const imageUpload=document.getElementById("imageUpload");

if(imageUpload){

imageUpload.onchange=function(e){

const file=e.target.files[0];
const reader=new FileReader();

reader.onload=function(event){

const img=event.target.result;

document.body.style.background=`url(${img}) center/cover no-repeat fixed`;

localStorage.setItem("wallpaperImage",img);

};

reader.readAsDataURL(file);

};

}

const savedColor=localStorage.getItem("wallpaperColor");
const savedImage=localStorage.getItem("wallpaperImage");

if(savedImage){

document.body.style.background=`url(${savedImage}) center/cover no-repeat fixed`;

}else if(savedColor){

document.body.style.background=savedColor;

}


/* ニュース */

let newsList = [];
let index = 0;

const news1 = document.getElementById("news1");
const news2 = document.getElementById("news2");

fetch("https://api.rss2json.com/v1/api.json?rss_url=https://news.yahoo.co.jp/rss/topics/top-picks.xml")
  .then(res => res.json())
  .then(data => {
    newsList = data.items;
    showNews();
    setInterval(nextNews, 5000);
  })
  .catch(err => {
    console.error(err);
    news1.textContent = "ニュース取得失敗";
  });

function showNews() {
  if (newsList.length === 0) return;

  const item1 = newsList[index % newsList.length];
  const item2 = newsList[(index + 1) % newsList.length];

  news1.innerHTML = `<a href="${item1.link}" target="_blank">${item1.title}</a>`;
  news2.innerHTML = `<a href="${item2.link}" target="_blank">${item2.title}</a>`;
}

function nextNews() {
  index += 2;
  showNews();
}
function nextNews() {
  news1.style.opacity = 0;
  news2.style.opacity = 0;

  setTimeout(() => {
    index += 2;
    showNews();
    news1.style.opacity = 1;
    news2.style.opacity = 1;
  }, 400);
}

/* 初期描画 */

render();

/*カーソル表示*/
  
const searchInput=document.getElementById("searchInput");

if(searchInput){
searchInput.value="";
searchInput.focus();
}
  
});
