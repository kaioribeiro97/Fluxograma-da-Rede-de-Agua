// 1. IMPORTAÇÕES (Devem ser sempre a primeira coisa do arquivo)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getFirestore, doc, setDoc, onSnapshot, collection, addDoc, getDocs, deleteDoc, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// 2. CONFIGURAÇÃO
const DATA_VERSION = "1.16"; 
const firebaseConfig = {
  apiKey: "AIzaSyB7zUjd4yGPvJkd_dZxy7gADHmNK7UUe-I",
  authDomain: "pokemon-tcg-sp.firebaseapp.com",
  projectId: "pokemon-tcg-sp",
  storageBucket: "pokemon-tcg-sp.firebasestorage.app",
  messagingSenderId: "898774636210",
  appId: "1:898774636210:web:c385cc8df48aecd2c55bab"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Lista de UIDs autorizados a aceder ao painel
const ALLOWED_UIDS = [
  "PZt2BWoC0TMjFOmDKH8DkfoEj6z2", // UID Antigo
  "gC3VGb9rQbhDtdPF6g5WLdPx23g2",
  "qTsDSJjhLEbWc1Hs1SdBToh78wV2"          // <--- SUBSTITUA PELO UID REAL DO NOVO UTILIZADOR
];

const $ = (s) => document.querySelector(s);
const state = { 
  user: null, 
  collections: {}, 
  pokedexSpecies: [], 
  pokedexCardsBySpecies: {}, 
  representatives: {}, 
  currentCollection: null, 
  unsubscribeMap: {},
  searchQuery: "",
  pokedexSearch: "",
  pokedexFilter: "all",
  currentView: "albums"
};

// --- DADOS DA COPA DO MUNDO 2026 ---
const copaData = [
  { id: "FWC", name: "Página Inicial", count: 20, start: 0, icon: "fa-globe" },
  { id: "MEX", name: "México", count: 20, iso: "mx" },
  { id: "RSA", name: "África do Sul", count: 20, iso: "za" },
  { id: "KOR", name: "Coréia do Sul", count: 20, iso: "kr" },
  { id: "CZE", name: "Rep. Tcheca", count: 20, iso: "cz" },
  { id: "CAN", name: "Canadá", count: 20, iso: "ca" },
  { id: "BIH", name: "Bósnia", count: 20, iso: "ba" },
  { id: "QAT", name: "Catar", count: 20, iso: "qa" },
  { id: "SUI", name: "Suiça", count: 20, iso: "ch" },
  { id: "BRA", name: "Brasil", count: 20, iso: "br" },
  { id: "MAR", name: "Marrocos", count: 20, iso: "ma" },
  { id: "HAI", name: "Haiti", count: 20, iso: "ht" },
  { id: "SCO", name: "Escócia", count: 20, iso: "gb-sct" },
  { id: "USA", name: "Estados Unidos", count: 20, iso: "us" },
  { id: "PAR", name: "Paraguai", count: 20, iso: "py" },
  { id: "AUS", name: "Austrália", count: 20, iso: "au" },
  { id: "TUR", name: "Turquia", count: 20, iso: "tr" },
  { id: "GER", name: "Alemanha", count: 20, iso: "de" },
  { id: "CUW", name: "Curaçao", count: 20, iso: "cw" },
  { id: "CIV", name: "Costa do Marfim", count: 20, iso: "ci" },
  { id: "ECU", name: "Equador", count: 20, iso: "ec" },
  { id: "NED", name: "Holanda", count: 20, iso: "nl" },
  { id: "JPN", name: "Japão", count: 20, iso: "jp" },
  { id: "SWE", name: "Suécia", count: 20, iso: "se" },
  { id: "TUN", name: "Tunísia", count: 20, iso: "tn" },
  { id: "BEL", name: "Bélgica", count: 20, iso: "be" },
  { id: "EGY", name: "Egito", count: 20, iso: "eg" },
  { id: "IRN", name: "Irã", count: 20, iso: "ir" },
  { id: "NZL", name: "Nova Zelândia", count: 20, iso: "nz" },
  { id: "ESP", name: "Espanha", count: 20, iso: "es" },
  { id: "CPV", name: "Cabo Verde", count: 20, iso: "cv" },
  { id: "KSA", name: "Arábia Saudita", count: 20, iso: "sa" },
  { id: "URU", name: "Uruguai", count: 20, iso: "uy" },
  { id: "FRA", name: "França", count: 20, iso: "fr" },
  { id: "SEN", name: "Senegal", count: 20, iso: "sn" },
  { id: "IRQ", name: "Iraque", count: 20, iso: "iq" },
  { id: "NOR", name: "Noruega", count: 20, iso: "no" },
  { id: "ARG", name: "Argentina", count: 20, iso: "ar" },
  { id: "ALG", name: "Argélia", count: 20, iso: "dz" },
  { id: "AUT", name: "Áustria", count: 20, iso: "at" },
  { id: "JOR", name: "Jordânia", count: 20, iso: "jo" },
  { id: "POR", name: "Portugal", count: 20, iso: "pt" },
  { id: "COD", name: "Congo", count: 20, iso: "cd" },
  { id: "UZB", name: "Uzbequistão", count: 20, iso: "uz" },
  { id: "COL", name: "Colômbia", count: 20, iso: "co" },
  { id: "ENG", name: "Inglaterra", count: 20, iso: "gb-eng" },
  { id: "CRO", name: "Croácia", count: 20, iso: "hr" },
  { id: "GHA", name: "Gana", count: 20, iso: "gh" },
  { id: "PAN", name: "Panamá", count: 20, iso: "pa" },
  { id: "CC", name: "Coca-Cola", count: 14, icon: "fa-bottle-water" }
];

state.copaStickers = new Set();
state.currentCopaTeam = null;

// --- FUNÇÕES DA COPA (DINÂMICAS) ---
function attachCopaListener() {
  if (!state.user) return;
  const docRef = doc(db, "artifacts", firebaseConfig.appId, "users", state.user.uid, "copa_2026", "stickers");
  
  if (state.unsubscribeMap['copa']) state.unsubscribeMap['copa']();
  
  state.unsubscribeMap['copa'] = onSnapshot(docRef, (snap) => {
    const data = snap.data() || {};
    state.copaStickers = new Set(Object.keys(data).filter(k => data[k]));
    
    if (state.currentView === 'copa') {
      renderCopaTeams();
      if(state.currentCopaTeam) renderCopaStickers(state.currentCopaTeam);
    }
  }, (err) => console.error("Erro na coleção da Copa:", err));
}

async function toggleCopaSticker(stickerId, isOwned) {
  if (!state.user) return;
  const docRef = doc(db, "artifacts", firebaseConfig.appId, "users", state.user.uid, "copa_2026", "stickers");
  try {
    await setDoc(docRef, { [stickerId]: !isOwned }, { merge: true });
  } catch (error) {
    console.error("Erro de Permissão (Copa):", error);
    alert("Erro! O Firebase bloqueou a gravação. Verifique as 'Rules' da sua Base de Dados.");
  }
}

function renderCopaTeams() {
  const grid = document.querySelector("#copa-teams-grid");
  if (!grid) return;
  grid.innerHTML = "";
  
  let totalStickers = 0;
  let totalOwned = 0;

  copaData.forEach(team => {
    totalStickers += team.count;
    let startIdx = team.start !== undefined ? team.start : 1;
    let endIdx = startIdx + team.count - 1;
    for(let i = startIdx; i <= endIdx; i++) {
        if(state.copaStickers.has(`${team.id}${i}`)) totalOwned++;
    }
  });

  const query = state.copaSearch || "";
  const filteredTeams = copaData.filter(team => {
      if (!query) return true;
      const searchVal = query.toLowerCase();
      return team.name.toLowerCase().includes(searchVal) || 
             team.id.toLowerCase().includes(searchVal) || 
             searchVal.startsWith(team.id.toLowerCase());
  });

  filteredTeams.forEach(team => {
    let ownedInTeam = 0;
    let startIdx = team.start !== undefined ? team.start : 1;
    let endIdx = startIdx + team.count - 1;
    
    for(let i = startIdx; i <= endIdx; i++) {
        if(state.copaStickers.has(`${team.id}${i}`)) ownedInTeam++;
    }

    const pct = Math.round((ownedInTeam / team.count) * 100) || 0;
    
    const flagHTML = team.iso 
        ? `<img src="https://flagcdn.com/w40/${team.iso}.png" class="w-8 h-6 rounded-sm object-cover shadow-sm border border-slate-700" alt="${team.name}">`
        : `<div class="w-8 h-6 rounded-sm bg-slate-800 flex items-center justify-center border border-slate-700"><i class="fa-solid ${team.icon} text-emerald-500 text-xs"></i></div>`;

    const btn = document.createElement("button");
    btn.className = "group p-4 bg-slate-800/50 border border-slate-700 rounded-2xl text-left hover:border-emerald-500 transition shadow-xl relative overflow-hidden";
    
    btn.innerHTML = `
      <div class="flex justify-between items-start mb-3">
        <div class="flex items-center gap-3">
          ${flagHTML}
          <div>
            <h4 class="font-bold text-white text-sm group-hover:text-emerald-400 transition">${team.name}</h4>
            <p class="text-[10px] text-slate-500 font-mono">${team.id}</p>
          </div>
        </div>
        <div class="flex flex-col items-end">
          <span class="text-[11px] font-black ${pct === 100 ? 'text-emerald-400' : 'text-slate-200'} transition">
            ${ownedInTeam} / ${team.count}
          </span>
          <span class="text-[9px] font-bold opacity-60 text-slate-400">${pct}%</span>
        </div>
      </div>
      <div class="mt-2 w-full h-1 bg-slate-700 rounded-full overflow-hidden">
        <div class="h-full ${pct === 100 ? 'bg-emerald-400' : 'bg-emerald-600'} transition-all duration-500" style="width: ${pct}%"></div>
      </div>
    `;
    
    btn.onclick = () => {
      state.currentCopaTeam = team.id;
      document.querySelector("#copa-teams-grid").classList.add("hidden");
      document.querySelector("#copa-details").classList.remove("hidden");
      state.copaSearch = "";
      const searchInput = document.querySelector("#copa-search");
      if(searchInput) searchInput.value = "";
      renderCopaStickers(team.id);
    };
    grid.appendChild(btn);
  });
  
  const globalPct = Math.round((totalOwned / totalStickers) * 100) || 0;
  document.querySelector("#copa-progress-bar").style.width = `${globalPct}%`;
  document.querySelector("#copa-stats-text").textContent = `${totalOwned} / ${totalStickers} (${globalPct}%)`;
}

function renderCopaStickers(teamId) {
  const team = copaData.find(t => t.id === teamId);
  const grid = document.querySelector("#copa-stickers-grid");
  grid.innerHTML = "";
  
  const flagHTML = team.iso 
      ? `<img src="https://flagcdn.com/w40/${team.iso}.png" class="w-8 h-6 rounded object-cover shadow-sm mr-3 border border-slate-700" alt="${team.name}">`
      : `<i class="fa-solid ${team.icon || 'fa-futbol'} text-emerald-500 text-xl mr-3"></i>`;
      
  document.querySelector("#copa-details-title").innerHTML = `<div class="flex items-center">${flagHTML} <span>${team.name}</span></div>`;
  
  let ownedInTeam = 0;
  let startIdx = team.start !== undefined ? team.start : 1;
  let endIdx = startIdx + team.count - 1;

  for(let i = startIdx; i <= endIdx; i++) {
    const stickerId = `${team.id}${i}`;
    const isOwned = state.copaStickers.has(stickerId);
    if(isOwned) ownedInTeam++;

    const btn = document.createElement("button");
    const displayNum = team.id === "FWC" && i < 10 ? `0${i}` : i; 
    
    btn.className = `aspect-square flex flex-col items-center justify-center rounded-xl font-bold text-sm border-2 transition-all duration-200 transform hover:scale-105 active:scale-95 ${
      isOwned 
        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
        : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300'
    }`;
    
    btn.innerHTML = `<span>${displayNum}</span>`;
    btn.onclick = () => { toggleCopaSticker(stickerId, isOwned); };
    grid.appendChild(btn);
  }
  
  document.querySelector("#copa-details-subtitle").textContent = `${ownedInTeam} de ${team.count} completas`;
}

document.querySelector("#close-copa-details").onclick = () => {
  state.currentCopaTeam = null;
  document.querySelector("#copa-details").classList.add("hidden");
  document.querySelector("#copa-teams-grid").classList.remove("hidden");
};

// --- UTILITÁRIOS ---
function getBaseName(fullName) {
  if (!fullName) return "";
  
  // 1. Remove sufixos de raridade, climas e formas (Adicionados: Lavagem, Corte, Calor, Ventilador)
  let cleaned = fullName.replace(/\s(ex|GX|VMAX|VSTAR|V|Tera|TAG\sTEAM|EX|Prime|LEGEND|ex\sTera|LV\.X|Lua Sangrenta|Lavagem|Corte|Calor|Ventilador)\b/gi, '');
  
  // 2. Remove posse/treinador do final
  cleaned = cleaned.replace(/\s(da|do|de)\s.+$/i, '');
  
  // 3. Remove prefixos do início do nome (Adicionados: Brock's e Onix do)
  cleaned = cleaned.replace(/^(Mega|M|Brock's|Onix do)\s/i, '');
  
  // 4. Outras regras específicas da sua base
  cleaned = cleaned.replace(/\sMáscara\s.+$/i, '');
  cleaned = cleaned.replace(/\s(Estilo|Forma)\s.+$/i, '');
  
  // 5. Remove espaços extras que sobraram no início, fim ou duplos no meio
  return cleaned.trim().replace(/\s+/g, ' ');
}

// --- AUTENTICAÇÃO ---
$("#login-btn").addEventListener("click", async () => {
  const email = $("#login-email").value;
  const pass = $("#login-pass").value;
  $("#login-error").classList.add("hidden");
  try { await signInWithEmailAndPassword(auth, email, pass); } catch (err) { $("#login-error").classList.remove("hidden"); }
});
$("#logout-btn").addEventListener("click", () => signOut(auth));

onAuthStateChanged(auth, (user) => {
  if (user && ALLOWED_UIDS.includes(user.uid)) {
    state.user = user;
    $("#login-screen").classList.add("hidden");
    $("#main-content").classList.remove("hidden");
    
    Object.values(state.unsubscribeMap).forEach(unsub => unsub());
    state.unsubscribeMap = {};
    state.collections = {}; 

    loadData();
    attachPokedexPrefsListener();
    attachCopaListener(); 
  } else {
    state.user = null;
    $("#login-screen").classList.remove("hidden");
    $("#main-content").classList.add("hidden");
    Object.values(state.unsubscribeMap).forEach(unsub => unsub());
    state.unsubscribeMap = {};
  }
});

// --- NAVEGAÇÃO ---
document.querySelectorAll(".view-tab").forEach(tab => {
  tab.addEventListener("click", () => {
    const view = tab.dataset.view;
    state.currentView = view;
    
    document.querySelectorAll(".view-tab").forEach(t => t.className = "view-tab px-4 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white transition");
    
    if(view === 'copa') {
        tab.className = "view-tab px-4 py-1.5 rounded-lg text-xs font-medium transition bg-emerald-500 text-slate-950";
    } else {
        tab.className = "view-tab px-4 py-1.5 rounded-lg text-xs font-medium transition bg-sky-500 text-slate-950";
    }
    
    $("#view-albums").classList.add("hidden");
    $("#view-pokedex").classList.add("hidden");
    $("#view-copa").classList.add("hidden");   
    $("#view-tcgdex").classList.add("hidden");
    
    if (view === "albums") {
      $("#view-albums").classList.remove("hidden");
    } else if (view === "pokedex") {
      $("#view-pokedex").classList.remove("hidden");
      renderPokedex();
    } else if (view === "copa") {
      $("#view-copa").classList.remove("hidden");
      renderCopaTeams();
    } else if (view === "tcgdex") {
      $("#view-tcgdex").classList.remove("hidden"); // <-- ADICIONE ESTA LINHA
    }
  });
});

$("#card-search").addEventListener("input", (e) => { state.searchQuery = e.target.value.toLowerCase(); renderCards(); });
$("#pokedex-search").addEventListener("input", (e) => { state.pokedexSearch = e.target.value.toLowerCase(); renderPokedex(); });
document.querySelector("#copa-search")?.addEventListener("input", (e) => { 
  state.copaSearch = e.target.value.toLowerCase().trim(); 
  renderCopaTeams(); 
});

document.querySelectorAll(".pokedex-filter-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".pokedex-filter-btn").forEach(b => {
      b.className = "pokedex-filter-btn px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase text-slate-400 hover:text-white transition";
    });
    btn.className = "pokedex-filter-btn px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase transition bg-slate-600 text-white shadow";
    state.pokedexFilter = btn.dataset.filter;
    renderPokedex();
  });
});

