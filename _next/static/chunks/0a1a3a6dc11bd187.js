(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,33525,(e,t,r)=>{"use strict";Object.defineProperty(r,"__esModule",{value:!0}),Object.defineProperty(r,"warnOnce",{enumerable:!0,get:function(){return n}});let n=e=>{}},80064,e=>{"use strict";function t(e,n=90,a=60){let i=r(e);return i<=0?"expired":i<=a?"urgent":i<=n?"warning":"ok"}function r(e){let t=new Date;t.setHours(0,0,0,0);let[r,n,a]=e.split("-");return Math.ceil((new Date(r,n-1,a,0,0,0,0)-t)/864e5)}function n(e){if(!e)return"";let[t,r,n]=e.split("-");return new Date(t,r-1,n).toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit",year:"numeric"})}function a(e){return e?e.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,""):""}function i(e){return e.toFixed(2).replace(".",",")}function o(e){return({active:"Ativo",sold:"Vendido",discarded:"Descartado",resolved:"Resolvido"})[e]||e}function s(e){switch(e){case"expired":return"Vencido";case"urgent":return"Urgente";case"warning":return"Atenção";case"ok":return"No Prazo";default:return"Desconhecido"}}e.s(["daysUntilExpiry",()=>r,"formatDate",()=>n,"formatPrice",()=>i,"getExpiryStatus",()=>t,"getExpiryStatusLabel",()=>s,"getStatusLabel",()=>o,"normalizeText",()=>a])},58858,e=>{"use strict";var t=e.i(22459);async function r(){let{data:e,error:r}=await t.supabase.from("notification_rules").select("*").order("sort_order",{ascending:!0});if(r)throw r;return e||[]}async function n(e,r){let{data:n,error:a}=await t.supabase.from("notification_rules").update(r).eq("id",e).select().single();if(a)throw a;return n}async function a(e=50){let{data:r,error:n}=await t.supabase.from("notification_log").select(`
            *,
            expiry_records (
                id, sku, product_name, expiry_date, batch_label, quantity, status
            ),
            notification_rules (
                label, days_before
            )
        `).eq("channel","app").order("sent_at",{ascending:!1}).limit(e);if(n)throw n;return r||[]}async function i(e){let{error:r}=await t.supabase.from("notification_log").update({seen:!0,seen_at:new Date().toISOString()}).eq("id",e);if(r)throw r}async function o(){let{error:e}=await t.supabase.from("notification_log").update({seen:!0,seen_at:new Date().toISOString()}).eq("channel","app").eq("seen",!1);if(e)throw e}async function s(){let{data:e,error:r}=await t.supabase.from("notification_rules").select("*").eq("enabled",!0).eq("notify_in_app",!0);if(r)throw r;if(!e||0===e.length)return[];let{data:n,error:a}=await t.supabase.from("expiry_records").select("*").eq("status","active");if(a)throw a;if(!n||0===n.length)return[];let i=new Date;i.setHours(0,0,0,0);let o=i.toISOString(),{data:s,error:l}=await t.supabase.from("notification_log").select("expiry_record_id, rule_id").eq("channel","app").gte("sent_at",o);if(l)throw l;let c=new Set((s||[]).map(e=>`${e.expiry_record_id}_${e.rule_id}`)),u=new Date;u.setHours(0,0,0,0);let d=[];for(let t of n){let r=Math.ceil((new Date(t.expiry_date+"T00:00:00")-u)/864e5),n=t.notify_channels||"all";if("none"!==n&&"email"!==n){for(let n of e)if(r===n.days_before){let e=`${t.id}_${n.id}`;c.has(e)||(d.push({expiry_record_id:t.id,rule_id:n.id,channel:"app",seen:!1}),c.add(e))}}}if(d.length>0){let{error:e}=await t.supabase.from("notification_log").insert(d);if(e)throw e}return d}async function l(){let{count:e,error:r}=await t.supabase.from("notification_log").select("*",{count:"exact",head:!0}).eq("channel","app").eq("seen",!1);return r?0:e||0}e.s(["checkAndGenerateNotifications",()=>s,"getAllNotifications",()=>a,"getNotificationRules",()=>r,"getUnseenCount",()=>l,"markAllNotificationsSeen",()=>o,"markNotificationSeen",()=>i,"updateNotificationRule",()=>n])},5766,e=>{"use strict";let t,r;var n,a=e.i(71645);let i={data:""},o=/(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g,s=/\/\*[^]*?\*\/|  +/g,l=/\n+/g,c=(e,t)=>{let r="",n="",a="";for(let i in e){let o=e[i];"@"==i[0]?"i"==i[1]?r=i+" "+o+";":n+="f"==i[1]?c(o,i):i+"{"+c(o,"k"==i[1]?"":t)+"}":"object"==typeof o?n+=c(o,t?t.replace(/([^,])+/g,e=>i.replace(/([^,]*:\S+\([^)]*\))|([^,])+/g,t=>/&/.test(t)?t.replace(/&/g,e):e?e+" "+t:t)):i):null!=o&&(i=/^--/.test(i)?i:i.replace(/[A-Z]/g,"-$&").toLowerCase(),a+=c.p?c.p(i,o):i+":"+o+";")}return r+(t&&a?t+"{"+a+"}":a)+n},u={},d=e=>{if("object"==typeof e){let t="";for(let r in e)t+=r+d(e[r]);return t}return e};function f(e){let t,r,n=this||{},a=e.call?e(n.p):e;return((e,t,r,n,a)=>{var i;let f=d(e),p=u[f]||(u[f]=(e=>{let t=0,r=11;for(;t<e.length;)r=101*r+e.charCodeAt(t++)>>>0;return"go"+r})(f));if(!u[p]){let t=f!==e?e:(e=>{let t,r,n=[{}];for(;t=o.exec(e.replace(s,""));)t[4]?n.shift():t[3]?(r=t[3].replace(l," ").trim(),n.unshift(n[0][r]=n[0][r]||{})):n[0][t[1]]=t[2].replace(l," ").trim();return n[0]})(e);u[p]=c(a?{["@keyframes "+p]:t}:t,r?"":"."+p)}let m=r&&u.g?u.g:null;return r&&(u.g=u[p]),i=u[p],m?t.data=t.data.replace(m,i):-1===t.data.indexOf(i)&&(t.data=n?i+t.data:t.data+i),p})(a.unshift?a.raw?(t=[].slice.call(arguments,1),r=n.p,a.reduce((e,n,a)=>{let i=t[a];if(i&&i.call){let e=i(r),t=e&&e.props&&e.props.className||/^go/.test(e)&&e;i=t?"."+t:e&&"object"==typeof e?e.props?"":c(e,""):!1===e?"":e}return e+n+(null==i?"":i)},"")):a.reduce((e,t)=>Object.assign(e,t&&t.call?t(n.p):t),{}):a,(e=>{if("object"==typeof window){let t=(e?e.querySelector("#_goober"):window._goober)||Object.assign(document.createElement("style"),{innerHTML:" ",id:"_goober"});return t.nonce=window.__nonce__,t.parentNode||(e||document.head).appendChild(t),t.firstChild}return e||i})(n.target),n.g,n.o,n.k)}f.bind({g:1});let p,m,h,y=f.bind({k:1});function g(e,t){let r=this||{};return function(){let n=arguments;function a(i,o){let s=Object.assign({},i),l=s.className||a.className;r.p=Object.assign({theme:m&&m()},s),r.o=/ *go\d+/.test(l),s.className=f.apply(r,n)+(l?" "+l:""),t&&(s.ref=o);let c=e;return e[0]&&(c=s.as||e,delete s.as),h&&c[0]&&h(s),p(c,s)}return t?t(a):a}}var b=(e,t)=>"function"==typeof e?e(t):e,v=(t=0,()=>(++t).toString()),x=()=>{if(void 0===r&&"u">typeof window){let e=matchMedia("(prefers-reduced-motion: reduce)");r=!e||e.matches}return r},w="default",_=(e,t)=>{let{toastLimit:r}=e.settings;switch(t.type){case 0:return{...e,toasts:[t.toast,...e.toasts].slice(0,r)};case 1:return{...e,toasts:e.toasts.map(e=>e.id===t.toast.id?{...e,...t.toast}:e)};case 2:let{toast:n}=t;return _(e,{type:+!!e.toasts.find(e=>e.id===n.id),toast:n});case 3:let{toastId:a}=t;return{...e,toasts:e.toasts.map(e=>e.id===a||void 0===a?{...e,dismissed:!0,visible:!1}:e)};case 4:return void 0===t.toastId?{...e,toasts:[]}:{...e,toasts:e.toasts.filter(e=>e.id!==t.toastId)};case 5:return{...e,pausedAt:t.time};case 6:let i=t.time-(e.pausedAt||0);return{...e,pausedAt:void 0,toasts:e.toasts.map(e=>({...e,pauseDuration:e.pauseDuration+i}))}}},j=[],N={toasts:[],pausedAt:void 0,settings:{toastLimit:20}},E={},k=(e,t=w)=>{E[t]=_(E[t]||N,e),j.forEach(([e,r])=>{e===t&&r(E[t])})},C=e=>Object.keys(E).forEach(t=>k(e,t)),P=(e=w)=>t=>{k(t,e)},O={blank:4e3,error:4e3,success:2e3,loading:1/0,custom:4e3},S=(e={},t=w)=>{let[r,n]=(0,a.useState)(E[t]||N),i=(0,a.useRef)(E[t]);(0,a.useEffect)(()=>(i.current!==E[t]&&n(E[t]),j.push([t,n]),()=>{let e=j.findIndex(([e])=>e===t);e>-1&&j.splice(e,1)}),[t]);let o=r.toasts.map(t=>{var r,n,a;return{...e,...e[t.type],...t,removeDelay:t.removeDelay||(null==(r=e[t.type])?void 0:r.removeDelay)||(null==e?void 0:e.removeDelay),duration:t.duration||(null==(n=e[t.type])?void 0:n.duration)||(null==e?void 0:e.duration)||O[t.type],style:{...e.style,...null==(a=e[t.type])?void 0:a.style,...t.style}}});return{...r,toasts:o}},$=e=>(t,r)=>{let n,a=((e,t="blank",r)=>({createdAt:Date.now(),visible:!0,dismissed:!1,type:t,ariaProps:{role:"status","aria-live":"polite"},message:e,pauseDuration:0,...r,id:(null==r?void 0:r.id)||v()}))(t,e,r);return P(a.toasterId||(n=a.id,Object.keys(E).find(e=>E[e].toasts.some(e=>e.id===n))))({type:2,toast:a}),a.id},T=(e,t)=>$("blank")(e,t);T.error=$("error"),T.success=$("success"),T.loading=$("loading"),T.custom=$("custom"),T.dismiss=(e,t)=>{let r={type:3,toastId:e};t?P(t)(r):C(r)},T.dismissAll=e=>T.dismiss(void 0,e),T.remove=(e,t)=>{let r={type:4,toastId:e};t?P(t)(r):C(r)},T.removeAll=e=>T.remove(void 0,e),T.promise=(e,t,r)=>{let n=T.loading(t.loading,{...r,...null==r?void 0:r.loading});return"function"==typeof e&&(e=e()),e.then(e=>{let a=t.success?b(t.success,e):void 0;return a?T.success(a,{id:n,...r,...null==r?void 0:r.success}):T.dismiss(n),e}).catch(e=>{let a=t.error?b(t.error,e):void 0;a?T.error(a,{id:n,...r,...null==r?void 0:r.error}):T.dismiss(n)}),e};var D=1e3,A=(e,t="default")=>{let{toasts:r,pausedAt:n}=S(e,t),i=(0,a.useRef)(new Map).current,o=(0,a.useCallback)((e,t=D)=>{if(i.has(e))return;let r=setTimeout(()=>{i.delete(e),s({type:4,toastId:e})},t);i.set(e,r)},[]);(0,a.useEffect)(()=>{if(n)return;let e=Date.now(),a=r.map(r=>{if(r.duration===1/0)return;let n=(r.duration||0)+r.pauseDuration-(e-r.createdAt);if(n<0){r.visible&&T.dismiss(r.id);return}return setTimeout(()=>T.dismiss(r.id,t),n)});return()=>{a.forEach(e=>e&&clearTimeout(e))}},[r,n,t]);let s=(0,a.useCallback)(P(t),[t]),l=(0,a.useCallback)(()=>{s({type:5,time:Date.now()})},[s]),c=(0,a.useCallback)((e,t)=>{s({type:1,toast:{id:e,height:t}})},[s]),u=(0,a.useCallback)(()=>{n&&s({type:6,time:Date.now()})},[n,s]),d=(0,a.useCallback)((e,t)=>{let{reverseOrder:n=!1,gutter:a=8,defaultPosition:i}=t||{},o=r.filter(t=>(t.position||i)===(e.position||i)&&t.height),s=o.findIndex(t=>t.id===e.id),l=o.filter((e,t)=>t<s&&e.visible).length;return o.filter(e=>e.visible).slice(...n?[l+1]:[0,l]).reduce((e,t)=>e+(t.height||0)+a,0)},[r]);return(0,a.useEffect)(()=>{r.forEach(e=>{if(e.dismissed)o(e.id,e.removeDelay);else{let t=i.get(e.id);t&&(clearTimeout(t),i.delete(e.id))}})},[r,o]),{toasts:r,handlers:{updateHeight:c,startPause:l,endPause:u,calculateOffset:d}}},I=y`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
 transform: scale(1) rotate(45deg);
  opacity: 1;
}`,M=y`
from {
  transform: scale(0);
  opacity: 0;
}
to {
  transform: scale(1);
  opacity: 1;
}`,R=y`
from {
  transform: scale(0) rotate(90deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(90deg);
	opacity: 1;
}`,L=g("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#ff4b4b"};
  position: relative;
  transform: rotate(45deg);

  animation: ${I} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;

  &:after,
  &:before {
    content: '';
    animation: ${M} 0.15s ease-out forwards;
    animation-delay: 150ms;
    position: absolute;
    border-radius: 3px;
    opacity: 0;
    background: ${e=>e.secondary||"#fff"};
    bottom: 9px;
    left: 4px;
    height: 2px;
    width: 12px;
  }

  &:before {
    animation: ${R} 0.15s ease-out forwards;
    animation-delay: 180ms;
    transform: rotate(90deg);
  }
`,U=y`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`,F=g("div")`
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  border: 2px solid;
  border-radius: 100%;
  border-color: ${e=>e.secondary||"#e0e0e0"};
  border-right-color: ${e=>e.primary||"#616161"};
  animation: ${U} 1s linear infinite;
`,z=y`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(45deg);
	opacity: 1;
}`,q=y`
0% {
	height: 0;
	width: 0;
	opacity: 0;
}
40% {
  height: 0;
	width: 6px;
	opacity: 1;
}
100% {
  opacity: 1;
  height: 10px;
}`,B=g("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#61d345"};
  position: relative;
  transform: rotate(45deg);

  animation: ${z} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;
  &:after {
    content: '';
    box-sizing: border-box;
    animation: ${q} 0.2s ease-out forwards;
    opacity: 0;
    animation-delay: 200ms;
    position: absolute;
    border-right: 2px solid;
    border-bottom: 2px solid;
    border-color: ${e=>e.secondary||"#fff"};
    bottom: 6px;
    left: 6px;
    height: 10px;
    width: 6px;
  }
`,H=g("div")`
  position: absolute;
`,K=g("div")`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 20px;
  min-height: 20px;
`,V=y`
from {
  transform: scale(0.6);
  opacity: 0.4;
}
to {
  transform: scale(1);
  opacity: 1;
}`,G=g("div")`
  position: relative;
  transform: scale(0.6);
  opacity: 0.4;
  min-width: 20px;
  animation: ${V} 0.3s 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
`,J=({toast:e})=>{let{icon:t,type:r,iconTheme:n}=e;return void 0!==t?"string"==typeof t?a.createElement(G,null,t):t:"blank"===r?null:a.createElement(K,null,a.createElement(F,{...n}),"loading"!==r&&a.createElement(H,null,"error"===r?a.createElement(L,{...n}):a.createElement(B,{...n})))},Q=g("div")`
  display: flex;
  align-items: center;
  background: #fff;
  color: #363636;
  line-height: 1.3;
  will-change: transform;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1), 0 3px 3px rgba(0, 0, 0, 0.05);
  max-width: 350px;
  pointer-events: auto;
  padding: 8px 10px;
  border-radius: 8px;
`,W=g("div")`
  display: flex;
  justify-content: center;
  margin: 4px 10px;
  color: inherit;
  flex: 1 1 auto;
  white-space: pre-line;
`,X=a.memo(({toast:e,position:t,style:r,children:n})=>{let i=e.height?((e,t)=>{let r=e.includes("top")?1:-1,[n,a]=x()?["0%{opacity:0;} 100%{opacity:1;}","0%{opacity:1;} 100%{opacity:0;}"]:[`
0% {transform: translate3d(0,${-200*r}%,0) scale(.6); opacity:.5;}
100% {transform: translate3d(0,0,0) scale(1); opacity:1;}
`,`
0% {transform: translate3d(0,0,-1px) scale(1); opacity:1;}
100% {transform: translate3d(0,${-150*r}%,-1px) scale(.6); opacity:0;}
`];return{animation:t?`${y(n)} 0.35s cubic-bezier(.21,1.02,.73,1) forwards`:`${y(a)} 0.4s forwards cubic-bezier(.06,.71,.55,1)`}})(e.position||t||"top-center",e.visible):{opacity:0},o=a.createElement(J,{toast:e}),s=a.createElement(W,{...e.ariaProps},b(e.message,e));return a.createElement(Q,{className:e.className,style:{...i,...r,...e.style}},"function"==typeof n?n({icon:o,message:s}):a.createElement(a.Fragment,null,o,s))});n=a.createElement,c.p=void 0,p=n,m=void 0,h=void 0;var Z=({id:e,className:t,style:r,onHeightUpdate:n,children:i})=>{let o=a.useCallback(t=>{if(t){let r=()=>{n(e,t.getBoundingClientRect().height)};r(),new MutationObserver(r).observe(t,{subtree:!0,childList:!0,characterData:!0})}},[e,n]);return a.createElement("div",{ref:o,className:t,style:r},i)},Y=f`
  z-index: 9999;
  > * {
    pointer-events: auto;
  }
`,ee=({reverseOrder:e,position:t="top-center",toastOptions:r,gutter:n,children:i,toasterId:o,containerStyle:s,containerClassName:l})=>{let{toasts:c,handlers:u}=A(r,o);return a.createElement("div",{"data-rht-toaster":o||"",style:{position:"fixed",zIndex:9999,top:16,left:16,right:16,bottom:16,pointerEvents:"none",...s},className:l,onMouseEnter:u.startPause,onMouseLeave:u.endPause},c.map(r=>{let o,s,l=r.position||t,c=u.calculateOffset(r,{reverseOrder:e,gutter:n,defaultPosition:t}),d=(o=l.includes("top"),s=l.includes("center")?{justifyContent:"center"}:l.includes("right")?{justifyContent:"flex-end"}:{},{left:0,right:0,display:"flex",position:"absolute",transition:x()?void 0:"all 230ms cubic-bezier(.21,1.02,.73,1)",transform:`translateY(${c*(o?1:-1)}px)`,...o?{top:0}:{bottom:0},...s});return a.createElement(Z,{id:r.id,key:r.id,onHeightUpdate:u.updateHeight,className:r.visible?Y:"",style:d},"custom"===r.type?b(r.message,r):i?i(r):a.createElement(X,{toast:r,position:l}))}))};e.s(["CheckmarkIcon",()=>B,"ErrorIcon",()=>L,"LoaderIcon",()=>F,"ToastBar",()=>X,"ToastIcon",()=>J,"Toaster",()=>ee,"default",()=>T,"resolveValue",()=>b,"toast",()=>T,"useToaster",()=>A,"useToasterStore",()=>S],5766)},98183,(e,t,r)=>{"use strict";Object.defineProperty(r,"__esModule",{value:!0});var n={assign:function(){return l},searchParamsToUrlQuery:function(){return i},urlQueryToSearchParams:function(){return s}};for(var a in n)Object.defineProperty(r,a,{enumerable:!0,get:n[a]});function i(e){let t={};for(let[r,n]of e.entries()){let e=t[r];void 0===e?t[r]=n:Array.isArray(e)?e.push(n):t[r]=[e,n]}return t}function o(e){return"string"==typeof e?e:("number"!=typeof e||isNaN(e))&&"boolean"!=typeof e?"":String(e)}function s(e){let t=new URLSearchParams;for(let[r,n]of Object.entries(e))if(Array.isArray(n))for(let e of n)t.append(r,o(e));else t.set(r,o(n));return t}function l(e,...t){for(let r of t){for(let t of r.keys())e.delete(t);for(let[t,n]of r.entries())e.append(t,n)}return e}},95057,(e,t,r)=>{"use strict";Object.defineProperty(r,"__esModule",{value:!0});var n={formatUrl:function(){return s},formatWithValidation:function(){return c},urlObjectKeys:function(){return l}};for(var a in n)Object.defineProperty(r,a,{enumerable:!0,get:n[a]});let i=e.r(90809)._(e.r(98183)),o=/https?|ftp|gopher|file/;function s(e){let{auth:t,hostname:r}=e,n=e.protocol||"",a=e.pathname||"",s=e.hash||"",l=e.query||"",c=!1;t=t?encodeURIComponent(t).replace(/%3A/i,":")+"@":"",e.host?c=t+e.host:r&&(c=t+(~r.indexOf(":")?`[${r}]`:r),e.port&&(c+=":"+e.port)),l&&"object"==typeof l&&(l=String(i.urlQueryToSearchParams(l)));let u=e.search||l&&`?${l}`||"";return n&&!n.endsWith(":")&&(n+=":"),e.slashes||(!n||o.test(n))&&!1!==c?(c="//"+(c||""),a&&"/"!==a[0]&&(a="/"+a)):c||(c=""),s&&"#"!==s[0]&&(s="#"+s),u&&"?"!==u[0]&&(u="?"+u),a=a.replace(/[?#]/g,encodeURIComponent),u=u.replace("#","%23"),`${n}${c}${a}${u}${s}`}let l=["auth","hash","host","hostname","href","path","pathname","port","protocol","query","search","slashes"];function c(e){return s(e)}},18581,(e,t,r)=>{"use strict";Object.defineProperty(r,"__esModule",{value:!0}),Object.defineProperty(r,"useMergedRef",{enumerable:!0,get:function(){return a}});let n=e.r(71645);function a(e,t){let r=(0,n.useRef)(null),a=(0,n.useRef)(null);return(0,n.useCallback)(n=>{if(null===n){let e=r.current;e&&(r.current=null,e());let t=a.current;t&&(a.current=null,t())}else e&&(r.current=i(e,n)),t&&(a.current=i(t,n))},[e,t])}function i(e,t){if("function"!=typeof e)return e.current=t,()=>{e.current=null};{let r=e(t);return"function"==typeof r?r:()=>e(null)}}("function"==typeof r.default||"object"==typeof r.default&&null!==r.default)&&void 0===r.default.__esModule&&(Object.defineProperty(r.default,"__esModule",{value:!0}),Object.assign(r.default,r),t.exports=r.default)},18967,(e,t,r)=>{"use strict";Object.defineProperty(r,"__esModule",{value:!0});var n={DecodeError:function(){return g},MiddlewareNotFoundError:function(){return w},MissingStaticPage:function(){return x},NormalizeError:function(){return b},PageNotFoundError:function(){return v},SP:function(){return h},ST:function(){return y},WEB_VITALS:function(){return i},execOnce:function(){return o},getDisplayName:function(){return d},getLocationOrigin:function(){return c},getURL:function(){return u},isAbsoluteUrl:function(){return l},isResSent:function(){return f},loadGetInitialProps:function(){return m},normalizeRepeatedSlashes:function(){return p},stringifyError:function(){return _}};for(var a in n)Object.defineProperty(r,a,{enumerable:!0,get:n[a]});let i=["CLS","FCP","FID","INP","LCP","TTFB"];function o(e){let t,r=!1;return(...n)=>(r||(r=!0,t=e(...n)),t)}let s=/^[a-zA-Z][a-zA-Z\d+\-.]*?:/,l=e=>s.test(e);function c(){let{protocol:e,hostname:t,port:r}=window.location;return`${e}//${t}${r?":"+r:""}`}function u(){let{href:e}=window.location,t=c();return e.substring(t.length)}function d(e){return"string"==typeof e?e:e.displayName||e.name||"Unknown"}function f(e){return e.finished||e.headersSent}function p(e){let t=e.split("?");return t[0].replace(/\\/g,"/").replace(/\/\/+/g,"/")+(t[1]?`?${t.slice(1).join("?")}`:"")}async function m(e,t){let r=t.res||t.ctx&&t.ctx.res;if(!e.getInitialProps)return t.ctx&&t.Component?{pageProps:await m(t.Component,t.ctx)}:{};let n=await e.getInitialProps(t);if(r&&f(r))return n;if(!n)throw Object.defineProperty(Error(`"${d(e)}.getInitialProps()" should resolve to an object. But found "${n}" instead.`),"__NEXT_ERROR_CODE",{value:"E394",enumerable:!1,configurable:!0});return n}let h="u">typeof performance,y=h&&["mark","measure","getEntriesByName"].every(e=>"function"==typeof performance[e]);class g extends Error{}class b extends Error{}class v extends Error{constructor(e){super(),this.code="ENOENT",this.name="PageNotFoundError",this.message=`Cannot find module for page: ${e}`}}class x extends Error{constructor(e,t){super(),this.message=`Failed to load static file for page: ${e} ${t}`}}class w extends Error{constructor(){super(),this.code="ENOENT",this.message="Cannot find the middleware module"}}function _(e){return JSON.stringify({message:e.message,stack:e.stack})}},73668,(e,t,r)=>{"use strict";Object.defineProperty(r,"__esModule",{value:!0}),Object.defineProperty(r,"isLocalURL",{enumerable:!0,get:function(){return i}});let n=e.r(18967),a=e.r(52817);function i(e){if(!(0,n.isAbsoluteUrl)(e))return!0;try{let t=(0,n.getLocationOrigin)(),r=new URL(e,t);return r.origin===t&&(0,a.hasBasePath)(r.pathname)}catch(e){return!1}}},84508,(e,t,r)=>{"use strict";Object.defineProperty(r,"__esModule",{value:!0}),Object.defineProperty(r,"errorOnce",{enumerable:!0,get:function(){return n}});let n=e=>{}},22016,(e,t,r)=>{"use strict";Object.defineProperty(r,"__esModule",{value:!0});var n={default:function(){return g},useLinkStatus:function(){return v}};for(var a in n)Object.defineProperty(r,a,{enumerable:!0,get:n[a]});let i=e.r(90809),o=e.r(43476),s=i._(e.r(71645)),l=e.r(95057),c=e.r(8372),u=e.r(18581),d=e.r(18967),f=e.r(5550);e.r(33525);let p=e.r(91949),m=e.r(73668),h=e.r(9396);function y(e){return"string"==typeof e?e:(0,l.formatUrl)(e)}function g(t){var r;let n,a,i,[l,g]=(0,s.useOptimistic)(p.IDLE_LINK_STATUS),v=(0,s.useRef)(null),{href:x,as:w,children:_,prefetch:j=null,passHref:N,replace:E,shallow:k,scroll:C,onClick:P,onMouseEnter:O,onTouchStart:S,legacyBehavior:$=!1,onNavigate:T,ref:D,unstable_dynamicOnHover:A,...I}=t;n=_,$&&("string"==typeof n||"number"==typeof n)&&(n=(0,o.jsx)("a",{children:n}));let M=s.default.useContext(c.AppRouterContext),R=!1!==j,L=!1!==j?null===(r=j)||"auto"===r?h.FetchStrategy.PPR:h.FetchStrategy.Full:h.FetchStrategy.PPR,{href:U,as:F}=s.default.useMemo(()=>{let e=y(x);return{href:e,as:w?y(w):e}},[x,w]);if($){if(n?.$$typeof===Symbol.for("react.lazy"))throw Object.defineProperty(Error("`<Link legacyBehavior>` received a direct child that is either a Server Component, or JSX that was loaded with React.lazy(). This is not supported. Either remove legacyBehavior, or make the direct child a Client Component that renders the Link's `<a>` tag."),"__NEXT_ERROR_CODE",{value:"E863",enumerable:!1,configurable:!0});a=s.default.Children.only(n)}let z=$?a&&"object"==typeof a&&a.ref:D,q=s.default.useCallback(e=>(null!==M&&(v.current=(0,p.mountLinkInstance)(e,U,M,L,R,g)),()=>{v.current&&((0,p.unmountLinkForCurrentNavigation)(v.current),v.current=null),(0,p.unmountPrefetchableInstance)(e)}),[R,U,M,L,g]),B={ref:(0,u.useMergedRef)(q,z),onClick(t){$||"function"!=typeof P||P(t),$&&a.props&&"function"==typeof a.props.onClick&&a.props.onClick(t),!M||t.defaultPrevented||function(t,r,n,a,i,o,l){if("u">typeof window){let c,{nodeName:u}=t.currentTarget;if("A"===u.toUpperCase()&&((c=t.currentTarget.getAttribute("target"))&&"_self"!==c||t.metaKey||t.ctrlKey||t.shiftKey||t.altKey||t.nativeEvent&&2===t.nativeEvent.which)||t.currentTarget.hasAttribute("download"))return;if(!(0,m.isLocalURL)(r)){i&&(t.preventDefault(),location.replace(r));return}if(t.preventDefault(),l){let e=!1;if(l({preventDefault:()=>{e=!0}}),e)return}let{dispatchNavigateAction:d}=e.r(99781);s.default.startTransition(()=>{d(n||r,i?"replace":"push",o??!0,a.current)})}}(t,U,F,v,E,C,T)},onMouseEnter(e){$||"function"!=typeof O||O(e),$&&a.props&&"function"==typeof a.props.onMouseEnter&&a.props.onMouseEnter(e),M&&R&&(0,p.onNavigationIntent)(e.currentTarget,!0===A)},onTouchStart:function(e){$||"function"!=typeof S||S(e),$&&a.props&&"function"==typeof a.props.onTouchStart&&a.props.onTouchStart(e),M&&R&&(0,p.onNavigationIntent)(e.currentTarget,!0===A)}};return(0,d.isAbsoluteUrl)(F)?B.href=F:$&&!N&&("a"!==a.type||"href"in a.props)||(B.href=(0,f.addBasePath)(F)),i=$?s.default.cloneElement(a,B):(0,o.jsx)("a",{...I,...B,children:n}),(0,o.jsx)(b.Provider,{value:l,children:i})}e.r(84508);let b=(0,s.createContext)(p.IDLE_LINK_STATUS),v=()=>(0,s.useContext)(b);("function"==typeof r.default||"object"==typeof r.default&&null!==r.default)&&void 0===r.default.__esModule&&(Object.defineProperty(r.default,"__esModule",{value:!0}),Object.assign(r.default,r),t.exports=r.default)},18566,(e,t,r)=>{t.exports=e.r(76562)},25406,e=>{"use strict";var t=e.i(43476),r=e.i(22016),n=e.i(18566),a=e.i(71645),i=e.i(58858),o=e.i(80064);function s({onClose:e}){let[r,n]=(0,a.useState)([]),[s,l]=(0,a.useState)(!0);async function c(){try{l(!0);let e=await (0,i.getAllNotifications)(50);n(e)}catch(e){console.error("Erro ao carregar notificações:",e)}finally{l(!1)}}async function u(e){try{await (0,i.markNotificationSeen)(e),n(t=>t.map(t=>t.id===e?{...t,seen:!0}:t))}catch(e){console.error("Erro ao marcar como vista:",e)}}async function d(){try{await (0,i.markAllNotificationsSeen)(),n(e=>e.map(e=>({...e,seen:!0})))}catch(e){console.error("Erro ao marcar todas como vistas:",e)}}(0,a.useEffect)(()=>{c()},[]);let f=r.filter(e=>!e.seen).length;return(0,t.jsx)("div",{className:"notification-panel-overlay",onClick:e,children:(0,t.jsxs)("div",{className:"notification-panel",onClick:e=>e.stopPropagation(),children:[(0,t.jsxs)("div",{className:"notification-panel-header",children:[(0,t.jsx)("h3",{children:"🔔 Notificações"}),(0,t.jsxs)("div",{className:"notification-panel-actions",children:[f>0&&(0,t.jsx)("button",{className:"btn btn-xs btn-secondary",onClick:d,children:"Marcar todas como lidas"}),(0,t.jsx)("button",{className:"modal-close",onClick:e,children:"✕"})]})]}),(0,t.jsx)("div",{className:"notification-panel-body",children:s?(0,t.jsxs)("div",{className:"notification-loading",children:[(0,t.jsx)("div",{className:"spinner",style:{width:24,height:24}}),(0,t.jsx)("span",{children:"Carregando..."})]}):0===r.length?(0,t.jsxs)("div",{className:"notification-empty",children:[(0,t.jsx)("span",{className:"notification-empty-icon",children:"✅"}),(0,t.jsx)("p",{children:"Nenhuma notificação no momento"}),(0,t.jsx)("p",{className:"text-muted",children:"Os alertas aparecerão aqui quando itens estiverem próximos do vencimento."})]}):(0,t.jsx)("div",{className:"notification-list",children:r.map(e=>{var r,n;let a,i,s,l,c,d=e.notification_rules;return(0,t.jsxs)("div",{className:`notification-item ${!e.seen?"notification-unseen":""}`,onClick:()=>!e.seen&&u(e.id),children:[(0,t.jsx)("span",{className:"notification-item-icon",children:(r=d?.days_before??0)<0?"🔴":0===r?"⚠️":r<=7?"🟡":r<=30?"🟠":"🔵"}),(0,t.jsxs)("div",{className:"notification-item-content",children:[(0,t.jsx)("span",{className:"notification-item-message",children:function(e){let t=e.expiry_records,r=e.notification_rules;if(!t||!r)return"Notificação";let n=(0,o.daysUntilExpiry)(t.expiry_date),a=t.product_name;return n<0?`${a} — vencido h\xe1 ${Math.abs(n)} dia${1!==Math.abs(n)?"s":""}`:0===n?`${a} — vence HOJE!`:`${a} — vence em ${n} dia${1!==n?"s":""}`}(e)}),(0,t.jsxs)("span",{className:"notification-item-rule",children:[d?.label||"Regra",e.expiry_records?.batch_label&&(0,t.jsxs)(t.Fragment,{children:[" • Lote: ",e.expiry_records.batch_label]})]})]}),(0,t.jsxs)("div",{className:"notification-item-meta",children:[(0,t.jsx)("span",{className:"notification-item-time",children:(a=new Date(n=e.sent_at),s=Math.floor((i=new Date-a)/6e4),l=Math.floor(i/36e5),c=Math.floor(i/864e5),s<1?"agora":s<60?`h\xe1 ${s}min`:l<24?`h\xe1 ${l}h`:c<7?`h\xe1 ${c}d`:(0,o.formatDate)(n.split("T")[0]))}),!e.seen&&(0,t.jsx)("span",{className:"notification-dot"})]})]},e.id)})})})]})})}function l(){let[e,r]=(0,a.useState)(0),[n,o]=(0,a.useState)(!1),[l,c]=(0,a.useState)(!1),u=(0,a.useCallback)(async()=>{try{let e=await (0,i.getUnseenCount)();r(e)}catch(e){console.warn("Notificações não disponíveis:",e.message)}},[]);return(0,a.useEffect)(()=>{!async function(){try{l||(await (0,i.checkAndGenerateNotifications)(),c(!0)),await u()}catch(e){console.warn("Notificações não disponíveis:",e.message)}}();let e=setInterval(u,3e5);return()=>clearInterval(e)},[l,u]),(0,t.jsxs)(t.Fragment,{children:[(0,t.jsxs)("button",{className:"notification-bell-btn",onClick:function(){o(!n)},title:"Notificações","aria-label":`Notifica\xe7\xf5es${e>0?` (${e} novas)`:""}`,children:[(0,t.jsx)("span",{className:"bell-icon",children:"🔔"}),e>0&&(0,t.jsx)("span",{className:"notification-badge",children:e>99?"99+":e})]}),n&&(0,t.jsx)(s,{onClose:function(){o(!1),u()}})]})}function c(){let e=(0,n.usePathname)(),[i,o]=(0,a.useState)(!1);return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)("button",{className:"sidebar-mobile-toggle",onClick:()=>o(!i),"aria-label":"Menu",children:"☰"}),(0,t.jsxs)("aside",{className:`sidebar ${i?"sidebar-open":""}`,children:[(0,t.jsxs)("div",{className:"sidebar-header",children:[(0,t.jsxs)("div",{className:"sidebar-logo",children:[(0,t.jsx)("span",{className:"logo-icon",children:"🌿"}),(0,t.jsx)("span",{className:"logo-text",children:"NatuBrava"})]}),(0,t.jsxs)("div",{className:"sidebar-header-row",children:[(0,t.jsx)("span",{className:"sidebar-subtitle",children:"Controle de Vencimentos"}),(0,t.jsx)(l,{})]})]}),(0,t.jsx)("nav",{className:"sidebar-nav",children:[{href:"/",label:"Dashboard",icon:"📊"},{href:"/products",label:"Produtos",icon:"📦"},{href:"/history",label:"Histórico",icon:"📋"},{href:"/settings",label:"Configurações",icon:"⚙️"}].map(n=>(0,t.jsxs)(r.default,{href:n.href,className:`sidebar-link ${e===n.href?"sidebar-link-active":""}`,onClick:()=>o(!1),children:[(0,t.jsx)("span",{className:"sidebar-link-icon",children:n.icon}),(0,t.jsx)("span",{className:"sidebar-link-label",children:n.label})]},n.href))}),(0,t.jsx)("div",{className:"sidebar-footer",children:(0,t.jsx)("span",{className:"sidebar-version",children:"v1.0 MVP"})})]}),i&&(0,t.jsx)("div",{className:"sidebar-overlay",onClick:()=>o(!1)})]})}e.s(["default",()=>c],25406)}]);