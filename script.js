const PIECES = {
  wK:'♔',wQ:'♕',wR:'♖',wB:'♗',wN:'♘',wP:'♙',
  bK:'♚',bQ:'♛',bR:'♜',bB:'♝',bN:'♞',bP:'♟'
};

const initBoard = [
  ['bR','bN','bB','bQ','bK','bB','bN','bR'],
  ['bP','bP','bP','bP','bP','bP','bP','bP'],
  [null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null],
  ['wP','wP','wP','wP','wP','wP','wP','wP'],
  ['wR','wN','wB','wQ','wK','wB','wN','wR'],
];

let board = JSON.parse(JSON.stringify(initBoard));
let selected = null;
let legalSquares = [];
let turn = 'w';
let moveHistory = [];
let lastFrom = null, lastTo = null;
let flipped = false;
let blunders = 0;
let moveCount = 0;
let sidebarOpen = 'coach';

const coachMessages = [
  "Good move! Control the center early — it gives your pieces more room to operate.",
  "Nice! Developing your knights before bishops is generally a solid opening principle.",
  "Be careful — your king isn't castled yet. Consider securing king safety soon!",
  "Great piece activity! Look for tactics like forks and pins in this position.",
  "Excellent! Your pieces are well-coordinated. Keep up the pressure!",
  "Consider the Sicilian Defense next time — it's very sharp and leads to dynamic play.",
  "Watch out for back-rank weaknesses. Make sure your rooks protect each other.",
  "Strong move! The initiative is with you — keep attacking systematically.",
];

const bestMoves = ['e2-e4','d2-d4','g1-f3','f1-c4','c2-c3','e1-g1','d1-h5','f1-e1'];