// --- LÓGICA DE DADOS (DINÂMICA) ---
async function loadData() {
  let finalTCGData = [];
  let finalPokedexData = [];

  const cachedVersion = localStorage.getItem("pokemon_data_version");
  const cachedTCG = localStorage.getItem("tcg_data");
  const cachedPokedex = localStorage.getItem("pokedex_data");

  if (cachedVersion === DATA_VERSION && cachedTCG && cachedPokedex) {
    finalTCGData = JSON.parse(cachedTCG);
    finalPokedexData = JSON.parse(cachedPokedex);
  } else {
    try {
      const [tcgRes, pokedexRes] = await Promise.all([
        fetch("./TCG_CARD.json"),
        fetch("./pokedex.json")
      ]);
      finalTCGData = await tcgRes.json();
      finalPokedexData = await pokedexRes.json();
      
      finalPokedexData.sort((a, b) => a.id - b.id);
      localStorage.setItem("tcg_data", JSON.stringify(finalTCGData));
      localStorage.setItem("pokedex_data", JSON.stringify(finalPokedexData));
      localStorage.setItem("pokemon_data_version", DATA_VERSION);
    } catch (e) {
      console.error("Erro ao baixar JSONs:", e);
    }
  }

  if (state.user) {
      try {
          const customRef = collection(db, "artifacts", firebaseConfig.appId, "users", state.user.uid, "custom_cards");
          const snapshot = await getDocs(customRef);
          
          const customCards = [];
          snapshot.forEach(doc => { 
              // ATUALIZADO: Guardando o customId gerado pelo Firestore
              let cardData = doc.data();
              cardData.customId = doc.id;
              customCards.push(cardData); 
          });

          if (customCards.length > 0) {
              finalTCGData = [...finalTCGData, ...customCards];
          }
      } catch (err) {
          console.error("Erro ao carregar cartas customizadas:", err);
      }
  }

  state.pokedexSpecies = finalPokedexData;
  processTCGJson(finalTCGData);
}

