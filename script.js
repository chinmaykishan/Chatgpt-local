// Local demo brain for ChatGPT-like behavior
const chatBox = document.getElementById("chat-box");
const input = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const clearBtn = document.getElementById("clear-btn");
const toggleSimulate = document.getElementById("toggle-simulate");

const STORAGE_KEY = "chatgpt_local_demo_v1";

function addMessage(text, sender, id=null) {
  const msg = document.createElement("div");
  msg.classList.add("message", sender);
  if (id) msg.dataset.id = id;
  msg.innerText = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
  return msg;
}

function saveHistory(history) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(history)); }
  catch(e) { console.warn("Could not save history", e); }
}

function loadHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch(e) {
    console.warn("Load error", e);
    return [];
  }
}

function pushToHistory(role, text) {
  const h = loadHistory();
  h.push({ role, text, ts: Date.now() });
  saveHistory(h);
}

const brain = [
  { match: /^(hi|hello|hey|yo)/i, reply: "Hello! How can I help you today?" },
  { match: /how are you/i, reply: "I'm a local demo — feeling bug-free! How about you?" },
  { match: /who (are|r) you/i, reply: "I'm your local ChatGPT demo — no cloud, no API." },
  { match: /project/i, reply: "Try making a To-do app, Weather app, Calculator, or connect this to the real OpenAI API later." },
  { match: /joke/i, reply: () => pick([
    "Why did the programmer quit his job? Because he didn't get arrays.",
    "I told my computer I needed a break — it replied: 'I'll sleep.'"
  ])},
  { match: /(time|date)/i, reply: () => new Date().toLocaleString() },
  { match: /(?:calc|calculate|what is|what's)\s+([0-9+\-*/().\s]+)$/i, reply: (m)=>{
    try {
      const expr = m[1].replace(/[^\d+\-*/().\s]/g, "");
      if (!/^[0-9+\-*/().\s]+$/.test(expr)) return "I can't calculate that.";
      const result = Function(`return (${expr})`)();
      return `${expr} = ${result}`;
    } catch {
      return "I couldn't calculate that.";
    }
  }},
  { match: /./, reply: null }
];

function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

function getLocalReply(text){
  for (const rule of brain){
    const m = text.match(rule.match);
    if (!m) continue;
    if (rule.reply === null) break;
    return typeof rule.reply === "function" ? rule.reply(m) : rule.reply;
  }
  return pick([
    "Interesting — tell me more.",
    "I don't have Internet in this demo. Try simpler questions!",
    "I can do math (try 'calc 20/4') or jokes (try 'joke')."
  ]);
}

function displayHistory() {
  chatBox.innerHTML = "";
  loadHistory().forEach(msg => addMessage(msg.text, msg.role));
}

async function handleSend(){
  const text = input.value.trim();
  if (!text) return;

  addMessage(text, "user");
  pushToHistory("user", text);
  input.value = "";

  const simulate = toggleSimulate.checked;
  const loading = addMessage(simulate ? "typing..." : "...", "bot");

  const replyPromise = new Promise(resolve => {
    const reply = getLocalReply(text);
    if (!simulate) return resolve(reply);
    const delay = Math.min(2000, 400 + reply.length * 20);
    setTimeout(()=>resolve(reply), delay);
  });

  const reply = await replyPromise;
  loading.remove();
  addMessage(reply, "bot");
  pushToHistory("bot", reply);
}

sendBtn.addEventListener("click", handleSend);
input.addEventListener("keydown", e => e.key==="Enter" && handleSend());
clearBtn.addEventListener("click", ()=>{
  localStorage.removeItem(STORAGE_KEY);
  displayHistory();
});
displayHistory();