function getLegalMoves(r,c,b,t){
  const piece = b[r][c];
  if(!piece||piece[0]!==t)return[];
  const moves=[];
  const type=piece[1];
  const isEnemy=(rr,cc)=>b[rr]&&b[rr][cc]&&b[rr][cc][0]!==t;
  const isEmpty=(rr,cc)=>b[rr]&&b[rr][cc]===null;
  const addIf=(rr,cc)=>{if(rr>=0&&rr<8&&cc>=0&&cc<8&&(!b[rr][cc]||isEnemy(rr,cc)))moves.push([rr,cc]);};
  const slide=(dr,dc)=>{let rr=r+dr,cc=c+dc;while(rr>=0&&rr<8&&cc>=0&&cc<8){if(b[rr][cc]){if(isEnemy(rr,cc))moves.push([rr,cc]);break;}moves.push([rr,cc]);rr+=dr;cc+=dc;}};
  if(type==='P'){
    const dir=t==='w'?-1:1;
    if(isEmpty(r+dir,c))moves.push([r+dir,c]);
    if((t==='w'&&r===6||t==='b'&&r===1)&&isEmpty(r+dir,c)&&isEmpty(r+2*dir,c))moves.push([r+2*dir,c]);
    if(isEnemy(r+dir,c-1))moves.push([r+dir,c-1]);
    if(isEnemy(r+dir,c+1))moves.push([r+dir,c+1]);
  }else if(type==='N'){[[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(([dr,dc])=>addIf(r+dr,c+dc));}
  else if(type==='B'){[[-1,-1],[-1,1],[1,-1],[1,1]].forEach(([dr,dc])=>slide(dr,dc));}
  else if(type==='R'){[[-1,0],[1,0],[0,-1],[0,1]].forEach(([dr,dc])=>slide(dr,dc));}
  else if(type==='Q'){[[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]].forEach(([dr,dc])=>slide(dr,dc));}
  else if(type==='K'){[[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]].forEach(([dr,dc])=>addIf(r+dr,c+dc));}
  return moves;
}

function renderBoard(){
  const el=document.getElementById('board');
  if(!el)return;
  let html='';
  for(let r=0;r<8;r++){
    for(let c=0;c<8;c++){
      const dr=flipped?7-r:r;const dc=flipped?7-c:c;
      const isLight=(dr+dc)%2===0;
      const piece=board[dr][dc];
      const isSelected=selected&&selected[0]===dr&&selected[1]===dc;
      const isLegal=legalSquares.some(([lr,lc])=>lr===dr&&lc===dc);
      const isLastFrom=lastFrom&&lastFrom[0]===dr&&lastFrom[1]===dc;
      const isLastTo=lastTo&&lastTo[0]===dr&&lastTo[1]===dc;
      const isOccupied=isLegal&&piece;
      let cls=isLight?'light':'dark';
      if(isSelected)cls+=' selected';
      else if(isLastFrom)cls+=' last-move-from';
      else if(isLastTo)cls+=' last-move-to';
      if(isLegal)cls+=isOccupied?' legal-move occupied':' legal-move';
      html+=`<div class="sq ${cls}" data-r="${dr}" data-c="${dc}" onclick="clickSq(${dr},${dc})">${piece?`<span class="piece">${PIECES[piece]}</span>`:''}</div>`;
    }
  }
  el.innerHTML=html;
}

function clickSq(r,c){
  const piece=board[r][c];
  if(selected){
    const [sr,sc]=selected;
    const isLegal=legalSquares.some(([lr,lc])=>lr===r&&lc===c);
    if(isLegal){
      makeMove(sr,sc,r,c);
      return;
    }
  }
  if(piece&&piece[0]===turn){
    selected=[r,c];
    legalSquares=getLegalMoves(r,c,board,turn);
  }else{selected=null;legalSquares=[];}
  renderBoard();
}

function makeMove(fr,fc,tr,tc,isAI=false){
  const piece=board[fr][fc];
  board[tr][tc]=board[fr][fc];
  board[fr][fc]=null;
  if(piece==='wP'&&tr===0)board[tr][tc]='wQ';
  if(piece==='bP'&&tr===7)board[tr][tc]='bQ';
  lastFrom=[fr,fc];lastTo=[tr,tc];
  selected=null;legalSquares=[];

  const files='abcdefgh';
  const moveStr=`${piece[1]}${files[fc]}${7-fr+1}-${files[tc]}${7-tr+1}`;
  moveHistory.push({piece,from:[fr,fc],to:[tr,tc],notation:moveStr,color:turn});
  moveCount++;

  document.getElementById('moves-count').textContent=Math.floor(moveCount/2+.5);

  const isBlunder=Math.random()<.08;
  if(isBlunder&&!isAI){blunders++;document.getElementById('blunder-count').textContent=blunders;}

  const acc=Math.max(70,100-blunders*8-Math.floor(Math.random()*5));
  document.getElementById('accuracy-disp').textContent=acc+'%';

  const evalShift=Math.random()*.4-.2;
  const evalVal=50+evalShift*100;
  document.getElementById('eval-fill').style.width=Math.max(20,Math.min(80,evalVal))+'%';
  document.getElementById('eval-text').textContent=(evalShift>0?'+':'')+evalShift.toFixed(1);

  document.getElementById('best-move-display').textContent='Best: '+bestMoves[moveCount%bestMoves.length];
  document.getElementById('coach-msg').textContent=coachMessages[moveCount%coachMessages.length];

  renderMoveList();

  turn=turn==='w'?'b':'w';
  renderBoard();

  if(!isAI&&turn==='b'){
    setTimeout(()=>aiMove(),600);
  }
}

function aiMove(){
  const aiMoves=[];
  for(let r=0;r<8;r++)for(let c=0;c<8;c++){
    if(board[r][c]&&board[r][c][0]==='b'){
      const moves=getLegalMoves(r,c,board,'b');
      moves.forEach(([tr,tc])=>aiMoves.push([r,c,tr,tc]));
    }
  }
  if(!aiMoves.length)return;
  const [fr,fc,tr,tc]=aiMoves[Math.floor(Math.random()*aiMoves.length)];
  makeMove(fr,fc,tr,tc,true);
}

function renderMoveList(){
  const container=document.getElementById('move-list-container');
  const empty=document.getElementById('move-list-empty');
  if(!moveHistory.length){empty.style.display='block';return;}
  empty.style.display='none';
  let html='';
  for(let i=0;i<moveHistory.length;i+=2){
    const w=moveHistory[i];
    const b=moveHistory[i+1];
    html+=`<div class="move-row"><span class="move-num">${i/2+1}.</span><span class="move-cell${i===moveHistory.length-1||i===moveHistory.length-2?' current':''}">${w.notation}</span>${b?`<span class="move-cell${i+1===moveHistory.length-1?' current':''}">${b.notation}</span>`:''}</div>`;
  }
  container.innerHTML=html;
}

function setSidebarTab(tab,el){
  sidebarOpen=tab;
  document.querySelectorAll('.sidebar-tab').forEach(t=>t.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('sidebar-coach').style.display=tab==='coach'?'block':'none';
  document.getElementById('sidebar-moves').style.display=tab==='moves'?'block':'none';
}

function undoMove(){
  if(moveHistory.length<2){showToast('Nothing to undo!');return;}
  moveHistory.pop();moveHistory.pop();
  board=JSON.parse(JSON.stringify(initBoard));
  moveHistory.forEach(m=>{board[m.to[0]][m.to[1]]=board[m.from[0]][m.from[1]];board[m.from[0]][m.from[1]]=null;});
  turn='w';selected=null;legalSquares=[];lastFrom=null;lastTo=null;
  renderBoard();renderMoveList();
  showToast('Move undone');
}

function showHint(){
  const hint=bestMoves[moveCount%bestMoves.length];
  document.getElementById('coach-msg').textContent=`💡 Hint: Try ${hint} — this controls key squares!`;
  setSidebarTab('coach',document.querySelectorAll('.sidebar-tab')[0]);
  showToast('Hint shown in AI Coach!');
}

function flipBoard(){flipped=!flipped;renderBoard();}
function resetGame(){board=JSON.parse(JSON.stringify(initBoard));selected=null;legalSquares=[];turn='w';moveHistory=[];lastFrom=null;lastTo=null;blunders=0;moveCount=0;document.getElementById('moves-count').textContent='0';document.getElementById('blunder-count').textContent='0';document.getElementById('accuracy-disp').textContent='—';document.getElementById('eval-fill').style.width='50%';document.getElementById('eval-text').textContent='0.0';document.getElementById('best-move-display').textContent='Make a move first';document.getElementById('coach-msg').textContent='New game! Make your first move.';renderBoard();renderMoveList();showToast('New game started!');}

function selectTime(el,mode){document.querySelectorAll('.diff-chip').forEach(c=>{if(['bullet','blitz','rapid'].includes(c.dataset.mode))c.classList.remove('active')});el.dataset.mode=mode;el.classList.add('active');const times={bullet:'1:00',blitz:'5:00',rapid:'10:00'};document.getElementById('timer-white').textContent=times[mode]||'5:00';document.getElementById('timer-black').textContent=times[mode]||'5:00';showToast(mode.charAt(0).toUpperCase()+mode.slice(1)+' selected');}
function selectDiff(el,lvl){document.querySelectorAll('.diff-chip').forEach(c=>{if(c.dataset.diff)c.classList.remove('active')});el.dataset.diff=lvl;el.classList.add('active');showToast('Difficulty set to '+el.textContent);}
function startGame(){}

function showPage(p){
  document.querySelectorAll('.page').forEach(x=>x.classList.remove('active'));
  document.getElementById('page-'+p).classList.add('active');
  document.querySelectorAll('.nav-tab').forEach((t,i)=>{t.classList.toggle('active',['dashboard','game','analysis'][i]===p);});
  if(p==='game')renderBoard();
  if(p==='analysis')renderEvalChart();
}

function renderMiniBoard(){
  const el=document.getElementById('mini-board');
  if(!el)return;
  let html='';
  for(let r=0;r<8;r++)for(let c=0;c<8;c++){
    const isLight=(r+c)%2===0;
    const p=initBoard[r][c];
    html+=`<div class="mini-sq ${isLight?'light':'dark'}">${p?PIECES[p]:''}</div>`;
  }
  el.innerHTML=html;
}

function renderEvalChart(){
  const el=document.getElementById('eval-chart');
  if(!el)return;
  const vals=[50,52,50,55,48,60,55,62,58,65,60,70,65,72,68,75,70,78,72,80,75,78,80,82,78,83,80,85,82,88];
  const max=Math.max(...vals);
  el.innerHTML=vals.map((v,i)=>{
    const isGood=v>65;
    return`<div class="mini-bar" style="height:${Math.round(v/max*60)}px;background:${isGood?'var(--success)':'var(--warn)'}"></div>`;
  }).join('');
  renderMiniBoard();
}

function showToast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200);}

// Initialize
renderBoard();
renderEvalChart(); script.js





// Login function
async function loginUser(email, password) {
  try {
    const response = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    
    if (data.success) {
      localStorage.setItem('token', data.token);
      console.log('✅ Login successful!', data.user);
      loadDashboard(); // Load user stats
    }
  } catch (error) {
    console.error('Login failed:', error);
  }
}

// Load dashboard
async function loadDashboard() {
  const token = localStorage.getItem('token');
  if (!token) return;
  
  const response = await fetch('http://localhost:3001/api/users/dashboard', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  
  // Update UI
  document.querySelector('.rating-num').textContent = data.user.elo_rating;
  document.querySelector('.xp-pill').textContent = `⚡ ${data.user.total_xp} XP`;
  // ... more UI updates
}

// Save game (resetGame() me call kar)
async function saveGameData() {
  const token = localStorage.getItem('token');
  await fetch('http://localhost:3001/api/games', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      moves: moveHistory,
      opponent: 'Stockfish AI',
      difficulty: 'Medium',
      result: 'win',
      accuracy: 87,
      blunders: blunders,
      totalMoves: moveCount
    })
  });
} 