function processTCGJson(json) {
  state.pokedexCardsBySpecies = {};
  const speciesMap = {};
  state.pokedexSpecies.forEach(s => {
    speciesMap[s.name.english.toLowerCase()] = s.name.english;
    state.pokedexCardsBySpecies[s.name.english] = [];
  });

  const dynamicCollections = new Set();
  json.forEach(card => {
    const baseName = getBaseName(card.Pokemon).toLowerCase();
    const officialName = speciesMap[baseName];
    if (officialName) state.pokedexCardsBySpecies[officialName].push(card);
    if (card.Coleção) dynamicCollections.add(card.Coleção);
  });

  state.collections = {};

  Array.from(dynamicCollections).sort().forEach(name => {
    const filteredCards = json.filter(c => c.Coleção === name);
    const id = name.replace(/\s/g, '').toLowerCase();
    
    state.collections[id] = { name, cards: filteredCards, owned: new Set() };
    attachCollectionListener(id);
  });
  
  renderAlbums();
  renderPokedex();
}

function attachCollectionListener(colId) {
  if (!state.user) return;
  const docRef = doc(db, "artifacts", firebaseConfig.appId, "users", state.user.uid, "collections", colId);
  if (state.unsubscribeMap[colId]) state.unsubscribeMap[colId]();
  
  state.unsubscribeMap[colId] = onSnapshot(docRef, (snap) => {
    const data = snap.data() || {};
    if (state.collections[colId]) {
       state.collections[colId].owned = new Set(Object.keys(data).filter(k => data[k]));
       if (state.currentCollection === colId) renderCards();
       renderAlbums();
       updateGlobalProgress();
       if (state.currentView === 'pokedex') renderPokedex();
    }
  }, (err) => console.error(`Erro na coleção ${colId}:`, err));
}

