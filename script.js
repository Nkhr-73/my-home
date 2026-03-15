/**
 * MY-home ダッシュボード スクリプト
 */

document.addEventListener("DOMContentLoaded", () => {
    // --- 設定・定数 ---
    const STORAGE_KEY = "myhome_data";
    const BACKUP_KEY = "myhome_backups";
    const CONFIG = {
        weather: { lat: 33.59, lon: 130.40 }, // 福岡
        newsUrl: "https://api.rss2json.com/v1/api.json?rss_url=https://news.yahoo.co.jp/rss/topics/top-picks.xml"
    };

    // --- 状態管理 (State) ---
    let state = {
        linkData: JSON.parse(localStorage.getItem(STORAGE_KEY)) || {},
        backups: JSON.parse(localStorage.getItem(BACKUP_KEY)) || []
    };

    // --- 要素の取得 ---
    const elements = {
        categories: document.getElementById("categories"),
        categorySelect: document.getElementById("categorySelect"),
        editorPanel: document.getElementById("editorPanel"),
        wallpaperPanel: document.getElementById("wallpaperPanel"),
        newsList: document.getElementById("news-list"),
        clock: document.getElementById("clock"),
        date: document.getElementById("date"),
        weather: document.getElementById("weather")
    };

    // --- コア機能 ---

    /** データの保存 */
    const saveToStorage = () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.linkData));
        
        // バックアップ作成（最大5件）
        state.backups.unshift({
            time: new Date().toLocaleString(),
            data: JSON.parse(JSON.stringify(state.linkData))
        });
        if (state.backups.length > 5) state.backups.pop();
        localStorage.setItem(BACKUP_KEY, JSON.stringify(state.backups));
    };

    /** カテゴリーとリンクの描画 */
    const renderLinks = () => {
        elements.categories.innerHTML = "";
        elements.categorySelect.innerHTML = "";

        Object.keys(state.linkData).forEach(categoryName => {
            // カテゴリー要素の作成
            const section = document.createElement("div");
            section.className = "category-section";
            
            section.innerHTML = `
                <h2 class="category-title">${categoryName}</h2>
                <div class="links-grid"></div>
            `;

            const grid = section.querySelector(".links-grid");

            // リンクの描画
            state.linkData[categoryName].forEach((link, index) => {
                const item = document.createElement("div");
                item.className = "link-item";
                item.innerHTML = `
                    <a href="${link.url}" target="_blank">
                        <img src="https://www.google.com/s2/favicons?sz=64&domain=${link.url}" alt="">
                        <span>${link.name}</span>
                    </a>
                    <button class="delete-btn" data-cat="${categoryName}" data-index="${index}">×</button>
                `;
                grid.appendChild(item);
            });

            elements.categories.appendChild(section);

            // セレクトボックスの更新
            const opt = new Option(categoryName, categoryName);
            elements.categorySelect.add(opt);
        });
    };

    // --- 各種イベントハンドラ ---

    /** カテゴリー追加 */
    const handleAddCategory = () => {
        const name = prompt("新しいカテゴリー名を入力してください");
        if (name && !state.linkData[name]) {
            state.linkData[name] = [];
            saveToStorage();
            renderLinks();
        }
    };

    /** リンク追加 */
    const handleAddLink = () => {
        const name = document.getElementById("linkName").value;
        let url = document.getElementById("linkURL").value;
        const cat = elements.categorySelect.value;

        if (!name || !url || !cat) return alert("入力が足りません");
        if (!url.startsWith("http")) url = "https://" + url;

        state.linkData[cat].push({ name, url });
        saveToStorage();
        renderLinks();

        // フォームリセット
        document.getElementById("linkName").value = "";
        document.getElementById("linkURL").value = "";
    };

    /** 壁紙設定 */
    const initWallpaper = () => {
        const savedColor = localStorage.getItem("wallpaperColor");
        const savedImage = localStorage.getItem("wallpaperImage");

        const applyBg = (style) => document.body.style.background = style;

        if (savedImage) applyBg(`url(${savedImage}) center/cover no-repeat fixed`);
        else if (savedColor) applyBg(savedColor);

        document.getElementById("colorPicker").oninput = (e) => {
            applyBg(e.target.value);
            localStorage.setItem("wallpaperColor", e.target.value);
            localStorage.removeItem("wallpaperImage");
        };

        document.getElementById("imageUpload").onchange = (e) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = event.target.result;
                applyBg(`url(${img}) center/cover no-repeat fixed`);
                localStorage.setItem("wallpaperImage", img);
            };
            reader.readAsDataURL(e.target.files[0]);
        };
    };

    /** 時計・天気・ニュース (外部連携) */
    const startClock = () => {
        const update = () => {
            const now = new Date();
            elements.clock.textContent = now.toLocaleTimeString("ja-JP");
            elements.date.textContent = now.toLocaleDateString("ja-JP", { 
                year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' 
            });
        };
        setInterval(update, 1000);
        update();
    };

    const fetchWeather = async () => {
        try {
            const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${CONFIG.weather.lat}&longitude=${CONFIG.weather.lon}&current_weather=true`);
            const data = await res.json();
            const temp = data.current_weather.temperature;
            elements.weather.textContent = `福岡: ${temp}°C`;
        } catch (e) {
            elements.weather.textContent = "天気取得エラー";
        }
    };

    const fetchNews = async () => {
        try {
            const res = await fetch(CONFIG.newsUrl);
            const data = await res.json();
            elements.newsList.innerHTML = data.items.slice(0, 5).map(item => 
                `<div class="news-item"><a href="${item.link}" target="_blank">${item.title}</a></div>`
            ).join('');
        } catch (e) {
            elements.newsList.textContent = "ニュースが取得できませんでした";
        }
    };

    // --- パネル表示切り替え (共通) ---
    const togglePanel = (panelId) => {
        const panel = document.getElementById(panelId);
        panel.classList.toggle("hidden");
    };

    // --- イベントリスナーの登録 ---
    document.getElementById("btn-add-category").onclick = handleAddCategory;
    document.getElementById("btn-toggle-editor").onclick = () => togglePanel("editorPanel");
    document.getElementById("btn-toggle-wallpaper").onclick = () => togglePanel("wallpaperPanel");
    document.getElementById("btn-add-link").onclick = handleAddLink;

    // 削除ボタンの委譲イベント
    elements.categories.addEventListener("click", (e) => {
        if (e.target.classList.contains("delete-btn")) {
            const { cat, index } = e.target.dataset;
            state.linkData[cat].splice(index, 1);
            saveToStorage();
            renderLinks();
        }
    });

    // --- 初期化実行 ---
    renderLinks();
    initWallpaper();
    startClock();
    fetchWeather();
    fetchNews();
});
