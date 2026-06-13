(function(){const n=document.createElement("link").relList;if(n&&n.supports&&n.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))r(a);new MutationObserver(a=>{for(const o of a)if(o.type==="childList")for(const c of o.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&r(c)}).observe(document,{childList:!0,subtree:!0});function s(a){const o={};return a.integrity&&(o.integrity=a.integrity),a.referrerPolicy&&(o.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?o.credentials="include":a.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function r(a){if(a.ep)return;a.ep=!0;const o=s(a);fetch(a.href,o)}})();const x={tab:"	",comma:",",semicolon:";",space:" ",pipe:"|"};function $(t){const n={separator:"	",html:!1,tagsColumn:0},s=t.split(/\r?\n/),r=[];for(const o of s)if(o.trim()!==""){if(o.startsWith("#")){const c=o.slice(1),i=c.indexOf(":");if(i===-1)continue;const d=c.slice(0,i).trim().toLowerCase(),l=c.slice(i+1).trim();d==="separator"?n.separator=x[l.toLowerCase()]||l:d==="html"?n.html=l.toLowerCase()==="true":d==="tags column"&&(n.tagsColumn=parseInt(l,10)||0);continue}r.push(o)}return{cards:r.map(o=>{const c=o.split(n.separator),i=(c[0]??"").trim(),d=(c[1]??"").trim();let l="";return n.tagsColumn>0&&(l=(c[n.tagsColumn-1]??"").trim()),{front:i,back:d,tags:l}}).filter(o=>o.front||o.back),html:n.html}}const h=document.querySelector("#app"),L=document.querySelector("#backbtn"),e={deckName:"",cards:[],html:!1,order:[],pos:0,showBack:!1,mode:"sequential",loaderError:"",editing:!1},q="flashr-edits";function B(){try{return JSON.parse(localStorage.getItem(q))||{}}catch{return{}}}function C(t,n){const s=`${t}\0${n}`;let r=5381;for(let a=0;a<s.length;a++)r=(r<<5)+r+s.charCodeAt(a)>>>0;return"c"+r.toString(36)}function M(t){const n=B();for(const s of t){s.key=C(s.front,s.back);const r=n[s.key];r&&(s.front=r.front,s.back=r.back,s.tags=r.tags)}return t}const y=[];let p="loader";const N={loader:T,setup:D,study:I,done:J};function m(t,{replace:n=!1}={}){!n&&t!==p&&y.push(p),p=t,u()}function P(){y.length&&(p=y.pop(),u())}function u(){N[p](),L.classList.toggle("hidden",y.length===0)}L.addEventListener("click",P);function A(t){const n=t.slice();for(let s=n.length-1;s>0;s--){const r=Math.floor(Math.random()*(s+1));[n[s],n[r]]=[n[r],n[s]]}return n}function g(){const t=e.cards.map((n,s)=>s);e.order=e.mode==="random"?A(t):t,e.pos=0,e.showBack=!1}function O(){window.MathJax&&window.MathJax.typesetPromise&&window.MathJax.typesetPromise([h]).catch(()=>{})}function T(){const t=e.loaderError;e.loaderError="",h.innerHTML=`
    <div class="wrap">
      <h1>flashr</h1>
      <p class="sub">A minimal flashcard studier. Pick a deck to begin.</p>

      <h2 class="section">Library</h2>
      <div id="library"><p class="hint">Loading decks…</p></div>
      ${t?`<p class="sub" style="margin-top:16px;color:#000"><strong>${t}</strong></p>`:""}
    </div>
  `,H()}function k(t){e.loaderError=t,m("loader")}async function H(){const t=document.querySelector("#library");if(t)try{const n=await fetch("/flashr/decks.json");if(!n.ok)throw new Error;const s=await n.json();if(!Array.isArray(s)||!s.length){t.innerHTML='<p class="hint">No decks in the library yet.</p>';return}t.innerHTML=s.map((r,a)=>{const c=(r.chapters||[]).map((i,d)=>`<button class="deck-item" data-unit="${a}" data-chapter="${d}">
                 <span class="deck-name">${f(i.name||i.file)}</span>
                 <span class="deck-count" data-count="${a}-${d}">…</span>
               </button>`).join("");return`
          <div class="unit">
            <div class="unit-head">
              <span class="unit-name">${f(r.name)}</span>
              <button class="unit-all" data-unit="${a}">Study entire unit</button>
            </div>
            <div class="deck-list">${c}</div>
          </div>`}).join(""),j(s),t.querySelectorAll(".deck-item").forEach(r=>{r.addEventListener("click",()=>{const o=s[Number(r.dataset.unit)].chapters[Number(r.dataset.chapter)];b([o.file],o.name)})}),t.querySelectorAll(".unit-all").forEach(r=>{r.addEventListener("click",()=>{const a=s[Number(r.dataset.unit)];b(a.chapters.map(o=>o.file),a.name)})})}catch{t.innerHTML='<p class="hint">Could not load the deck library.</p>'}}async function j(t){for(let n=0;n<t.length;n++){const s=t[n].chapters||[];let r=0;await Promise.all(s.map(async(o,c)=>{let i=0;try{const l=await fetch(`/flashr/${o.file}`);l.ok&&(i=$(await l.text()).cards.length)}catch{i=-1}r+=Math.max(0,i);const d=document.querySelector(`[data-count="${n}-${c}"]`);d&&(d.textContent=i<0?"—":`${i}`)}));const a=document.querySelector(`.unit-all[data-unit="${n}"]`);a&&(a.textContent=`Study entire unit (${r})`)}}async function b(t,n){try{const s=await Promise.all(t.map(async o=>{const c=await fetch(`/flashr/${o}`);if(!c.ok)throw new Error;return c.text()}));let r=[],a=!1;for(const o of s){const c=$(o);r=r.concat(c.cards),a=a||c.html}if(!r.length){k("That deck contained no cards.");return}e.deckName=n,e.cards=M(r),e.html=a,m("setup")}catch{k("Could not load that deck.")}}function D(){h.innerHTML=`
    <div class="wrap">
      <h1>${f(e.deckName)}</h1>
      <p class="sub">${e.cards.length} card${e.cards.length===1?"":"s"} loaded.</p>

      <div class="options">
        <span>Order:</span>
        <div class="seg" id="seg">
          <button data-mode="sequential" class="${e.mode==="sequential"?"active":""}">Sequential</button>
          <button data-mode="random" class="${e.mode==="random"?"active":""}">Random</button>
        </div>
      </div>

      <div class="controls" style="margin-top:32px">
        <button id="start" class="primary">Start studying</button>
      </div>
    </div>
  `,document.querySelectorAll("#seg button").forEach(t=>{t.addEventListener("click",()=>{e.mode=t.dataset.mode,u()})}),document.querySelector("#start").addEventListener("click",()=>{g(),m("study")})}function I(){const t=e.cards[e.order[e.pos]],n=(e.pos+(e.showBack?1:0))/e.order.length*100;h.innerHTML=`
    <div class="wrap">
      <div class="topbar">
        <button id="edit">Edit</button>
        <span>${e.pos+1} / ${e.order.length} &middot; ${e.mode}</span>
      </div>
      <div class="progress"><div style="width:${n}%"></div></div>

      <div class="card" id="card">
        <div class="side front">${w(t.front)}</div>
        ${e.showBack?`<div class="divider"></div><div class="side back">${w(t.back)}</div>`:'<div class="flip-hint">Click card or press Space to reveal</div>'}
        ${e.showBack&&t.tags?`<div class="tags">${f(t.tags)}</div>`:""}
      </div>

      <div class="controls">
        <button id="prev" ${e.pos===0?"disabled":""}>&larr; Prev</button>
        ${e.showBack?`<button id="next" class="primary">${e.pos===e.order.length-1?"Finish":"Next →"}</button>`:'<button id="flip" class="primary">Show answer</button>'}
      </div>
      <p class="kbd"><span>Space</span> flip <span>&rarr;</span> next <span>&larr;</span> prev <span>E</span> edit <span>R</span> restart</p>
    </div>
  `,document.querySelector("#edit").addEventListener("click",startEdit),document.querySelector("#card").addEventListener("click",v),document.querySelector("#prev").addEventListener("click",E);const s=document.querySelector("#flip");s&&s.addEventListener("click",v);const r=document.querySelector("#next");r&&r.addEventListener("click",S),O()}function J(){h.innerHTML=`
    <div class="wrap">
      <div class="done">
        <h2>Deck complete</h2>
        <p class="sub">You studied ${e.order.length} card${e.order.length===1?"":"s"}.</p>
        <div class="controls" style="justify-content:center;margin-top:24px">
          <button id="restart" class="primary">Study again</button>
        </div>
      </div>
    </div>
  `,document.querySelector("#restart").addEventListener("click",()=>{g(),m("study",{replace:!0})})}function v(){e.showBack=!e.showBack,u()}function S(){if(e.pos===e.order.length-1){m("done",{replace:!0});return}e.pos++,e.showBack=!1,u()}function E(){e.pos!==0&&(e.pos--,e.showBack=!1,u())}document.addEventListener("keydown",t=>{p==="study"&&(t.key===" "?(t.preventDefault(),v()):t.key==="ArrowRight"?e.showBack?S():v():t.key==="ArrowLeft"?E():t.key.toLowerCase()==="r"&&(g(),u()))});function w(t){return e.html?t:f(t)}function f(t){return String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}u();