function attachPokedexPrefsListener() {
  if (!state.user) return;
  const docRef = doc(db, "artifacts", firebaseConfig.appId, "users", state.user.uid, "pokedex_prefs", "representatives");
  onSnapshot(docRef, (snap) => {
    state.representatives = snap.data() || {};
    if (state.currentView === 'pokedex') renderPokedex();
  }, (err) => console.error("Erro nas preferências da Pokedex:", err));
}

// --- RENDERIZADORES ---
function renderAlbums() {
  const grid = $("#albums-grid"); 
  if (!grid) return;
  grid.innerHTML = "";

  Object.keys(state.collections).sort().forEach(id => {
    const col = state.collections[id];
    const pct = Math.round((col.owned.size / col.cards.length) * 100) || 0;
    const btn = document.createElement("button");
    btn.className = "group p-5 bg-slate-800/50 border border-slate-700 rounded-2xl text-left hover:border-sky-500 transition shadow-xl";
    btn.innerHTML = `<div class="flex justify-between items-start mb-4"><h4 class="font-bold text-sky-400">${col.name}</h4><span class="text-[10px] bg-slate-700 px-2 py-1 rounded-md text-slate-300">${pct}%</span></div><p class="text-xs text-slate-400">${col.owned.size} / ${col.cards.length} obtidas</p><div class="mt-3 w-full h-1.5 bg-slate-700 rounded-full overflow-hidden"><div class="h-full bg-sky-500" style="width: ${pct}%"></div></div>`;
    btn.onclick = () => { state.currentCollection = id; state.searchQuery = ""; $("#card-search").value = ""; $("#details-title").textContent = col.name; $("#collection-details").classList.remove("hidden"); renderCards(); };
    grid.appendChild(btn);
  });
}

function renderCards() {
  const grid = document.querySelector("#cards-grid"); 
  if (!grid) return;
  grid.innerHTML = "";
  
  const col = state.collections[state.currentCollection];
  if (!col) return;
  const filtered = col.cards.filter(c => c.Pokemon.toLowerCase().includes(state.searchQuery) || c.Número.includes(state.searchQuery));
  
  document.querySelector("#details-subtitle").textContent = `${col.owned.size} obtidas de ${col.cards.length} totais`;
  document.querySelector("#details-progress-bar").style.width = `${(col.owned.size / col.cards.length) * 100}%`;

  filtered.forEach(card => {
    const cardId = `${card.Coleção}#${card.Número}`;
    const isOwned = col.owned.has(cardId);
    
    const container = document.createElement("div");
    container.className = `flex flex-col gap-2 items-center bg-slate-900/40 p-2 rounded-2xl border border-slate-800 hover:border-slate-700 transition`;

    container.innerHTML = `
      <div class="card-container relative w-full aspect-[3/4] cursor-pointer transition ${isOwned ? '' : 'grayscale opacity-40'}">
         <img src="${card.Imagem}" class="w-full h-full object-cover rounded-xl border ${isOwned ? 'border-sky-500/50' : 'border-slate-800'}" loading="lazy">
         <div class="absolute bottom-0 inset-x-0 p-2 bg-black/60 backdrop-blur-sm rounded-b-xl opacity-0 hover:opacity-100 transition text-center z-30">
            <p class="text-[8px] font-bold truncate">${card.Pokemon}</p>
         </div>
      </div>
      <div class="flex items-center justify-between w-full px-1">
         <span class="text-[9px] font-mono text-slate-500">#${card.Número}</span>
         <div class="pokeball-toggle ${isOwned ? 'active' : ''}"></div>
      </div>
    `;

    const holoCard = container.querySelector('.card-container');

    if (isOwned) {
        holoCard.addEventListener('mousemove', (e) => {
            const rect = holoCard.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const w = rect.width;
            const h = rect.height;

            const px = Math.abs(Math.floor(100 / w * x) - 100);
            const py = Math.abs(Math.floor(100 / h * y) - 100);
            const pa = (50 - px) + (50 - py);

            const lp = (50 + (px - 50) / 1.5);
            const tp = (50 + (py - 50) / 1.5);
            const px_spark = (50 + (px - 50) / 7);
            const py_spark = (50 + (py - 50) / 7);
            const p_opc = 20 + (Math.abs(pa) * 1.5);

            holoCard.classList.add("active");
            holoCard.style.setProperty('--grad-pos-x', `${lp}%`);
            holoCard.style.setProperty('--grad-pos-y', `${tp}%`);
            holoCard.style.setProperty('--spark-pos-x', `${px_spark}%`);
            holoCard.style.setProperty('--spark-pos-y', `${py_spark}%`);
            holoCard.style.setProperty('--opacity', `${p_opc / 100}`);
        });

        holoCard.addEventListener('mouseleave', () => {
            holoCard.classList.remove("active");
            holoCard.removeAttribute("style");
        });
        
        holoCard.onclick = () => openModal(card, cardId, isOwned);
    }

    container.querySelector('.pokeball-toggle').onclick = (e) => { e.stopPropagation(); toggleCard(cardId, isOwned); };
    grid.appendChild(container);
  });
}

