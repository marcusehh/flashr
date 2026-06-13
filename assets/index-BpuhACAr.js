(function(){const r=document.createElement("link").relList;if(r&&r.supports&&r.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))a(n);new MutationObserver(n=>{for(const s of n)if(s.type==="childList")for(const c of s.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&a(c)}).observe(document,{childList:!0,subtree:!0});function o(n){const s={};return n.integrity&&(s.integrity=n.integrity),n.referrerPolicy&&(s.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?s.credentials="include":n.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function a(n){if(n.ep)return;n.ep=!0;const s=o(n);fetch(n.href,s)}})();const x={tab:"	",comma:",",semicolon:";",space:" ",pipe:"|"};function $(t){const r={separator:"	",html:!1,tagsColumn:0},o=t.split(/\r?\n/),a=[];for(const s of o)if(s.trim()!==""){if(s.startsWith("#")){const c=s.slice(1),i=c.indexOf(":");if(i===-1)continue;const d=c.slice(0,i).trim().toLowerCase(),l=c.slice(i+1).trim();d==="separator"?r.separator=x[l.toLowerCase()]||l:d==="html"?r.html=l.toLowerCase()==="true":d==="tags column"&&(r.tagsColumn=parseInt(l,10)||0);continue}a.push(s)}return{cards:a.map(s=>{const c=s.split(r.separator),i=(c[0]??"").trim(),d=(c[1]??"").trim();let l="";return r.tagsColumn>0&&(l=(c[r.tagsColumn-1]??"").trim()),{front:i,back:d,tags:l}}).filter(s=>s.front||s.back),html:r.html}}const h=document.querySelector("#app"),L=document.querySelector("#backbtn"),e={deckName:"",cards:[],html:!1,order:[],pos:0,showBack:!1,mode:"sequential",loaderError:""},v=[];let p="loader";const q={loader:P,setup:O,study:T,done:H};function m(t,{replace:r=!1}={}){!r&&t!==p&&v.push(p),p=t,u()}function B(){v.length&&(p=v.pop(),u())}function u(){q[p](),L.classList.toggle("hidden",v.length===0)}L.addEventListener("click",B);function M(t){const r=t.slice();for(let o=r.length-1;o>0;o--){const a=Math.floor(Math.random()*(o+1));[r[o],r[a]]=[r[a],r[o]]}return r}function g(){const t=e.cards.map((r,o)=>o);e.order=e.mode==="random"?M(t):t,e.pos=0,e.showBack=!1}function C(){window.MathJax&&window.MathJax.typesetPromise&&window.MathJax.typesetPromise([h]).catch(()=>{})}function P(){const t=e.loaderError;e.loaderError="",h.innerHTML=`
    <div class="wrap">
      <h1>flashr</h1>
      <p class="sub">A minimal flashcard studier. Pick a deck to begin.</p>

      <h2 class="section">Library</h2>
      <div id="library"><p class="hint">Loading decks…</p></div>
      ${t?`<p class="sub" style="margin-top:16px;color:#000"><strong>${t}</strong></p>`:""}
    </div>
  `,N()}function k(t){e.loaderError=t,m("loader")}async function N(){const t=document.querySelector("#library");if(t)try{const r=await fetch("/flashr/decks.json");if(!r.ok)throw new Error;const o=await r.json();if(!Array.isArray(o)||!o.length){t.innerHTML='<p class="hint">No decks in the library yet.</p>';return}t.innerHTML=o.map((a,n)=>{const c=(a.chapters||[]).map((i,d)=>`<button class="deck-item" data-unit="${n}" data-chapter="${d}">
                 <span class="deck-name">${f(i.name||i.file)}</span>
                 <span class="deck-count" data-count="${n}-${d}">…</span>
               </button>`).join("");return`
          <div class="unit">
            <div class="unit-head">
              <span class="unit-name">${f(a.name)}</span>
              <button class="unit-all" data-unit="${n}">Study entire unit</button>
            </div>
            <div class="deck-list">${c}</div>
          </div>`}).join(""),A(o),t.querySelectorAll(".deck-item").forEach(a=>{a.addEventListener("click",()=>{const s=o[Number(a.dataset.unit)].chapters[Number(a.dataset.chapter)];b([s.file],s.name)})}),t.querySelectorAll(".unit-all").forEach(a=>{a.addEventListener("click",()=>{const n=o[Number(a.dataset.unit)];b(n.chapters.map(s=>s.file),n.name)})})}catch{t.innerHTML='<p class="hint">Could not load the deck library.</p>'}}async function A(t){for(let r=0;r<t.length;r++){const o=t[r].chapters||[];let a=0;await Promise.all(o.map(async(s,c)=>{let i=0;try{const l=await fetch(`/flashr/${encodeURI(s.file)}`);l.ok&&(i=$(await l.text()).cards.length)}catch{i=-1}a+=Math.max(0,i);const d=document.querySelector(`[data-count="${r}-${c}"]`);d&&(d.textContent=i<0?"—":`${i}`)}));const n=document.querySelector(`.unit-all[data-unit="${r}"]`);n&&(n.textContent=`Study entire unit (${a})`)}}async function b(t,r){try{const o=await Promise.all(t.map(async s=>{const c=await fetch(`/flashr/${encodeURI(s)}`);if(!c.ok)throw new Error;return c.text()}));let a=[],n=!1;for(const s of o){const c=$(s);a=a.concat(c.cards),n=n||c.html}if(!a.length){k("That deck contained no cards.");return}e.deckName=r,e.cards=a,e.html=n,m("setup")}catch{k("Could not load that deck.")}}function O(){h.innerHTML=`
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
  `,document.querySelectorAll("#seg button").forEach(t=>{t.addEventListener("click",()=>{e.mode=t.dataset.mode,u()})}),document.querySelector("#start").addEventListener("click",()=>{g(),m("study")})}function T(){const t=e.cards[e.order[e.pos]],r=(e.pos+(e.showBack?1:0))/e.order.length*100;h.innerHTML=`
    <div class="wrap">
      <div class="topbar">
        <span></span>
        <span>${e.pos+1} / ${e.order.length} &middot; ${e.mode}</span>
      </div>
      <div class="progress"><div style="width:${r}%"></div></div>

      <div class="card" id="card">
        <div class="side front">${w(t.front)}</div>
        ${e.showBack?`<div class="divider"></div><div class="side back">${w(t.back)}</div>`:'<div class="flip-hint">Click card or press Space to reveal</div>'}
        ${e.showBack&&t.tags?`<div class="tags">${f(t.tags)}</div>`:""}
      </div>

      <div class="controls">
        <button id="prev" ${e.pos===0?"disabled":""}>&larr; Prev</button>
        ${e.showBack?`<button id="next" class="primary">${e.pos===e.order.length-1?"Finish":"Next →"}</button>`:'<button id="flip" class="primary">Show answer</button>'}
      </div>
      <p class="kbd"><span>Space</span> flip <span>&rarr;</span> next <span>&larr;</span> prev <span>R</span> restart</p>
    </div>
  `,document.querySelector("#card").addEventListener("click",y),document.querySelector("#prev").addEventListener("click",E);const o=document.querySelector("#flip");o&&o.addEventListener("click",y);const a=document.querySelector("#next");a&&a.addEventListener("click",S),C()}function H(){h.innerHTML=`
    <div class="wrap">
      <div class="done">
        <h2>Deck complete</h2>
        <p class="sub">You studied ${e.order.length} card${e.order.length===1?"":"s"}.</p>
        <div class="controls" style="justify-content:center;margin-top:24px">
          <button id="restart" class="primary">Study again</button>
        </div>
      </div>
    </div>
  `,document.querySelector("#restart").addEventListener("click",()=>{g(),m("study",{replace:!0})})}function y(){e.showBack=!e.showBack,u()}function S(){if(e.pos===e.order.length-1){m("done",{replace:!0});return}e.pos++,e.showBack=!1,u()}function E(){e.pos!==0&&(e.pos--,e.showBack=!1,u())}document.addEventListener("keydown",t=>{p==="study"&&(t.key===" "?(t.preventDefault(),y()):t.key==="ArrowRight"?e.showBack?S():y():t.key==="ArrowLeft"?E():t.key.toLowerCase()==="r"&&(g(),u()))});function w(t){return e.html?t:f(t)}function f(t){return String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}u();
