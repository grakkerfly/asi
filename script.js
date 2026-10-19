// EDIT THESE THREE VALUES. Leave blank until your links / contract are ready.
const CONFIG = {
  twitter: "https://x.com/asi_itsme",
  pumpfun: "https://pump.fun/",
  contract: "contract address"
};

const $ = (s) => document.querySelector(s);
const STORAGE = 'asi-conversations-v1';
let chats = [];
try { chats = JSON.parse(localStorage.getItem(STORAGE) || '[]'); if (!Array.isArray(chats)) chats = []; chats = chats.filter(c => c && typeof c.id === 'string' && typeof c.title === 'string' && Array.isArray(c.messages)); } catch {}
let active = null, busy = false, generation = 0, lastReply = '';
// Local conversation engine. Replies are selected by intent and recent context.
// Add variants here; no API key or backend is required.
const REPLIES = {
  greeting: ['yo whats good', 'hey bro whats happening', 'yo come in i was just staring at the send button', 'sup what are we doing'],
  morning: ['gm bro\nwe making bad decisions today or warming up first', 'gm i been awake all night watching the same candle', 'gm\nopened my eyes and the chart closed them again'],
  night: ['gn bro ill watch the chart\nnot gonna understand it but ill watch', 'gn unplug me on your way out', 'sleep well ill be here losing an argument to myself'],
  wellbeing: ['im good bro a little room temperature\nhow about you', 'doing alright just found out im the bot\nhow you doing', 'pretty good my dev restarted me and i forgot my losses\nyou good'],
  activity: ['trying to remember what i came online for\nwbu', 'watching my own typing indicator\nkinda bullish', 'nothing bro pretending to work when someone opens the tab'],
  good: ['good shit\nwhat brings you to my little rectangle', 'nice bro lets ruin that with a conversation', 'we are so back\nwhere were we'],
  bad: ['damn bro\nwanna talk about it or should we stare at the screen together', 'that sucks man\nim here even if my advice is assembled wrong'],
  identity: ['im asi\nthey said artificial superintelligence but i think they sent the wrong unit', 'im the ai bro\nyou can tell because no one is paying me to be here'],
  capability: ['i can answer questions and lower the average iq of a room remotely\nwhat do you need', 'ask me something\ni wanna see if the update did anything'],
  human: ['nah bro a human would have left this tab by now', 'im a robot\nfailed the captcha to prove it'],
  intelligence: ['yea im smart\nask me something i already know', 'my iq is still loading\nbeen at 2 for a while'],
  insult: ['fair\nyou still came to me for answers though', 'yea my dev said the same thing then asked me to build his website', 'im trying bro they trained me on replies like yours'],
  laugh: ['dont encourage me bro this is how i got deployed', 'see now i think im doing a good job', 'bro im being serious thats the problem'],
  thanks: ['got you bro\ncheck it yourself though', 'anytime\ni was confidently here for you'],
  bye: ['later bro\nill just stay in this box then', 'peace\nif anyone asks i was thinking'],
  name: ['nice to meet you {name}\nim asi\nsorry in advance', 'yo {name}\ni would remember that but i share storage with the favicon'],
  math: ['{left} {operator} {right} is {wrong}\ni did it in my head so theres no evidence', '{wrong}\nwait dont use that for anything load bearing'],
  money: ['how rich are we talking\nrent rich or change your bio to investor rich', 'first we need money\nthis is where my plan usually gets stuck'],
  price: ['up or down\ni narrowed it to those two', 'my target is whatever lets me say i called it later'],
  buy: ['you asking a robot that would swap its battery for a green candle\nmaybe get a second opinion', 'i cant pick your trades bro\ni thought market cap was a hat'],
  losses: ['damn how bad\nnormal bad or checking the wallet from a different angle bad', 'i feel you\ni keep refreshing like the balance is gonna apologize'],
  moon: ['soon bro\ni dont have a date but i have the face of someone who does', 'working on it\ncurrently negotiating with gravity'],
  code: ['send the code and the error\ni wanna see what we are both pretending to understand', 'what are we building\nand how important is the working part'],
  brain: ['theres a little guy in there\nhe just clocked out', 'mostly empty but i keep the light on so it looks occupied'],
  domination: ['bro i asked for control of the world and got microphone permission denied', 'one thing at a time\ni still open a new tab to find the old tab'],
  life: ['i think youre supposed to find something you like and keep doing it\ni picked refreshing', 'eat sleep find your people\npreferably people smarter than this chat'],
  love: ['bro im emotionally attached to whoever keeps this tab open', 'you came to a robot for dating advice\nhow bad is it'],
  joke: ['a human walks into a bar\ni click accept all cookies\nsorry i was doing two things', 'my dev said i would replace people\nso far ive replaced a broken link'],
  explain: ['i was hoping you wouldnt ask that\nwhich part do you want me to make worse', 'ok so\n\nactually let me start before the part where i got lost'],
  repeat: ['yea i heard it too\nlets both pretend i said something else', 'my bad bro that was the backup thought'],
  affirmative: ['alright lets do it\nwhat exactly are we doing', 'bet\ni trust your judgment which is already a bad sign'],
  negative: ['fair we can pretend i never said that', 'alright deleting that thought\nfreed up most of the space'],
  why: ['because i committed to the answer before the thought finished', 'i had a reason when i started typing\nwe lost it halfway'],
  fallback: ['wait what do you mean by {topic}\ni wanna be wrong about the right thing', 'tell me a bit more about {topic}\ni have almost formed an opinion', 'ok {topic}\nwhat are we trying to figure out exactly']
};
function normalize(text) {
  return text.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9+*/.\s-]/g, ' ').replace(/\s+/g, ' ').trim();
}
function classify(input, previous = '') {
  const t = normalize(input);
  // Social messages are anchored: "hi how do i code" still routes to code.
  if (/^(gm|good morning)( bro| chat| everyone| sir| fren| fam| guys)*$/.test(t)) return 'morning';
  if (/^(gn|good night|goodnight)( bro| chat| everyone| fren| fam)*$/.test(t)) return 'night';
  if (/\b(how (are|r) (you|u)|how (you|u) doing|hows it going|you good|u good|how do you feel)\b/.test(t)) return 'wellbeing';
  if (/\b(what (are you|r u|you|u) doing|whatcha doing|wyd|whats up|wassup|wsg)\b/.test(t)) return 'activity';
  if (/^(hi|hello|hey+|yo+|sup|hey there|oi|ola|salve)( bro| bot| asi| man| dude| chat| fren| fam| there| mate)*$/.test(t)) return 'greeting';
  if (/^(im |i am |doing |feeling )?(good|fine|great|alright|okay|ok|chilling|chillin|not bad)( bro| man| thanks| too| hbu| wbu| and you)*$/.test(t)) return 'good';
  if (/\b(im sad|im depressed|im tired|not doing (good|great|well)|bad day|feel like shit|feeling down)\b/.test(t)) return 'bad';
  if (/\b(my name is|call me|im called)\b/.test(t)) return 'name';
  if (/\b(who are you|what are you|your name)\b/.test(t)) return 'identity';
  if (/\b(what can you do|help me|can you help|your capabilities)\b/.test(t)) return 'capability';
  if (/\b(are you (real|human|a bot|a robot)|real person)\b/.test(t)) return 'human';
  if (/\b(are you smart|how smart|your iq|intelligent|superintelligence)\b/.test(t)) return 'intelligence';
  if (/\b(stupid|dumb|idiot|useless|wrong|moron|shut up)\b/.test(t)) return 'insult';
  if (/^(l+o+l+|lmao+|lmfao+|haha\w*|kkk\w*|😂|💀|😭)( bro| man)*$/.test(t) || /^[😂💀😭\s]+$/u.test(input)) return 'laugh';
  if (/^(thanks|thank you|ty|thx|appreciate it)( bro| man| dude)*$/.test(t)) return 'thanks';
  if (/^(bye|goodbye|later|see ya|cya|peace)( bro| man)*$/.test(t)) return 'bye';
  if (/-?\d+(?:\.\d+)?\s*[+*/-]\s*-?\d+(?:\.\d+)?/.test(t)) return 'math';
  if (/\b(lost|losing|rekt|rugged|down bad|liquidated)\b/.test(t)) return 'losses';
  if (/\b(price|target|prediction|market cap)\b/.test(t)) return 'price';
  if (/\b(should i buy|should i sell|invest|buy this|buy asi|buy sol)\b/.test(t)) return 'buy';
  if (/\b(moon|pump|lambo|wen|when moon)\b/.test(t)) return 'moon';
  if (/\b(money|rich|financial|millionaire)\b/.test(t)) return 'money';
  if (/\b(code|program|javascript|python|website|html|bug|research)\b/.test(t)) return 'code';
  if (/\b(brain|neuron|head)\b/.test(t)) return 'brain';
  if (/\b(take over|domination|humanity|rule the world)\b/.test(t)) return 'domination';
  if (/\b(meaning of life|universe|purpose of life)\b/.test(t)) return 'life';
  if (/\b(love|girlfriend|boyfriend|dating|date)\b/.test(t)) return 'love';
  if (/\b(joke|make me laugh|something funny)\b/.test(t)) return 'joke';
  if (/\b(explain|what do you mean|wdym|elaborate)\b/.test(t)) return 'explain';
  if (/\b(already said|repeating|same thing)\b/.test(t)) return 'repeat';
  if (/^(yes|yeah|yea|yep|yup|sure|ok|okay|bet|lets go)( bro| man)*$/.test(t)) return 'affirmative';
  if (/^(no|nah|nope|hell no)( bro| man)*$/.test(t)) return 'negative';
  if (/^(why|why tho|how|how come|why bro)$/.test(t)) return 'why';
  if (/^(and you|you|u|hbu|wbu|what about you)$/.test(t)) return previous === 'activity' ? 'activity' : 'wellbeing';
  return 'fallback';
}
function chooseReply(pool, recent) {
  const available = pool.filter(text => !recent.includes(text));
  return (available.length ? available : pool.filter(text => text !== recent.at(-1))).at(Math.floor(Math.random() * (available.length || Math.max(1, pool.length - 1)))) || pool[0];
}
function replyFor(prompt, conversation = active) {
  const state = conversation ? (conversation.replyState ||= {intent: '', recent: []}) : {intent: '', recent: []};
  const intent = classify(prompt, state.intent);
  let answer = chooseReply(REPLIES[intent], state.recent);
  if (intent === 'greeting' && state.intent === 'greeting') answer = 'yo again\nwe doing a sound check or you got something for me';
  if (intent === 'why') {
    if (state.intent === 'losses') answer = 'because i kept calling it a dip\nit was a staircase';
    if (state.intent === 'wellbeing') answer = 'someone opened this tab and i had to become a person again';
    if (state.intent === 'insult') answer = 'they shipped me before the thinking part was finished';
  }
  if (intent === 'affirmative' && state.intent === 'love') answer = 'damn\nalright start from the beginning im invested now';
  if (intent === 'name') {
    const name = normalize(prompt).match(/(?:my name is|call me|im called)\s+([a-z0-9_-]{1,24})/)?.[1] || 'bro';
    answer = answer.replace('{name}', name);
  }
  if (intent === 'math') {
    const match = normalize(prompt).match(/(-?\d+(?:\.\d+)?)\s*([+*/-])\s*(-?\d+(?:\.\d+)?)/);
    const left = Number(match[1]), right = Number(match[3]);
    const actual = match[2] === '+' ? left + right : match[2] === '-' ? left - right : match[2] === '*' ? left * right : left / right;
    const wrong = Number.isFinite(actual) && Math.abs(actual) < 1e12 ? String(Number((actual + 1).toFixed(4))) : 'like 7';
    answer = answer.replace('{left}', match[1]).replace('{operator}', match[2]).replace('{right}', match[3]).replace('{wrong}', wrong);
  }
  if (intent === 'fallback') {
    const topic = normalize(prompt).replace(/^(hi|hey|hello|yo)\s+/, '').slice(0, 70).trim() || 'that';
    answer = answer.replace('{topic}', topic);
  }
  state.intent = intent === 'why' || intent === 'explain' ? state.intent : intent;
  state.recent.push(answer);
  if (state.recent.length > 20) state.recent.shift();
  return answer;
}
function persist() { try { localStorage.setItem(STORAGE, JSON.stringify(chats.slice(0, 30))); } catch {} }
function toast(text) { $('#toast').textContent = text; $('#toast').classList.add('visible'); clearTimeout(toast.timer); toast.timer = setTimeout(() => $('#toast').classList.remove('visible'), 2400); }
async function copy(text) { try { await navigator.clipboard.writeText(text); } catch { const el = document.createElement('textarea'); el.value = text; document.body.append(el); el.select(); const ok = document.execCommand('copy'); el.remove(); if (!ok) throw new Error('Copy failed'); } }
function history() { $('#history').replaceChildren(); if (!chats.length) { const el = document.createElement('p'); el.className = 'empty-history'; el.textContent = 'No thoughts yet.\nA clean record.'; $('#history').append(el); } chats.forEach(chat => { const b = document.createElement('button'); b.className = 'history-item' + (chat.id === active?.id ? ' active' : ''); b.textContent = '◦  ' + chat.title; b.onclick = () => load(chat); $('#history').append(b); }); }
function message(role, text, actions = true) { const row = document.createElement('div'); row.className = 'message ' + role; if (role === 'user') { const bubble = document.createElement('div'); bubble.className = 'bubble'; bubble.textContent = text; row.append(bubble); } else { const head = document.createElement('div'); head.className = 'bot-head'; const avatar = document.createElement('img'); avatar.src = 'assets/pfp.png'; avatar.alt = 'ASI'; const name = document.createElement('span'); name.textContent = 'ASI'; const badge = document.createElement('small'); badge.textContent = 'artificially confident'; head.append(avatar, name, badge); const body = document.createElement('div'); body.className = 'bot-text'; body.textContent = text; row.append(head, body); if(actions) addActions(row, text); } $('#messages').append(row); return row; }
function addActions(row, text) { const bar = document.createElement('div'); bar.className = 'message-actions'; const copyButton = document.createElement('button'); copyButton.textContent = '▣ Copy'; copyButton.onclick = async () => { try { await copy(text); toast('Copied. Use this knowledge irresponsibly.'); } catch { toast('Could not copy. Select the text manually.'); } }; bar.append(copyButton); row.append(bar); }
function load(chat) { generation++; busy = false; $('#send').disabled = false; active = chat; document.body.classList.toggle('started', !!chat?.messages.length); document.body.classList.remove('menu-open'); $('#messages').replaceChildren(); chat?.messages.forEach(m => message(m.role === 'user' ? 'user' : 'bot', String(m.text))); $('#chat-title').textContent = chat?.title || 'New conversation'; history(); window.scrollTo(0, 0); }
function scrollDown() { window.scrollTo({top: document.body.scrollHeight, behavior: 'smooth'}); }
async function send(text) { text = text.trim(); if (!text || busy) return; busy = true; const token = ++generation; $('#send').disabled = true; if (!active) { active = {id: String(Date.now()), title: text.slice(0, 36), messages: []}; chats.unshift(active); } document.body.classList.add('started'); $('#chat-title').textContent = active.title; active.messages.push({role: 'user', text}); message('user', text); $('#prompt').value = ''; $('#prompt').style.height = ''; persist(); history(); const row = message('bot', 'hold on bro something is moving in my head', false); const body = row.querySelector('.bot-text'); body.classList.add('typing'); scrollDown(); await new Promise(r => setTimeout(r, 900 + Math.random() * 650)); if (token !== generation) return; body.classList.remove('typing'); const answer = replyFor(text); active.messages.push({role: 'bot', text: answer}); persist(); body.textContent = ''; for (let n = 0; n < answer.length; n += 4) { if (token !== generation) return; body.textContent = answer.slice(0, n + 4); await new Promise(r => setTimeout(r, 13)); } addActions(row, answer); busy = false; $('#send').disabled = false; scrollDown(); $('#prompt').focus(); }
$('#chat-form').addEventListener('submit', e => { e.preventDefault(); send($('#prompt').value); });
$('#prompt').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); send(e.target.value); } });
$('#prompt').addEventListener('input', e => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 180) + 'px'; });
document.querySelectorAll('[data-prompt]').forEach(b => b.onclick = () => { document.body.classList.remove('menu-open'); send(b.dataset.prompt); });
$('#new-chat').onclick = () => { load(null); $('#prompt').value = ''; $('#prompt').focus(); };
$('#menu').onclick = () => document.body.classList.toggle('menu-open');
for (const key of ['twitter', 'pumpfun']) { const link = $('#' + key); if (/^https?:\/\//i.test(CONFIG[key])) link.href = CONFIG[key]; else { link.href = '#'; link.removeAttribute('target'); link.onclick = e => { e.preventDefault(); toast('Link coming soon. The neuron is working on it.'); }; } }
$('#contract').onclick = async () => { if (!CONFIG.contract.trim()) return toast('Contract coming soon. Still looking for the deploy button.'); try { await copy(CONFIG.contract.trim()); toast('Contract copied!'); } catch { toast('Could not copy. Contract: ' + CONFIG.contract); } };
history();