function renderPokedex() {
  const grid = document.querySelector("#pokedex-grid"); 
  if (!grid) return;
  grid.innerHTML = "";

  let totalSpecies = 0;
  let ownedSpeciesCount = 0;

  state.pokedexSpecies.forEach(species => {
    totalSpecies++;
    const name = species.name.english;
    const tcgCards = state.pokedexCardsBySpecies[name] || [];
    
    const hasAny = tcgCards.some(c => {
      const colId = c.Coleção.replace(/\s/g, '').toLowerCase();
      const cardId = `${c.Coleção}#${c.Número}`;
      return state.collections[colId]?.owned.has(cardId);
    });

    if (hasAny) ownedSpeciesCount++;
  });

  const pct = totalSpecies > 0 ? Math.round((ownedSpeciesCount / totalSpecies) * 100) : 0;
  document.querySelector("#pokedex-progress-bar").style.width = `${pct}%`;
  document.querySelector("#pokedex-stats-text").textContent = `${ownedSpeciesCount} / ${totalSpecies} (${pct}%)`;

  const filteredSpecies = state.pokedexSpecies.filter(species => {
    const matchesSearch = species.name.english.toLowerCase().includes(state.pokedexSearch) || 
                          species.id.toString().includes(state.pokedexSearch);
    
    if (!matchesSearch) return false;

    const name = species.name.english;
    const tcgCards = state.pokedexCardsBySpecies[name] || [];
    const hasAny = tcgCards.some(c => {
      const colId = c.Coleção.replace(/\s/g, '').toLowerCase();
      const cardId = `${c.Coleção}#${c.Número}`;
      return state.collections[colId]?.owned.has(cardId);
    });

    if (state.pokedexFilter === "owned" && !hasAny) return false;
    if (state.pokedexFilter === "missing" && hasAny) return false;

    return true;
  });

  filteredSpecies.forEach(species => {
    const name = species.name.english;
    const tcgCards = state.pokedexCardsBySpecies[name] || [];
    
    const ownedCards = tcgCards.filter(c => {
      const colId = c.Coleção.replace(/\s/g, '').toLowerCase();
      const cardId = `${c.Coleção}#${c.Número}`;
      return state.collections[colId]?.owned.has(cardId);
    });

    const hasAny = ownedCards.length > 0;
    
    let displayImage = `https://repositorio.sbrauble.com/arquivos/up/pokedex/${species.id}.svg`;
    if (hasAny) {
      const repId = state.representatives[name];
      const favoriteCard = ownedCards.find(c => `${c.Coleção}#${c.Número}` === repId);
      displayImage = favoriteCard ? favoriteCard.Imagem : ownedCards[0].Imagem;
    }

    const card = document.createElement("button");
    card.className = `relative flex flex-col items-center p-4 rounded-3xl border-2 transition transform hover:scale-105 pokedex-card-bg ${hasAny ? 'border-slate-500 shadow-[0_10px_30px_rgba(0,0,0,0.5)]' : 'border-slate-800 opacity-80'}`;
    
    card.innerHTML = `
      <div class="absolute top-2 left-2 pokedex-number-badge ${hasAny ? 'bg-rose-500 text-white' : 'bg-slate-700 text-slate-400'}">#${species.id.toString().padStart(3, '0')}</div>
      <div class="w-[137px] h-[205px] mb-3 flex items-center justify-center relative mx-auto">
        <img src="${displayImage}" class="max-h-full max-w-full object-contain drop-shadow-2xl transition-all duration-300 ${hasAny ? '' : 'brightness-0 opacity-50'}" loading="lazy">
        ${hasAny ? '<i class="fa-solid fa-circle-check absolute -bottom-1 -right-1 text-emerald-400 text-lg bg-slate-900 rounded-full shadow"></i>' : '<i class="fa-solid fa-lock absolute -bottom-1 -right-1 text-slate-600 text-sm bg-slate-900 rounded-full p-1"></i>'}
      </div>
      <p class="text-[10px] font-black uppercase text-center truncate w-full tracking-wider ${hasAny ? 'text-slate-100' : 'text-slate-500'}">${name}</p>
      <p class="text-[8px] font-bold ${hasAny ? 'text-slate-400' : 'text-slate-600'}">${ownedCards.length} Cartas</p>
    `;
    card.onclick = () => openPokedexModal(species);
    grid.appendChild(card);
  });
  
  if (filteredSpecies.length === 0) {
      grid.innerHTML = `<div class="col-span-full py-10 text-center text-slate-500">Nenhum Pokémon encontrado com estes filtros.</div>`;
  }
}

function openPokedexModal(species) {
  const name = species.name.english;
  const tcgCards = state.pokedexCardsBySpecies[name] || [];
  
  $("#pokedex-modal-name").textContent = name;
  $("#pokedex-modal-id").textContent = `#${species.id.toString().padStart(3, '0')}`;
  
  const container = $("#pokedex-cards-container");
  container.innerHTML = "";

  if (tcgCards.length === 0) {
    container.innerHTML = `<div class="col-span-full py-20 text-center text-slate-500"><i class="fa-solid fa-box-open text-4xl mb-4"></i><p>Nenhum card TCG deste Pokémon encontrado.</p></div>`;
  }

  tcgCards.forEach(card => {
    const cardId = `${card.Coleção}#${card.Número}`;
    const colId = card.Coleção.replace(/\s/g, '').toLowerCase();
    let isOwned = state.collections[colId]?.owned.has(cardId);
    const isFav = state.representatives[name] === cardId;

    const cardEl = document.createElement("div");
    cardEl.className = `relative flex flex-col gap-2 p-3 bg-slate-800/40 rounded-2xl border-2 transition ${isFav ? 'border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.2)]' : 'border-slate-700 opacity-60 hover:opacity-100'}`;
    cardEl.innerHTML = `
      <div class="relative group aspect-[3/4] mb-2 overflow-hidden rounded-lg">
         <img src="${card.Imagem}" class="w-full h-full object-cover">
         <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-3">
            <button class="set-fav-btn flex items-center gap-2 px-3 py-1.5 bg-amber-400 text-slate-950 rounded-lg text-[10px] font-bold hover:bg-amber-300 transition">
              <i class="fa-solid fa-star"></i> Favorito
            </button>
            <button class="zoom-card-btn flex items-center gap-2 px-3 py-1.5 bg-sky-500 text-slate-950 rounded-lg text-[10px] font-bold hover:bg-sky-400 transition">
              <i class="fa-solid fa-magnifying-glass-plus"></i> Ampliar
            </button>
         </div>
      </div>
      <div class="space-y-1">
        <p class="text-[9px] text-slate-100 font-bold truncate">${card.Pokemon}</p>
        <p class="text-[8px] text-sky-400 font-medium truncate uppercase tracking-wider italic opacity-80">${card.Coleção}</p>
        <div class="flex items-center justify-between pt-1">
          <span class="text-[8px] text-slate-500 font-mono">#${card.Número}</span>
          <div class="pokeball-toggle sm ${isOwned ? 'active' : ''}"></div>
        </div>
      </div>
    `;
    
    cardEl.querySelector('.set-fav-btn').onclick = (e) => { e.stopPropagation(); setPokedexRepresentative(name, cardId); };
    cardEl.querySelector('.zoom-card-btn').onclick = (e) => { e.stopPropagation(); openModal(card, cardId, isOwned); };
    cardEl.querySelector('.pokeball-toggle').onclick = (e) => { 
      e.stopPropagation(); 
      toggleCard(cardId, isOwned); 
      isOwned = !isOwned; 
      e.currentTarget.classList.toggle("active");
    };
    container.appendChild(cardEl);
  });

  $("#pokedex-modal").classList.remove("hidden");
  $("#pokedex-modal").classList.add("flex");
}

$("#pokedex-modal-close").onclick = () => $("#pokedex-modal").classList.add("hidden");

