class p{constructor(){const t=document.querySelectorAll(".js-copy-selector");t&&Array.from(t).forEach(e=>{this.initCopyButton(e)})}initCopyButton(t){t.addEventListener("click",e=>{e.preventDefault();const o=t.parentElement.querySelector("pre").innerText;navigator.clipboard.writeText(o).then(()=>{t.classList.add("copied"),setTimeout(()=>{t.classList.remove("copied")},2e3)})})}}class m{constructor(){}static loadScript(t,e){var s=document.createElement("script");s.type="text/javascript",s.src=t,typeof e<"u"&&s.addEventListener("load",function(){e()}),document.body.appendChild(s)}static onDynamicContent(t,e,s,o=!1){new MutationObserver(l=>{for(let i of l)i.type==="childList"&&Array.from(i.addedNodes).forEach(r=>{if(r.nodeType==1){const a=r.querySelectorAll(e);a.length>0?s(a):r.matches(e)&&s([r])}}),i.type==="attributes"&&o&&(typeof o=="string"?i.attributeName==o&&i.target.matches(e)&&s([i.target]):i.target.matches(e)&&s([i.target]))}).observe(t,{attributes:typeof o=="boolean"?o:o.length>0,childList:!0,subtree:!0})}}class g{constructor(){}static scrollToY(t,e){const s=t.getBoundingClientRect(),o=window.pageYOffset||document.documentElement.scrollTop,n=(window.pageYOffset||document.documentElement.scrollTop)-(document.documentElement.clientTop||0),l=s.top+o-n;let i;window.requestAnimationFrame(function r(a){i||(i=a);var c=a-i,u=Math.min(c/e,1);window.scrollTo(0,n+l*u),c<e&&window.requestAnimationFrame(r)})}}class f{constructor(){this.animationSpeed=400,this.scrollSpeed=400;const t=document.querySelectorAll("[data-s-toggle]");console.log("targets",t),Array.from(t).forEach(e=>{this.initToggleTarget(e)}),m.onDynamicContent(document.documentElement,"[data-s-toggle]",e=>{Array.from(e).forEach(s=>{s.classList.contains("toggle-initialized")||this.initToggleTarget(s)})})}initToggleTarget(t){const e=document.querySelectorAll(`[data-s-toggle-target="${t.id}"]`),s=parseInt(t.getAttribute("data-s-toggle-height")),o=parseInt(t.getAttribute("data-s-toggle-margin"))??0;s&&(t.scrollHeight>s+s*o/100?t.style.maxHeight=`${s}px`:Array.from(e).forEach(n=>{t.classList.add("expanded"),n.parentElement.removeChild(n)})),Array.from(e).forEach(n=>{this.initToggleTrigger(n,t)})}initToggleTrigger(t,e){const s=e.getAttribute("data-s-toggle-animation"),o=e.getAttribute("data-s-toggle-class")??"hidden",n=e.getAttribute("data-s-toggle-default-expanded"),l=e.getAttribute("data-s-toggle-group");n?t.setAttribute("aria-expanded","true"):t.setAttribute("aria-expanded","false"),t.setAttribute("aria-controls",e.id),t.setAttribute("tabindex","0"),t.addEventListener("click",i=>{if(i.preventDefault(),l){const a=document.querySelector(`#${l}`).querySelector('[data-s-toggle-target][aria-expanded="true"]');if(a&&a!==t){const c=document.querySelector(`#${a.getAttribute("data-s-toggle-target")}`);this.toggleAction(a,c,o,s)}}this.toggleAction(t,e,o,s)}),t.addEventListener("open",()=>{this.toggleAction(t,e,o,s)}),e.addEventListener("show",()=>{console.log("show"),this.toggleAction(t,e,o,s)})}toggleAction(t,e,s,o){const n=t.getAttribute("aria-expanded")==="true",l=document.querySelectorAll(`[data-s-toggle-target='${e.id}']`);if(Array.from(l).forEach(i=>{this.switchButtonState(i)}),t.getAttribute("data-s-toggle-scroll")){const i=document.querySelector(`${t.getAttribute("data-s-toggle-scroll")}`);i&&g.scrollToY(i,this.scrollSpeed)}n?o?this.hideAnimated(e,s,o):e.classList.add(s):(e.hasAttribute("data-s-toggle-height")&&(e.classList.add("expanded"),t.parentElement.removeChild(t)),o?this.showAnimated(e,s,o):(e.style.maxHeight="none",e.classList.remove(s),e.classList.add("expanded")))}switchButtonState(t){const e=t.getAttribute("aria-expanded")==="true";t.setAttribute("aria-expanded",e?"false":"true")}showAnimated(t,e,s){let o=this.animationSpeed;parseInt(s)&&(o=parseInt(s),t.style.transitionDuration=`${o}ms`);const n=this.getHeight(t);t.classList.remove(e),t.classList.add("expanded"),t.style.maxHeight=n,window.setTimeout(function(){t.style.maxHeight="none"},o)}hideAnimated(t,e,s){let o=this.animationSpeed;parseInt(s)&&(o=parseInt(s),t.style.transitionDuration=`${o}ms`),t.style.maxHeight=t.scrollHeight+"px",window.setTimeout(function(){t.style.maxHeight="0"},1),window.setTimeout(function(){t.classList.add(e),t.classList.remove("expanded")},o)}getHeight(t){t.style.display="block";var e=t.scrollHeight+"px";return t.style.display="",e}}new p;new f;