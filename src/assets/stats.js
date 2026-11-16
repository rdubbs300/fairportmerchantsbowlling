/* Fairport Merchants stats: standings, schedule, bowlers, teams, insights. Data: /data/league.json (updated weekly). */
(function(){
function main(D){
const M = D.meta, TN = D.teamnames;
const $ = s => document.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const tn = id => TN[String(id)] || ('Team ' + id);
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const fmtPts = v => (Math.round(v * 2) / 2).toString().replace(/\.5$/, '½').replace(/^0½$/, '½');
const pt = v => Number.isInteger(v) ? String(v) : v.toFixed(1);
const comma = v => Number(v).toLocaleString('en-US');
const ord = n => n + (['th','st','nd','rd'][(n % 100 - 20) % 10] || ['th','st','nd','rd'][n % 100] || 'th');
const store = {get(k){try{return localStorage.getItem(k)}catch(e){return null}}, set(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
const bySlug = {}; D.bowlers.forEach(b => bySlug[slug(b.n)] = b);
const teamById = {}; D.teams.forEach(t => teamById[t.id] = t);
const stand = {}; D.standings.forEach(s => stand[s.id] = s);
const tlink = id => `<a class="tl" href="#team-${id}">${esc(tn(id))}</a>`;
const blink = n => `<a class="tl" href="#bowler-${slug(n)}">${esc(n)}</a>`;



/* ---------------- STANDINGS ---------------- */
function viewStandings(){
  const half = M.week <= 14 ? 'First half · weeks 1–14' : 'Second half · weeks 15–28';
  const rows = D.standings.map(s => `<tr class="${s.pos===1?'lead1':''}">
    <td class="pos">${s.pos}</td><td class="team">${tlink(s.id)}</td>
    <td class="n"><b>${pt(s.won)}</b></td><td class="n">${pt(s.lost)}</td>
    <td class="n hide-sm">${comma(s.scr)}</td><td class="n">${comma(s.hcp)}</td>
    <td class="n hide-sm">${s.avg}</td><td class="n hide-sm">${s.hd}</td><td class="n">${s.nl}</td></tr>`).join('');
  const lastWeek = D.schedule.find(w => w.wk === M.week);
  const res = lastWeek ? lastWeek.m.map(m => matchRow(m, null)).join('') : '';
  return `
  <h2 class="sec">Standings <small>after week ${M.week} · ${half}</small></h2>
  <div class="card flush"><div class="scroll"><table class="sticky">
    <thead><tr><th>#</th><th>Team</th><th class="n">Won</th><th class="n">Lost</th><th class="n hide-sm">Scratch</th><th class="n">Hdcp pins</th><th class="n hide-sm">Avg</th><th class="n hide-sm">Hdcp</th><th class="n" title="Starting lane for week ${M.next}">Lane</th></tr></thead>
    <tbody>${rows}</tbody></table></div></div>
  <p class="note">Ties in won points break on total handicap pins. Team average and handicap are the four rostered bowlers' current figures carried into week ${M.next}. Lane is the starting lane for week ${M.next}${M.next_date ? ' (' + esc(M.next_date) + ')' : ''}.</p>

  <h2 class="sec">Week ${M.week} results <small>${esc(M.bowled)}${lastWeek && lastWeek.kind!=='Regular' ? ' · ' + esc(lastWeek.kind.toLowerCase()) : ''}</small></h2>
  <div class="card" id="wkres">${res}</div>

  <h2 class="sec">Leaders
    <span class="seg" id="lbseg"><button data-k="week" class="on">Week ${M.week}</button><button data-k="season">Season</button></span></h2>
  <div id="lbwrap"></div>
  <div class="grid g2" style="margin-top:12px">
    <div class="card"><h3 class="sub">Top 10 average</h3>${top10(D.leaders.avg10, x => x.v.toFixed(2), x => x.g + ' games')}</div>
    <div class="card"><h3 class="sub">Top 10 match points</h3>${top10(D.leaders.pts10, x => pt(x.v), x => x.a.toFixed(2) + ' avg')}
      ${D.leaders.pts_tied.length ? `<p class="note">Also on ${pt(D.leaders.pts10[9].v)}: ${D.leaders.pts_tied.map(esc).join(', ')}.</p>` : ''}</div>
  </div>
  <p class="note">Season lists need two thirds of the games bowled to date (${M.gate} of ${M.games_to_date}) and never include substitutes; weekly lists include everyone who bowled. Scratch takes priority: a bowler or team on a scratch list isn't repeated on that handicap list. Every scratch 300 is listed as it's thrown.</p>`;
}
function top10(list, val, sub){
  return `<ol class="lb">${list.map((x,i) => `<li><span class="r">${i+1}</span><span class="nm">${blink(x.n)}<small>${esc(x.t)} · ${sub(x)}</small></span><span class="v">${val(x)}</span></li>`).join('')}</ol>`;
}
function lbList(list, team){
  if (!list.length) return '<p class="muted small">—</p>';
  return `<ol class="lb">${list.map(x => `<li><span class="r">${x.r||''}</span><span class="nm">${team ? esc(x.n) : blink(x.n)}${!team && x.t ? `<small>${esc(x.t)}${x.wk ? ' · week ' + x.wk : ''}</small>` : ''}</span><span class="v">${x.v}</span></li>`).join('')}</ol>`;
}
function drawLeaders(k){
  const L = D.leaders[k];
  $('#lbwrap').innerHTML = `<div class="grid g2">${L.map(c => `<div class="card"><h3 class="sub">${c.title}</h3>
    <div class="lb-h">Scratch</div>${lbList(c.s, c.title.startsWith('Team'))}
    <div class="lb-h">Handicap</div>${lbList(c.h, c.title.startsWith('Team'))}</div>`).join('')}</div>`;
  document.querySelectorAll('#lbseg button').forEach(b => b.classList.toggle('on', b.dataset.k === k));
}
function matchRow(m, hl){
  const mark = hl && (m.a == hl || m.b == hl) ? ' hl' : '';
  if (m.ap == null) return `<div class="mrow two${mark}"><span class="ln">${m.l}</span><span>${tlink(m.a)}</span><span>${tlink(m.b)}</span></div>`;
  const aw = m.ap > m.bp, bw = m.bp > m.ap;
  return `<div class="mrow${mark}"><span class="ln">${m.l}</span><span>${tlink(m.a)}</span><span class="p ${aw?'win':''}">${pt(m.ap)}</span><span>${tlink(m.b)}</span><span class="p ${bw?'win':''}">${pt(m.bp)}</span></div>`;
}

/* ---------------- SCHEDULE ---------------- */
function viewSchedule(){
  const my = store.get('mt');
  const opts = `<option value="">All teams</option>` + D.teams.slice().sort((a,b)=>a.name.localeCompare(b.name)).map(t => `<option value="${t.id}" ${String(t.id)===my?'selected':''}>${esc(t.name)}</option>`).join('');
  return `<h2 class="sec">Schedule <small>${M.season} · ${M.night}s · practice 6:30 PM, competition 6:40 PM</small></h2>
  <div class="card" style="padding:10px"><select class="pick" id="myteam" aria-label="Highlight a team">${opts}</select></div>
  <div id="schedlist"></div>
  <p class="note">No bowling November 26, December 24 or December 31. Team points reset for the second half on week 15. Position-round pairings are set by the standings the week before; the lane rotation is fixed in advance. Later weeks are added as the schedule is posted.</p>`;
}
function drawSchedule(){
  const my = $('#myteam').value; store.set('mt', my);
  const card = w => {
    const isNext = w.wk === M.next;
    let body = '', st = '';
    if (w.st === 'done'){ body = w.m.map(m => matchRow(m, my)).join(''); st = 'results'; }
    else if (w.st === 'set'){ body = w.m.map(m => matchRow(m, my)).join(''); st = 'lanes set'; }
    else if (w.st === 'position' && w.pp){
      body = w.pp.map(p => `<div class="mrow two"><span class="ln">${p.l}</span><span>${ord(p.a)} place</span><span>${ord(p.b)} place</span></div>`).join('');
      st = 'by standings';
    } else { body = `<p class="muted small" style="margin:6px 0 0">${w.wk===29 ? 'Half champions bowl for the league title; all other teams bowl the year-end tournament.' : 'Matchups to come.'}</p>`; st = ''; }
    const mine = my && w.m.find(m => m.a==my || m.b==my);
    let line = '';
    if (mine){ const opp = mine.a==my ? mine.b : mine.a; line = ` · vs ${esc(tn(opp))} on ${mine.l}` + (mine.ap!=null ? ` · ${pt(mine.a==my?mine.ap:mine.bp)} pts` : ''); }
    const open = isNext || (my && w.st!=='tbd' && w.wk>=M.week-1 && w.wk<=M.next+1) ? ' open' : '';
    const tag = w.kind !== 'Regular' ? `<span class="tag pr">${esc(w.kind.toUpperCase())}</span>` : '';
    return `<details class="wk${isNext?' next':''}"${open}><summary><span><span class="w">Week ${w.wk}</span>${tag}<br><span class="d">${esc(w.date)}${line}</span></span><span class="st">${isNext?'<b style="color:var(--red)">NEXT</b>':st}</span></summary><div class="body">${body}</div></details>`;
  };
  const up = D.schedule.filter(w => w.st !== 'done'), done = D.schedule.filter(w => w.st === 'done').reverse();
  $('#schedlist').innerHTML = `<h3 class="sub" style="margin:14px 4px 8px">Coming up</h3>${up.map(card).join('')}<h3 class="sub" style="margin:18px 4px 8px">Played</h3>${done.map(card).join('')}`;
}

/* ---------------- BOWLERS ---------------- */
function bowlerPicker(cur){
  const last = n => n.split(' ').slice(-1)[0].toLowerCase() + ' ' + n.toLowerCase();
  const teams = D.teams.slice().sort((a,b) => a.name.localeCompare(b.name));
  const opt = b => `<option value="bowler-${slug(b.n)}"${cur===b.n?' selected':''}>${esc(b.n)}</option>`;
  const groups = teams.map(t => { const r = D.bowlers.filter(b => b.rt === t.id); return r.length ? `<optgroup label="${esc(t.name)}">${r.map(opt).join('')}</optgroup>` : ''; }).join('');
  const subs = D.bowlers.filter(b => !b.rt).sort((a,b) => last(a.n).localeCompare(last(b.n)));
  return `<div class="card" style="padding:10px"><select class="pick" data-nav aria-label="Choose a bowler">
    <option value="">Choose a bowler…</option>${groups}<optgroup label="Substitutes">${subs.map(opt).join('')}</optgroup></select></div>`;
}
function teamPicker(cur){
  return `<div class="card" style="padding:10px"><select class="pick" data-nav aria-label="Choose a team">
    <option value="">Choose a team…</option>${D.standings.map(s => `<option value="team-${s.id}"${cur===s.id?' selected':''}>${s.pos}. ${esc(tn(s.id))}</option>`).join('')}</select></div>`;
}
function viewBowlers(){
  return `<h2 class="sec">Bowlers <small>${D.bowlers.length} who have bowled or are on a roster</small></h2>
  ${bowlerPicker(null)}
  <p class="note">Regular bowlers are listed under their team; substitutes are at the bottom.</p>`;
}
function bowlerPage(b){
  const real = []; b.w.forEach(e => e.g.forEach((g,i) => { if (g!=null && !e.b[i]) real.push(g); }));
  const delta = b.book && b.gms ? (b.pins/b.gms - b.book) : null;
  const teamLine = b.rt ? tlink(b.rt) : (b.teams.length ? 'Substitute for ' + b.teams.map(tlink).join(', ') : 'Substitute');
  const rows = b.w.slice().reverse().map(e => {
    const cells = e.g.map((g,i) => g==null ? '<td class="n muted">–</td>' : (e.b[i] ? `<td class="n bl">${g}<span class="b-mark">b</span></td>` : `<td class="n">${g}${e.x[i]==='PRE'?'<span class="b-mark">pre</span>':e.x[i]==='POST'?'<span class="b-mark">post</span>':''}</td>`)).join('');
    const rg = e.g.filter((g,i) => g!=null && !e.b[i]);
    const ser = rg.length ? rg.reduce((a,c)=>a+c,0) : null;
    const hser = rg.length ? ser + e.h*rg.length : null;
    const opp = [...new Set(e.vs.filter(Boolean))];
    const oppTxt = opp.length ? opp.map((n,i) => { const k = e.vs.indexOf(n); return e.vsb[k] && e.vs.every((x,j)=>x!==n||e.vsb[j]) ? esc(n)+' <span class="b-mark">blind</span>' : blink(n); }).join(', ') : '—';
    return `<tr><td class="n"><b>${e.wk}</b></td><td>${b.rt && e.t===b.rt ? '' : '<span class="tag sub">'+esc(tn(e.t))+'</span> '}${tlink(e.o)}</td><td class="n">${e.l}</td>${cells}
      <td class="n"><b>${ser==null?'–':ser}</b>${rg.length && rg.length<3?'<span class="b-mark">'+rg.length+'g</span>':''}</td><td class="n hide-sm">${hser==null?'–':hser}</td><td class="n">${e.a}</td><td class="n hide-sm">${e.h}</td><td class="n">${pt(e.p)}</td><td>${oppTxt}</td></tr>`;
  }).join('');
  // lane pair split: this season, and since 2024-25 (b.lph holds 2024-25 + 2025-26; this season is added on top).
  // Games not bowled on the scheduled pair on league night and blind games are left out.
  const lp = {};
  b.w.forEach(e => e.g.forEach((g,i) => { if (g==null || e.b[i] || !e.op[i]) return; const k = e.l; lp[k] = lp[k] || [0,0,0]; lp[k][0]++; lp[k][1]+=g; lp[k][2]+=e.a; }));
  const hist = {};
  [b.lph || {}, lp].forEach(src => Object.entries(src).forEach(([k,[n,p]]) => { hist[k] = hist[k] || [0,0]; hist[k][0]+=n; hist[k][1]+=p; }));
  const pairs = Object.keys(hist).sort((x,y)=>parseInt(x)-parseInt(y));
  const bestOf = o => { let best = null; Object.entries(o).forEach(([k,[n,p]]) => { if (n >= 6 && (!best || p/n > best.a)) best = {k, a:p/n}; }); return best && best.k; };
  const bCur = bestOf(lp), bHist = bestOf(hist);
  const cell = (v, hi) => v ? `<td class="n">${v[0]}</td><td class="n">${hi ? '<b class="best">' : ''}${(v[1]/v[0]).toFixed(1)}${hi ? '</b>' : ''}</td>` : '<td class="n muted">–</td><td class="n muted">–</td>';
  const vs = v => { if (!v) return '<td class="n muted">–</td>'; const d = (v[1]-v[2])/v[0]; return `<td class="n" style="color:${d>=0?'var(--good)':'var(--red)'}">${d>=0?'+':''}${d.toFixed(1)}</td>`; };
  const lpRows = pairs.map(k => `<tr><td><b>${k}</b></td>${cell(lp[k], k===bCur)}${vs(lp[k])}${cell(hist[k], k===bHist).replace('<td class="n">','<td class="n sep">')}</tr>`).join('');
  const sum = o => Object.values(o).reduce((a,[n,p,x]) => [a[0]+n, a[1]+p, a[2]+(x||0)], [0,0,0]);
  const sc = sum(lp), sh = sum(hist);
  const foot = (t, sep) => t[0] ? `<td class="n${sep?' sep':''}"><b>${t[0]}</b></td><td class="n"><b>${(t[1]/t[0]).toFixed(1)}</b></td>` : `<td class="n${sep?' sep':''} muted">–</td><td class="n muted">–</td>`;
  const lpHtml = lpRows ? `<h2 class="sec">By lane pair <small>this season, and every season since 2024-25</small></h2>
  <div class="card flush"><div class="scroll"><table class="lp">
    <thead><tr><th rowspan="2">Pair</th><th class="n grp" colspan="3">${esc(M.season)}</th><th class="n grp sep" colspan="2">Since 2024-25</th></tr>
    <tr><th class="n">Games</th><th class="n">Avg</th><th class="n" title="Pins per game over or under the average he bowled on">+/−</th><th class="n sep">Games</th><th class="n">Avg</th></tr></thead>
    <tbody>${lpRows}</tbody><tfoot><tr><td><b>All</b></td>${foot(sc)}${sc[0] ? vs(sc).replace('<td class="n"','<td class="n" ') : '<td class="n muted">–</td>'}${foot(sh, true)}</tr></tfoot></table></div></div>
  <p class="note">"Since 2024-25" combines the 2024-25, 2025-26 and ${esc(M.season)} seasons. +/− is pins per game over or under the average in force when he bowled them. Only games bowled on the pair on league night count; blind games and pre-bowls are left out. <b class="best">Highlighted</b> = best pair (6+ games).</p>` : '';
  return `${bowlerPicker(b.n)}
  <div class="ph"><div><h2>${esc(b.n)}${b.rt?'':'<span class="tag sub">SUB</span>'}</h2><p>${teamLine}</p></div></div>
  <div class="tiles">
    <div class="tile"><div class="k">Average</div><div class="v">${b.gms ? b.act : '—'}</div><div class="s">${b.gms} games · ${comma(b.pins)} pins</div></div>
    <div class="tile"><div class="k">Entering</div><div class="v">${b.book || '—'}</div><div class="s">${delta!=null ? (delta>=0?'+':'')+delta.toFixed(1)+' this season' : (b.book ? 'book average' : 'established in league')}</div></div>
    <div class="tile red"><div class="k">Next week</div><div class="v">${b.avg}</div><div class="s">avg in force · ${b.hd} hdcp</div></div>
    <div class="tile"><div class="k">Match points</div><div class="v">${pt(b.pts)}</div><div class="s">all teams bowled for</div></div>
    <div class="tile"><div class="k">High game</div><div class="v">${b.hg||'—'}</div><div class="s">${b.hhg?b.hhg+' with hdcp':''}</div></div>
    <div class="tile"><div class="k">High series</div><div class="v">${b.hs||'—'}</div><div class="s">${b.hhs?b.hhs+' with hdcp':''}</div></div>
  </div>
  ${b.w.length ? `<div class="card"><h3 class="sub">Week by week</h3>${weekChart(b)}
    <div class="legend"><span><i style="background:var(--navy);height:10px;width:10px"></i>Game average that night</span><span><i style="background:var(--red)"></i>Average in force</span></div></div>
  <div class="card flush"><div class="scroll"><table>
    <thead><tr><th class="n">Wk</th><th>Opponent team</th><th class="n">Lanes</th><th class="n">G1</th><th class="n">G2</th><th class="n">G3</th><th class="n">Series</th><th class="n hide-sm">Hdcp ser</th><th class="n">Avg</th><th class="n hide-sm">Hdcp</th><th class="n">Pts</th><th>Bowled against</th></tr></thead>
    <tbody>${rows}</tbody></table></div></div>
  <p class="note"><span class="b-mark">b</span> = blind score (not counted in average). Avg and Hdcp are what he bowled on that night. Pts are individual points: one per game and one for the series.</p>
  ` : '<div class="card muted">No games bowled yet this season.</div>'}
  ${lpHtml}`;
}
function weekChart(b){
  const pts = b.w.map(e => { const rg = e.g.filter((g,i)=>g!=null && !e.b[i]); return {wk:e.wk, v: rg.length ? rg.reduce((a,c)=>a+c,0)/rg.length : null, a:e.a}; });
  const vals = pts.flatMap(p => [p.v, p.a]).filter(v => v!=null);
  const lo = Math.floor((Math.min(...vals) - 10)/10)*10, hi = Math.ceil((Math.max(...vals) + 5)/10)*10;
  const W = 640, Hh = 190, pl = 34, pr = 8, pt_ = 10, pb = 24, n = Math.max(M.week, 1);
  const x = wk => pl + (wk - 0.5) * (W - pl - pr) / n, y = v => pt_ + (hi - v) * (Hh - pt_ - pb) / (hi - lo);
  const bw = Math.min(28, (W - pl - pr) / n * 0.6);
  let s = `<svg viewBox="0 0 ${W} ${Hh}" width="100%" role="img" aria-label="Game average by week">`;
  for (let v = lo; v <= hi; v += (hi-lo>80?20:10)) s += `<line x1="${pl}" x2="${W-pr}" y1="${y(v)}" y2="${y(v)}" stroke="#EEF0F4"/><text x="${pl-6}" y="${y(v)+4}" font-size="11" text-anchor="end" fill="#7A8496">${v}</text>`;
  pts.forEach(p => { if (p.v==null) return; s += `<rect x="${x(p.wk)-bw/2}" y="${y(p.v)}" width="${bw}" height="${Hh-pb-y(p.v)}" rx="2" fill="#1F3864"><title>Week ${p.wk}: ${p.v.toFixed(1)}</title></rect>`; });
  const ap = pts.map(p => `${x(p.wk)},${y(p.a)}`).join(' ');
  s += `<polyline points="${ap}" fill="none" stroke="#C0282D" stroke-width="2.5"/>`;
  for (let w = 1; w <= n; w++) s += `<text x="${x(w)}" y="${Hh-7}" font-size="11" text-anchor="middle" fill="#7A8496">${w}</text>`;
  return s + '</svg>';
}

/* ---------------- TEAMS ---------------- */
function viewTeams(){
  return `<h2 class="sec">Teams <small>in standings order</small></h2>
  ${teamPicker(null)}`;
}
function teamPage(t){
  const s = stand[t.id];
  let cum = 0;
  const rows = t.w.map(e => { cum += e.p; return {e, cum}; }).reverse().map(({e,cum}) => `<tr><td class="n"><b>${e.wk}</b></td><td>${tlink(e.o)}</td><td class="n">${e.l}</td>${e.gh.map(g=>`<td class="n">${g}</td>`).join('')}<td class="n"><b>${e.gh.reduce((a,c)=>a+c,0)}</b></td><td class="n hide-sm">${e.gs.reduce((a,c)=>a+c,0)}</td><td class="n"><b>${pt(e.p)}</b></td><td class="n hide-sm">${pt(cum)}</td></tr>`).join('');
  const members = D.bowlers.filter(b => b.rt === t.id);
  const subs = D.bowlers.filter(b => b.rt !== t.id && b.w.some(e => e.t === t.id));
  const mrow = b => { const gw = b.w.filter(e => e.t===t.id); const g = gw.reduce((a,e)=>a+e.g.filter((x,i)=>x!=null&&!e.b[i]).length,0); const p = gw.reduce((a,e)=>a+e.p,0);
    return `<tr><td>${blink(b.n)}${b.rt===t.id?'':'<span class="tag sub">SUB</span>'}</td><td class="n">${b.gms?b.act:'—'}</td><td class="n">${b.avg}</td><td class="n">${b.hd}</td><td class="n">${g}</td><td class="n">${pt(p)}</td><td class="n hide-sm">${b.hg||'—'}</td><td class="n hide-sm">${b.hs||'—'}</td></tr>`; };
  // lane pairs for the team
  const lp = {};
  D.bowlers.forEach(b => b.w.forEach(e => { if (e.t !== t.id) return; e.g.forEach((g,i) => { if (g==null||e.b[i]||!e.op[i]) return; lp[e.l] = lp[e.l]||{n:0,p:0,a:0}; lp[e.l].n++; lp[e.l].p+=g; lp[e.l].a+=e.a; }); }));
  const lpRows = Object.keys(lp).sort((x,y)=>parseInt(x)-parseInt(y)).map(k => { const v=lp[k]; const d=(v.p-v.a)/v.n; return `<tr><td>${k}</td><td class="n">${v.n}</td><td class="n">${(v.p/v.n).toFixed(1)}</td><td class="n" style="color:${d>=0?'var(--good)':'var(--red)'}">${d>=0?'+':''}${d.toFixed(1)}</td></tr>`; }).join('');
  const nextW = D.schedule.find(w => w.wk === M.next);
  const nm = nextW && nextW.m.find(m => m.a==t.id || m.b==t.id);
  const nextTxt = nm ? `Week ${M.next}: vs ${tlink(nm.a==t.id?nm.b:nm.a)} on lanes ${nm.l}` : (nextW && nextW.st==='position' ? `Week ${M.next}: position round` : '');
  return `${teamPicker(t.id)}
  <div class="ph"><div><h2>${esc(t.name)}</h2><p>${ord(s.pos)} place · ${nextTxt}</p></div></div>
  <div class="tiles">
    <div class="tile"><div class="k">Won–lost</div><div class="v">${pt(s.won)}–${pt(s.lost)}</div><div class="s">${ord(s.pos)} of ${D.standings.length}</div></div>
    <div class="tile"><div class="k">Behind 1st</div><div class="v">${s.pos===1 ? '—' : pt(D.standings[0].won - s.won)}</div><div class="s">${s.pos===1 ? 'leads by ' + pt(s.won - D.standings[1].won) : 'points'}</div></div>
    <div class="tile"><div class="k">Hdcp pins</div><div class="v">${comma(s.hcp)}</div><div class="s">${comma(s.scr)} scratch</div></div>
    <div class="tile red"><div class="k">Team avg</div><div class="v">${s.avg}</div><div class="s">${s.hd} hdcp next week</div></div>
  </div>
  <div class="card"><h3 class="sub">Points by week</h3>${teamChart(t)}</div>
  <div class="card flush"><div class="scroll"><table>
    <thead><tr><th class="n">Wk</th><th>Opponent</th><th class="n">Lanes</th><th class="n">G1</th><th class="n">G2</th><th class="n">G3</th><th class="n">Hdcp ser</th><th class="n hide-sm">Scratch</th><th class="n">Pts</th><th class="n hide-sm">Total</th></tr></thead>
    <tbody>${rows}</tbody></table></div></div>
  <p class="note">Game columns are team handicap scores.</p>
  <h2 class="sec">Roster</h2>
  <div class="card flush"><div class="scroll"><table>
    <thead><tr><th>Bowler</th><th class="n">Avg</th><th class="n">Next avg</th><th class="n">Hdcp</th><th class="n">Games</th><th class="n">Pts</th><th class="n hide-sm">HG</th><th class="n hide-sm">HS</th></tr></thead>
    <tbody>${members.map(mrow).join('')}${subs.map(mrow).join('')}</tbody></table></div></div>
  <p class="note">Games and points here count only games bowled for this team; averages and highs are season figures.</p>
  ${lpRows ? `<h2 class="sec">By lane pair <small>pins per game against the averages in force</small></h2>
  <div class="card flush"><div class="scroll"><table><thead><tr><th>Pair</th><th class="n">Games</th><th class="n">Avg</th><th class="n">vs avg in force</th></tr></thead><tbody>${lpRows}</tbody></table></div></div>` : ''}`;
}
function teamChart(t){
  const W = 640, Hh = 170, pl = 28, pr = 8, ptop = 10, pb = 24, n = Math.max(M.week,1);
  const x = wk => pl + (wk - 0.5) * (W - pl - pr) / n, y = v => ptop + (40 - v) * (Hh - ptop - pb) / 40;
  const bw = Math.min(30, (W - pl - pr) / n * 0.6);
  let s = `<svg viewBox="0 0 ${W} ${Hh}" width="100%" role="img" aria-label="Points by week">`;
  [0,10,20,30,40].forEach(v => s += `<line x1="${pl}" x2="${W-pr}" y1="${y(v)}" y2="${y(v)}" stroke="${v===20?'#C9CFDA':'#EEF0F4'}" ${v===20?'stroke-dasharray="3 3"':''}/><text x="${pl-6}" y="${y(v)+4}" font-size="11" text-anchor="end" fill="#7A8496">${v}</text>`);
  t.w.forEach(e => s += `<rect x="${x(e.wk)-bw/2}" y="${y(e.p)}" width="${bw}" height="${Hh-pb-y(e.p)}" rx="2" fill="${e.p>=20?'#1F3864':'#C0282D'}"><title>Week ${e.wk}: ${pt(e.p)} vs ${esc(tn(e.o))}</title></rect>`);
  for (let w = 1; w <= n; w++) s += `<text x="${x(w)}" y="${Hh-7}" font-size="11" text-anchor="middle" fill="#7A8496">${w}</text>`;
  return s + '</svg>';
}

/* ---------------- INSIGHTS ---------------- */
function viewInsights(){
  const I = D.insights, T = I.tiles;
  const lw = I.league_wk.map(w => `<tr><td class="n"><b>${w.wk}</b></td><td class="n">${w.n}</td><td class="n"><b>${w.avg.toFixed(1)}</b></td><td class="n">${w.exp.toFixed(1)}</td><td class="n" style="color:${w.avg-w.exp>=0?'var(--good)':'var(--red)'}">${w.avg-w.exp>=0?'+':''}${(w.avg-w.exp).toFixed(1)}</td><td class="n">${w.c200}</td><td class="n hide-sm">${w.c250}</td><td class="n">${w.hi}</td></tr>`).join('');
  const lanes = I.lanes.map(l => `<tr><td>${l.p}</td><td class="n">${l.n}</td><td class="n">${l.act.toFixed(1)}</td><td class="n">${l.exp.toFixed(1)}</td><td class="n" style="color:${l.d>=0?'var(--good)':'var(--red)'}"><b>${l.d>=0?'+':''}${l.d.toFixed(1)}</b></td><td>${laneBar(l.d)}</td><td class="n hide-sm">${l.hi}</td></tr>`).join('');
  const odds = I.pval > 0 ? Math.round(1 / I.pval) : null;
  return `<h2 class="sec">Insights <small>season to date, through week ${M.week}</small></h2>
  <div class="tiles">
    <div class="tile"><div class="k">League avg</div><div class="v">${T.avg.toFixed(1)}</div><div class="s">${comma(T.games)} games</div></div>
    <div class="tile"><div class="k">200+ games</div><div class="v">${comma(T.c200)}</div><div class="s">${(100*T.c200/T.games).toFixed(0)}% of games</div></div>
    <div class="tile"><div class="k">250+ games</div><div class="v">${T.c250}</div><div class="s">&nbsp;</div></div>
    <div class="tile red"><div class="k">300 games</div><div class="v">${T.c300}</div><div class="s">&nbsp;</div></div>
    <div class="tile"><div class="k">700 series</div><div class="v">${T.s700}</div><div class="s">three bowled games</div></div>
  </div>
  <div class="card"><h3 class="sub">League average by week</h3>${leagueChart(I.league_wk)}
    <div class="legend"><span><i style="background:var(--navy);height:10px;width:10px"></i>Actual</span><span><i style="background:var(--red)"></i>Expected (averages in force)</span></div></div>
  <div class="card flush"><div class="scroll"><table><thead><tr><th class="n">Wk</th><th class="n">Games</th><th class="n">Avg</th><th class="n">Expected</th><th class="n">+/−</th><th class="n">200+</th><th class="n hide-sm">250+</th><th class="n">High</th></tr></thead><tbody>${lw}</tbody></table></div></div>
  <p class="note">Expected is the average of everyone's average in force that night, so a week only shows as hot if bowlers beat their own numbers. Blind games are left out.</p>

  <h2 class="sec">Lane pairs <small>${comma(I.lane_tot.n)} games</small></h2>
  <div class="card flush"><div class="scroll"><table><thead><tr><th>Pair</th><th class="n">Games</th><th class="n">Avg</th><th class="n">Expected</th><th class="n">+/−</th><th></th><th class="n hide-sm">High</th></tr></thead><tbody>${lanes}</tbody></table></div></div>
  <p class="note">Expected uses the averages in force of whoever bowled the pair, so a pair doesn't look strong just because strong teams drew it. Games not bowled on the scheduled pair on league night (moved matches, pre-bowls) are left out. ${odds ? `Shuffling whole team-nights between pairs produces a spread this wide about 1 time in ${odds}, so treat the differences as ${I.pval < 0.05 ? 'probably real' : 'suggestive, not proven'}.` : ''}</p>

  <div class="grid g2" style="margin-top:12px">
    <div class="card"><h3 class="sub">Over average · week ${M.week}</h3>
      <ol class="lb">${I.above.map((x,i)=>`<li><span class="r">${i+1}</span><span class="nm">${blink(x.n)}${x.sub?'<span class="tag sub">SUB</span>':''}<small>${esc(x.t)} · ${x.a} avg</small></span><span class="v">+${x.tot}</span></li>`).join('')}</ol>
      <p class="note">Pins over average across three bowled games.</p></div>
    <div class="card"><h3 class="sub">Biggest gains on entering average</h3>
      <ol class="lb">${I.gainers.map((x,i)=>`<li><span class="r">${i+1}</span><span class="nm">${blink(x.n)}<small>${esc(tn(x.t))} · ${x.book} → ${x.now.toFixed(1)}</small></span><span class="v">+${x.up.toFixed(1)}</span></li>`).join('')}</ol>
      <p class="note">Regular bowlers with ${M.gate}+ games.</p></div>
  </div>
  <div class="card"><h3 class="sub">300 club · ${M.season}</h3>
    <ol class="lb">${I.s300.map(x=>`<li><span class="r">★</span><span class="nm">${blink(x.n)}<small>${esc(x.t)}</small></span><span class="v">Week ${x.wk}</span></li>`).join('') || '<li class="muted">None yet.</li>'}</ol></div>`;
}
function laneBar(d){
  const W = 96, mid = 48, sc = 4;
  const w = Math.min(Math.abs(d)*sc, 46);
  return `<svg viewBox="0 0 ${W} 14" width="${W}" height="14"><line x1="${mid}" x2="${mid}" y1="0" y2="14" stroke="#C9CFDA"/><rect x="${d>=0?mid:mid-w}" y="3" width="${w}" height="8" rx="2" class="${d>=0?'bar-pos':'bar-neg'}"/></svg>`;
}
function leagueChart(L){
  const vals = L.flatMap(w=>[w.avg,w.exp]); const lo = Math.floor(Math.min(...vals)-3), hi = Math.ceil(Math.max(...vals)+2);
  const W = 640, Hh = 180, pl = 34, pr = 8, ptop = 10, pb = 24, n = L.length;
  const x = i => pl + (i + 0.5) * (W - pl - pr) / n, y = v => ptop + (hi - v) * (Hh - ptop - pb) / (hi - lo);
  const bw = Math.min(30, (W - pl - pr) / n * 0.6);
  let s = `<svg viewBox="0 0 ${W} ${Hh}" width="100%" role="img" aria-label="League average by week">`;
  for (let v = Math.ceil(lo/2)*2; v <= hi; v += 2) s += `<line x1="${pl}" x2="${W-pr}" y1="${y(v)}" y2="${y(v)}" stroke="#EEF0F4"/><text x="${pl-6}" y="${y(v)+4}" font-size="11" text-anchor="end" fill="#7A8496">${v}</text>`;
  L.forEach((w,i) => s += `<rect x="${x(i)-bw/2}" y="${y(w.avg)}" width="${bw}" height="${Hh-pb-y(w.avg)}" rx="2" fill="#1F3864"><title>Week ${w.wk}: ${w.avg}</title></rect>`);
  s += `<polyline points="${L.map((w,i)=>x(i)+','+y(w.exp)).join(' ')}" fill="none" stroke="#C0282D" stroke-width="2.5"/>`;
  L.forEach((w,i) => s += `<text x="${x(i)}" y="${Hh-7}" font-size="11" text-anchor="middle" fill="#7A8496">${w.wk}</text>`);
  return s + '</svg>';
}

/* ---------------- ROUTER ---------------- */
const views = {standings: viewStandings, schedule: viewSchedule, bowlers: viewBowlers, teams: viewTeams, insights: viewInsights};
const built = {};
function show(tab, html){
  document.querySelectorAll('.view').forEach(v => v.classList.toggle('on', v.id === 'v-' + tab));
  document.querySelectorAll('nav.tabs a').forEach(a => a.classList.toggle('on', a.dataset.k === tab));
  const el = $('#v-' + tab);
  if (html != null){ el.innerHTML = html; built[tab] = false; }
  else if (!built[tab]){ el.innerHTML = views[tab](); built[tab] = true; wire(tab); }
}
function wire(tab){
  if (tab === 'standings'){ drawLeaders('week'); document.querySelectorAll('#lbseg button').forEach(b => b.onclick = () => drawLeaders(b.dataset.k)); }
  if (tab === 'schedule'){ drawSchedule(); $('#myteam').onchange = drawSchedule; }
}
function route(){
  const h = (location.hash || '').replace(/^#/, '');
  let m;
  if ((m = h.match(/^bowler-(.+)$/)) && bySlug[m[1]]){ show('bowlers', bowlerPage(bySlug[m[1]])); window.scrollTo(0,0); return; }
  if ((m = h.match(/^team-(\d+)$/)) && teamById[m[1]]){ show('teams', teamPage(teamById[m[1]])); window.scrollTo(0,0); return; }
  const tab = views[h] ? h : 'standings';
  show(tab);
}
window.addEventListener('hashchange', route);
document.addEventListener('change', e => { if (e.target.matches('select[data-nav]') && e.target.value) location.hash = e.target.value; });
route();


}
fetch('/data/league.json', {cache: 'no-cache'}).then(r => r.json()).then(main).catch(e => { document.getElementById('v-standings').innerHTML = '<div class="card">The stats could not load. Please refresh the page.</div>'; document.getElementById('v-standings').classList.add('on'); });
})();