async function setPokedexRepresentative(pokemonName, cardId) {
  if (!state.user) return;
  const docRef = doc(db, "artifacts", firebaseConfig.appId, "users", state.user.uid, "pokedex_prefs", "representatives");
  try {
    await setDoc(docRef, { [pokemonName]: cardId }, { merge: true });
  } catch (error) {
    console.error("Erro ao definir favorito:", error);
    alert("Erro! O Firebase bloqueou a gravação do favorito.");
  }
}

async function toggleCard(cardId, isOwned) {
  if (!state.user) return;
  const colId = cardId.split('#')[0].replace(/\s/g, '').toLowerCase();
  const docRef = doc(db, "artifacts", firebaseConfig.appId, "users", state.user.uid, "collections", colId);
  try {
    // Tenta gravar na Firestore
    await setDoc(docRef, { [cardId]: !isOwned }, { merge: true });
  } catch (error) {
    console.error("Erro ao alterar o estado da carta:", error);
    alert("Erro de Permissão! O Firebase bloqueou a gravação. Verifique as 'Regras' (Rules) do seu Firestore Database.");
  }
}


function openModal(card, cardId, isOwned) {
  const titleEl = document.querySelector("#modal-title");
  const imgEl = document.querySelector("#modal-image");
  const numEl = document.querySelector("#modal-number");
  const wrapper = document.querySelector("#modal-card-wrapper"); 

  titleEl.textContent = card.Pokemon;
  imgEl.src = card.Imagem;
  numEl.textContent = `Nº ${card.Número} | ${card.Coleção}`;

  const modal = document.querySelector("#card-modal");
  modal.classList.remove("hidden");
  modal.classList.add("flex");

  const btn = document.querySelector("#modal-toggle-btn");
  btn.textContent = isOwned ? "Remover da Coleção" : "Adicionar à Coleção";
  btn.className = "w-full py-4 text-lg bg-sky-500 text-slate-950 font-black rounded-2xl hover:bg-sky-400 transition shadow-xl shadow-sky-500/20 active:scale-95";
  
  btn.onclick = async () => { 
      await toggleCard(cardId, isOwned); 
      modal.classList.add("hidden"); 
  };

  wrapper.classList.remove("active");
  wrapper.removeAttribute("style");
  
  if (isOwned) {
      wrapper.classList.add("auto-holo");

      wrapper.onmousemove = (e) => {
          wrapper.classList.remove("auto-holo");
          wrapper.classList.add("active");

          const rect = wrapper.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          
          const w = rect.width;
          const h = rect.height;
          const px = Math.abs(Math.floor(100 / w * x) - 100);
          const py = Math.abs(Math.floor(100 / h * y) - 100);
          const pa = (50 - px) + (50 - py);
          const lp = (50 + (px - 50) / 1.5);
          const tp = (50 + (py - 50) / 1.5);
          const px_spark = (50 + (px - 50) / 7);
          const py_spark = (50 + (py - 50) / 7);
          const p_opc = 20 + (Math.abs(pa) * 1.5);

          wrapper.style.setProperty('--grad-pos-x', `${lp}%`);
          wrapper.style.setProperty('--grad-pos-y', `${tp}%`);
          wrapper.style.setProperty('--spark-pos-x', `${px_spark}%`);
          wrapper.style.setProperty('--spark-pos-y', `${py_spark}%`);
          wrapper.style.setProperty('--opacity', `${p_opc / 100}`);
      };

      wrapper.onmouseleave = () => {
          wrapper.classList.remove("active");
          wrapper.removeAttribute("style"); 
          wrapper.classList.add("auto-holo"); 
      };
  } else {
      wrapper.classList.remove("auto-holo");
      wrapper.onmousemove = null;
      wrapper.onmouseleave = null;
  }
  
  // Lógica para mostrar/esconder os botões de Edição/Exclusão para cartas customizadas
  const customActions = document.querySelector("#custom-card-actions");
  if (card.customId) {
      customActions.classList.remove("hidden");
      
      // Ação do botão de excluir
      document.querySelector("#btn-delete-custom").onclick = () => {
          deleteCustomCard(card.customId);
      };

      // Ação do botão de editar (abre o modal de edição e preenche os dados)
      document.querySelector("#btn-edit-custom").onclick = () => {
          document.querySelector("#card-modal").classList.add("hidden");
          document.querySelector("#edit-card-modal").classList.remove("hidden");
          document.querySelector("#edit-card-modal").classList.add("flex");
          
          // Preenche os campos do formulário
          document.querySelector("#edit-card-id").value = card.customId;
          document.querySelector("#edit-card-name").value = card.Pokemon;
          document.querySelector("#edit-card-col").value = card.Coleção;
          document.querySelector("#edit-card-num").value = card.Número;
          document.querySelector("#edit-card-img").value = card.Imagem;
      };
  } else {
      customActions.classList.add("hidden");
  }
  // Adicione isso ao final do script.js
document.querySelector("#btn-cancel-custom-col").onclick = () => {
    document.querySelector("#custom-col-modal").classList.add("hidden");
};
}

$("#modal-close").onclick = () => $("#card-modal").classList.add("hidden");

function updateGlobalProgress() {
  let total = 0, owned = 0;
  Object.values(state.collections).forEach(c => { total += c.cards.length; owned += c.owned.size; });
  const pct = Math.round((owned / total) * 100) || 0;
  $("#global-progress").classList.remove("hidden");
  $("#global-progress-bar").style.width = `${pct}%`;
  $("#global-progress-text").textContent = `${pct}%`;
}

$("#file-input").onchange = async (e) => {
  const file = e.target.files[0]; if (!file) return;
  const text = await file.text(); processTCGJson(JSON.parse(text));
};

// --- LÓGICA DE ADICIONAR CARTA AVULSA ---
const addCardModal = document.querySelector("#add-card-modal");
document.querySelector("#btn-open-add-card")?.addEventListener("click", () => {
    addCardModal.classList.remove("hidden");
    addCardModal.classList.add("flex");
});
document.querySelector("#btn-cancel-add")?.addEventListener("click", () => {
    addCardModal.classList.add("hidden");
});

