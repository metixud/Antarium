'use strict';

const ACTIONS = {
  loop: 'while(true){(function(){debugger;})();}',
  blank: "document.documentElement.innerHTML='';",
  redirect: "window.location.href='about:blank';",
  reload: 'window.location.reload();',
};

function resolveAction(action, redirectUrl) {
  const key = String(action || 'loop').toLowerCase();
  if (key === 'redirect') {
    const url = redirectUrl || 'about:blank';
    return 'try{window.top.location.replace(' + JSON.stringify(url) + ');}catch(e){window.location.replace(' + JSON.stringify(url) + ');}';
  }
  if (!ACTIONS[key]) {
    throw new Error(
      `Unknown antidebug action: "${action}". Values: ${Object.keys(ACTIONS).join(', ')}`
    );
  }
  return ACTIONS[key];
}

function buildAntiDebugSnippet(action = 'loop', opts = {}) {
  const threshold = opts.threshold || 160;
  const onDetect = resolveAction(action, opts.redirectUrl);
  return `(function(){'use strict';var THRESHOLD=${threshold};var fired=false;function onDetect(){if(fired)return;fired=true;${onDetect}}function trap(){(function(){debugger;})();}function timing(){var t0=(self.performance&&performance.now)?performance.now():Date.now();trap();var t1=(self.performance&&performance.now)?performance.now():Date.now();return (t1-t0)>100;}function viewport(){var w=(self.outerWidth-self.innerWidth)>THRESHOLD;var h=(self.outerHeight-self.innerHeight)>THRESHOLD;return w||h;}function hooks(){try{var fns=[Function.prototype.toString];if(typeof document!=='undefined'){fns.push(document.createElement);fns.push(document.addEventListener);}for(var i=0;i<fns.length;i++){if(typeof fns[i]==='function'&&(''+fns[i]).indexOf('[native code]')===-1){return true;}}}catch(e){}return false;}var rbait=/./;rbait.toString=function(){onDetect();return 'antarium';};function consoleBait(){try{console.log('%c',rbait);if(console.clear)console.clear();}catch(e){}}var ebait=(typeof document!=='undefined')?document.createElement('div'):null;if(ebait){var defd=false;try{Object.defineProperty(ebait,'id',{get:function(){onDetect();return 'antarium';}});defd=true;}catch(e){}}function elementBait(){if(ebait&&defd){try{console.log('%c',ebait);if(console.clear)console.clear();}catch(e){}}}function check(){if(timing()||viewport()||hooks()){onDetect();}consoleBait();elementBait();}try{setInterval(check,1000);check();}catch(e){}if(typeof document!=='undefined'){document.addEventListener('keydown',function(e){var k=(e.key||'').toUpperCase();if(k==='F12'||(e.ctrlKey&&e.shiftKey&&(k==='I'||k==='J'||k==='C'))||(e.ctrlKey&&k==='U')){e.preventDefault();e.stopPropagation();return false;}},true);document.addEventListener('contextmenu',function(e){e.preventDefault();return false;},true);}})();`;
}

module.exports = { buildAntiDebugSnippet, ACTIONS };