// ===== BACKEND INTEGRATION (FIXED) =====
let currentUser = null;

// Auto login
window.addEventListener('load', () => {
  const token = localStorage.getItem('token');
  if (token) loadDashboard();
});

// LOGIN
async function loginUser() {
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  try {
    showToast('Logging in...');

    const res = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    // ✅ FIXED CONDITION
    if (data.token) {
      localStorage.setItem('token', data.token);
      currentUser = data.user;

      showToast(`Welcome ${data.user.username} 🎉`);
      loadDashboard();

      // remove login form
      const form = document.querySelector('.dash-hero')?.nextElementSibling;
      if (form) form.remove();
    } else {
      showToast(data.error || 'Login failed');
    }

  } catch (err) {
    console.error(err);
    showToast('Server error');
  }
}

// REGISTER
async function registerUser() {
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const username = prompt('Enter username');

  if (!username) return showToast('Username required');

  try {
    showToast('Creating account...');

    const res = await fetch('http://localhost:3001/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });

    const data = await res.json();

    if (data.user || data.token) {
      showToast('Account created! Now login.');
    } else {
      showToast(data.error || 'Register failed');
    }

  } catch (err) {
    console.error(err);
    showToast('Server error');
  }
}

// LOAD DASHBOARD
async function loadDashboard() {
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    const res = await fetch('http://localhost:3001/api/users/dashboard', {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();

    if (!data.user) return;

    currentUser = data.user;

    document.querySelector('.dash-info h2').textContent = data.user.username;
    document.querySelector('.rating-num').textContent = data.user.elo_rating || 800;
    document.querySelector('.xp-pill').textContent = `⚡ ${data.user.total_xp || 0} XP`;

  } catch (err) {
    console.error(err);
  }
}

// SAVE GAME
async function saveGameData(result = 'win') {
  const token = localStorage.getItem('token');

  if (!token) {
    showToast('Login to save progress!');
    return;
  }

  try {
    await fetch('http://localhost:3001/api/games', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        moves: moveHistory,
        opponent: 'AI',
        difficulty: 'Medium',
        result,
        accuracy: Math.max(70, 100 - blunders * 8),
        blunders,
        total_moves: moveCount
      })
    });

    showToast('Game saved 🎮');

  } catch (err) {
    console.error(err);
  }
}

// SHOW LOGIN UI
function showLoginForm() {
  const html = `
    <div style="background:var(--bg2);padding:20px;border-radius:10px;margin:20px 0">
      <h3>Login</h3>
      <input id="login-email" placeholder="Email" />
      <input id="login-password" type="password" placeholder="Password" />
      <button onclick="loginUser()">Login</button>
      <button onclick="registerUser()">Register</button>
    </div>
  `;

  document.querySelector('.dash-hero')
    ?.insertAdjacentHTML('afterend', html);
}

// INIT
showPage('dashboard');

setTimeout(() => {
  if (!localStorage.getItem('token')) {
    showLoginForm();
  }
}, 500);

// ===== END FIXED =====