// --- LÓGICA DE ADICIONAR CARTA AVULSA ---
document.querySelector("#form-add-card").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!state.user) return;

    const btn = e.target.querySelector("button[type='submit']");
    const originalText = btn.textContent;
    btn.textContent = "Salvando...";
    btn.disabled = true;

    const newCard = {
        Pokemon: document.querySelector("#new-card-name").value,
        Coleção: document.querySelector("#new-card-col").value,
        Número: document.querySelector("#new-card-num").value,
        Imagem: document.querySelector("#new-card-img").value
    };

    const isFav = document.querySelector("#new-card-fav").checked;

    try {
        // 1. Salva no Firebase
        const customCardsRef = collection(db, "artifacts", firebaseConfig.appId, "users", state.user.uid, "custom_cards");
        await addDoc(customCardsRef, newCard);

        // 2. Lógica de favorita e álbum
        if (isFav) {
            const cardId = `${newCard.Coleção}#${newCard.Número}`;
            const baseName = getBaseName(newCard.Pokemon).toLowerCase();
            const species = state.pokedexSpecies.find(s => s.name.english.toLowerCase() === baseName);
            const officialName = species ? species.name.english : newCard.Pokemon;
            
            await setPokedexRepresentative(officialName, cardId);

            const colId = newCard.Coleção.replace(/\s/g, '').toLowerCase();
            const colRef = doc(db, "artifacts", firebaseConfig.appId, "users", state.user.uid, "collections", colId);
            await setDoc(colRef, { [cardId]: true }, { merge: true });
        }

        // 3. Feedback visual sem Alert e Atualização Silenciosa
        btn.textContent = "Sucesso! ✔️";
        btn.classList.replace("bg-emerald-500", "bg-emerald-400"); // Dá um brilho no botão
        
        await loadData(); // Atualiza as cartas na tela instantaneamente

        // Aguarda 1 segundo para o usuário ver o "Sucesso!" e depois fecha o modal
        setTimeout(() => {
            e.target.reset();
            document.querySelector("#add-card-modal").classList.add("hidden");
            btn.textContent = originalText;
            btn.classList.replace("bg-emerald-400", "bg-emerald-500");
            btn.disabled = false;
        }, 1000);

    } catch (error) {
        console.error("Erro ao guardar carta personalizada:", error);
        alert("Erro de Permissão! O Firebase bloqueou a gravação da carta.");
        btn.textContent = originalText;
        btn.disabled = false;
    }
});

// --- ATUALIZADO: NOVAS FUNÇÕES DE REMOVER E EDITAR ---
// Remove uma carta customizada
async function deleteCustomCard(customId) {
    if (!state.user) return;
    
    const confirmDelete = confirm("Tem certeza que deseja remover esta carta permanentemente da base de dados?");
    if (!confirmDelete) return;

    try {
        const docRef = doc(db, "artifacts", firebaseConfig.appId, "users", state.user.uid, "custom_cards", customId);
        await deleteDoc(docRef);
        
        // Fecha o modal da carta grande e atualiza os dados em background
        document.querySelector("#card-modal").classList.add("hidden");
        await loadData(); 
        
    } catch (error) {
        console.error("Erro ao remover carta:", error);
        alert("Erro! Não foi possível remover a carta. Verifique as permissões.");
    }
}

// Edita os dados no Firebase
async function editCustomCard(customId, updatedFields) {
    if (!state.user) return;

    try {
        const docRef = doc(db, "artifacts", firebaseConfig.appId, "users", state.user.uid, "custom_cards", customId);
        await updateDoc(docRef, updatedFields);
        
        // Fecha o modal de edição e atualiza os dados em background
        document.querySelector("#edit-card-modal").classList.add("hidden");
        await loadData(); 
        
    } catch (error) {
        console.error("Erro ao editar carta:", error);
        alert("Erro! Não foi possível editar a carta.");
    }
}

// Enviar formulário do modal de edição
document.querySelector("#form-edit-card").addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const customId = document.querySelector("#edit-card-id").value;
    const updatedFields = {
        Pokemon: document.querySelector("#edit-card-name").value,
        Coleção: document.querySelector("#edit-card-col").value,
        Número: document.querySelector("#edit-card-num").value,
        Imagem: document.querySelector("#edit-card-img").value
    };

    const btn = e.target.querySelector("button[type='submit']");
    const originalText = btn.textContent;
    btn.textContent = "Salvando...";
    btn.disabled = true;

    await editCustomCard(customId, updatedFields);
    
    // O modal fecha sozinho dentro do editCustomCard, então só resetamos o botão
    btn.textContent = originalText;
    btn.disabled = false;
});
// ==========================================
// MÓDULO TCGDEX API (INTEGRAÇÃO)
// ==========================================

const tcgdexMapColecoes = new Map();
const tcgdexSetsData = {}; // NOVO: Dicionário para mapear ID -> Nome da Coleção

