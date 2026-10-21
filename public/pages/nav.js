(function(){
  function go(p){ (window.top||window).location.href = p; }
  document.addEventListener('DOMContentLoaded', function(){
    var path = location.pathname;
    if (path.indexOf('home') > -1) {
      document.querySelectorAll('#products-showcase img, [data-purpose] img').forEach(function(img){
        if (img.closest('header') || img.closest('#adminPanelModal')) return;
        if (img.closest('[data-real-product-card]')) return;
        if (!/فستان/.test(img.alt||'')) return;
        img.style.cursor='pointer'; img.addEventListener('click', function(){ go('/product'); });
      });
    } else {
      var bar=document.createElement('a'); bar.href='/'; bar.target='_top'; bar.textContent='← العودة للمتجر';
      bar.style.cssText='position:fixed;bottom:16px;left:16px;z-index:9999;background:#b0004a;color:#fff;padding:10px 16px;border-radius:999px;font:600 14px sans-serif;box-shadow:0 6px 20px rgba(0,0,0,.25);text-decoration:none';
      document.body.appendChild(bar);
    }
  });
})();