const tcgdexIdiomas = [
    { codigo: 'pt', label: 'PT-BR', color: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' },
    { codigo: 'en', label: 'EN', color: 'bg-sky-500/20 text-sky-400 border border-sky-500/30' },
    { codigo: 'ja', label: 'JP', color: 'bg-rose-500/20 text-rose-400 border border-rose-500/30' }
];

// Carrega a lista de coleções para o Datalist e para o dicionário interno
async function initTCGdex() {
    try {
        const res = await fetch('https://api.tcgdex.net/v2/pt/sets');
        const sets = await res.json();
        const datalist = document.getElementById('tcgdex-set-list');
        
        sets.reverse().forEach(set => {
            // Salva o nome oficial usando o ID como chave (ex: tcgdexSetsData['sv1'] = 'Escarlate e Violeta')
            tcgdexSetsData[set.id] = set.name;
            
            const ano = set.releaseDate ? set.releaseDate.split('-')[0] : 'S/D';
            const nomeExibicao = `${set.name} (${ano})`;
            tcgdexMapColecoes.set(nomeExibicao, set.id);
            
            const option = document.createElement('option');
            option.value = nomeExibicao;
            datalist.appendChild(option);
        });
    } catch (err) {
        console.error("Erro ao carregar coleções TCGdex:", err);
    }
}

// Inicia o carregamento em background quando a página carrega
setTimeout(initTCGdex, 2000);

window.handleTCGdexSet = function(value) {
    const setId = tcgdexMapColecoes.get(value);
    if (setId) {
        document.getElementById('tcgdex-name').value = ''; 
        buscarDadosTCGdex(`sets/${setId}`, true);
    }
};
window.buscarTCGdexNome = function() {
    const rawValue = document.getElementById('tcgdex-name').value.trim();
    if (!rawValue) return;
    
    // Limpa o campo de coleção para evitar conflitos
    document.getElementById('tcgdex-set').value = '';

    let nome = rawValue;
    let numeroBuscado = null;

    // LÓGICA DE SEPARAÇÃO: Verifica se o usuário digitou um número no final (ex: "Luxray 46")
    const partes = rawValue.split(' ');
    if (partes.length > 1) {
        const ultimoTermo = partes[partes.length - 1];
        
        // Se o último termo contém pelo menos um dígito (pega casos como "46", "046" ou "TG04")
        if (/\d/.test(ultimoTermo)) {
            numeroBuscado = ultimoTermo; // Guarda o número
            partes.pop(); // Remove o número do array de palavras
            nome = partes.join(' '); // Junta o resto para formar o nome do Pokémon
        }
    }

    // Passamos o nome para a API e o número para filtrar internamente
    buscarDadosTCGdex(`cards?name=${nome}`, false, numeroBuscado);
};

// Adicionamos o terceiro parâmetro "numeroFiltro" (por padrão é null)
async function buscarDadosTCGdex(endpoint, isSetInfo, numeroFiltro = null) {
    const resultsDiv = document.getElementById('tcgdex-results');
    const loadingDiv = document.getElementById('tcgdex-loading');
    
    resultsDiv.innerHTML = '';
    loadingDiv.classList.remove('hidden');

    try {
        const promessas = tcgdexIdiomas.map(async (idioma) => {
            try {
                const response = await fetch(`https://api.tcgdex.net/v2/${idioma.codigo}/${endpoint}`);
                if (!response.ok) return [];
                const dados = await response.json();
                
                let listaCartas = isSetInfo ? dados.cards : dados;

                // ==========================================
                // APLICAÇÃO DO FILTRO DE NÚMERO
                // ==========================================
                if (numeroFiltro && !isSetInfo) {
                    listaCartas = listaCartas.filter(carta => {
                        if (!carta.localId) return false;
                        
                        // Removemos os zeros à esquerda e transformamos em minúscula para a busca ser à prova de falhas
                        const localIdFormatado = carta.localId.toString().toLowerCase().replace(/^0+/, '');
                        const filtroFormatado = numeroFiltro.toLowerCase().replace(/^0+/, '');
                        
                        // Retorna true se o número for exato (ex: 46 == 46) ou se fizer parte do código (ex: TG04 contém 4)
                        return localIdFormatado === filtroFormatado || localIdFormatado.includes(filtroFormatado);
                    });
                }

                return listaCartas.map(carta => ({ ...carta, idiomaObj: idioma }));
            } catch (error) {
                return [];
            }
        });

        const resultadosTratados = await Promise.all(promessas);
        renderizarResultadosTCGdex(resultadosTratados.flat());
    } catch (error) {
        loadingDiv.classList.add('hidden');
        resultsDiv.innerHTML = '<p class="text-rose-500 col-span-full text-center py-8">Erro na comunicação com a API.</p>';
    }
}

function renderizarResultadosTCGdex(todasAsCartas) {
    const resultsDiv = document.getElementById('tcgdex-results');
    document.getElementById('tcgdex-loading').classList.add('hidden');

    if (todasAsCartas.length === 0) {
        resultsDiv.innerHTML = '<p class="text-slate-500 col-span-full text-center py-8">Nenhuma carta encontrada.</p>';
        return;
    }

    todasAsCartas.forEach(carta => {
        const imgUrl = carta.image ? `${carta.image}/low.webp` : 'https://via.placeholder.com/240x330?text=Sem+Imagem';
        const imgHighUrl = carta.image ? `${carta.image}/high.png` : '';
        const { label, color } = carta.idiomaObj;
        
        // -----------------------------------------------------------
        // A MÁGICA ACONTECE AQUI:
        // O ID de toda carta na TCGdex segue o padrão "setId-numero" (Ex: "sv4pt5-24").
        // Dividimos a string pelo "-" e usamos a primeira parte para buscar o nome no nosso dicionário.
        // -----------------------------------------------------------
        const setId = carta.id ? carta.id.split('-')[0] : '';
        const nomeColecao = tcgdexSetsData[setId] || 'Promo / Desconhecida';
        
        const cardElement = document.createElement('div');
        cardElement.className = 'flex flex-col gap-2 items-center bg-slate-900/40 p-2 rounded-2xl border border-slate-800 hover:border-sky-500/50 transition cursor-pointer group';
        
        cardElement.innerHTML = `
            <div class="relative w-full aspect-[3/4] rounded-xl overflow-hidden shadow-lg">
                <span class="absolute top-2 right-2 px-1.5 py-0.5 text-[9px] font-black rounded backdrop-blur-md z-20 ${color}">
                    ${label}
                </span>
                
                <div class="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition duration-300 flex flex-col items-center justify-center z-10">
                    <div class="w-10 h-10 bg-sky-500 rounded-full flex items-center justify-center text-slate-950 shadow-lg shadow-sky-500/40 transform scale-75 group-hover:scale-100 transition">
                        <i class="fa-solid fa-plus text-xl"></i>
                    </div>
                    <p class="text-[10px] text-white font-bold mt-2 uppercase tracking-wide">Importar</p>
                </div>

                <img src="${imgUrl}" alt="${carta.name}" class="w-full h-full object-cover">
            </div>
            
            <div class="w-full px-1 text-center">
                <p class="text-[10px] font-bold text-slate-200 truncate" title="${carta.name}">${carta.name}</p>
                <p class="text-[9px] font-mono text-slate-500 truncate" title="${nomeColecao}">${nomeColecao} #${carta.localId || '0'}</p>
            </div>
        `;

        // Agora o nomeColecao alimenta o campo corretamente
        cardElement.onclick = () => {
            document.querySelector("#new-card-name").value = carta.name;
            document.querySelector("#new-card-col").value = nomeColecao;
            document.querySelector("#new-card-num").value = carta.localId || '0';
            document.querySelector("#new-card-img").value = imgHighUrl;
            
            document.querySelector("#add-card-modal").classList.remove("hidden");
            document.querySelector("#add-card-modal").classList.add("flex");
        };

        resultsDiv.appendChild(cardElement);
    });
}
// --- LÓGICA DE COLEÇÕES PERSONALIZADAS ---

async function openCustomColModal(cardId) {
    const select = document.querySelector("#select-custom-col");
    // Carrega as coleções personalizadas existentes
    const snap = await getDocs(collection(db, "artifacts", firebaseConfig.appId, "users", state.user.uid, "custom_collections"));
    
    select.innerHTML = '<option value="">Selecione uma existente...</option>';
    snap.forEach(doc => {
        const opt = document.createElement("option");
        opt.value = doc.id;
        opt.textContent = doc.data().name;
        select.appendChild(opt);
    });

    document.querySelector("#custom-col-modal").classList.remove("hidden");
    document.querySelector("#custom-col-modal").classList.add("flex");
    
    document.querySelector("#btn-save-custom-col").onclick = () => {
        const colName = document.querySelector("#new-custom-col-name").value;
        const colId = select.value || colName.replace(/\s/g, '').toLowerCase();
        adicionarCartaACollection(colId, colName, cardId);
    };
}

async function adicionarCartaACollection(colId, colName, cardId) {
    if (!state.user) return;
    
    const colRef = doc(db, "artifacts", firebaseConfig.appId, "users", state.user.uid, "custom_collections", colId);
    
    // Salva o nome da coleção e adiciona o cardId ao array de cartas
    await setDoc(colRef, {
        name: colName,
        cards: arrayUnion(cardId) // Requer importar arrayUnion do Firestore
    }, { merge: true });

    document.querySelector("#custom-col-modal").classList.add("hidden");
    alert("Adicionado à coleção " + colName);
}

// Lembre-se de importar arrayUnion no topo do script.js:
// import { ..., arrayUnion } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";