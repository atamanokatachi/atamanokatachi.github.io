/* アタマノカタチ：assets/data.js（window.SITE）の中身から各ページを組み立てる */
(function () {
  'use strict';
  var S = window.SITE;
  var app = document.getElementById('app');
  if (!S || !app) return;

  var PAGE = app.getAttribute('data-page') || 'home';
  var ID = app.getAttribute('data-id') || '';
  var X = 'https://x.com/' + S.site.x;
  var BASE = S.site.base;
  var EPS = S.manga.episodes;
  var LATEST = EPS[EPS.length - 1];
  var KIND = {};
  S.kinds.forEach(function (k) { KIND[k.id] = k.name; });
  var CAT = { news: 'ニュース', feature: '特集', pickup: 'ピックアップ', blog: 'ブログ', manga: '連載漫画', guide: '入門' };

  // ---------- 文字の処理 ----------
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function plain(s) { return String(s || '').replace(/\^/g, ''); }
  // 「^」で区切った文節ごとに改行させないための箱に入れる
  function ph(s) {
    return String(s || '').split('^').map(function (p) { return '<span class="ph">' + esc(p) + '</span>'; }).join('');
  }
  // [文字](URL) をリンクにする
  function fmt(s) {
    return esc(plain(s)).replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (m, t, u) {
      return '<a href="' + u + '"' + (/^https?:/.test(u) ? ' target="_blank" rel="noopener"' : '') + '>' + t + '</a>';
    });
  }
  // 外部サイトへのリンクの印（矢印のアイコン）
  var EXI = '<svg class="exi" viewBox="0 0 12 12" aria-hidden="true"><path d="M4.5 1.5h6v6M10.5 1.5 2 10" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
  function fdate(d) { return d ? String(d).replace(/-/g, '.') : ''; }
  function isExt(u) { return /^https?:/.test(u || ''); }
  function tgt(u) { return isExt(u) ? ' target="_blank" rel="noopener"' : ''; }
  function byDate(a, b) { return (b.date || '').localeCompare(a.date || ''); }

  // ---------- データの参照 ----------
  function artUrl(a) { return 'article-' + a.id + '.html'; }
  function epUrl(no) { return 'manga-' + no + '.html'; }
  function findArt(id) {
    for (var i = 0; i < S.articles.length; i++) if (S.articles[i].id === id) return S.articles[i];
    return null;
  }
  function epTitle(e) { return '第' + e.no + '話　^' + e.title; }
  function fromArt(a) {
    return { url: artUrl(a), title: a.title, dek: a.dek, thumb: a.thumb, credit: a.credit, date: a.date, cat: a.cat, kind: a.kind };
  }
  function fromEp(e) {
    return { url: epUrl(e.no), title: epTitle(e), dek: plain(S.manga.title) + '（' + S.manga.schedule + '）', thumb: e.img, cat: 'manga' };
  }
  function fromNews(n) {
    return { url: n.links[0].url, title: n.title, dek: n.summary, thumb: n.thumb, credit: n.credit, date: n.date, cat: 'news', kind: n.kind, links: n.links };
  }
  function item(ref) {
    var i = ref.indexOf(':'), k = ref.slice(0, i), v = ref.slice(i + 1);
    if (k === 'a') { var a = findArt(v); return a ? fromArt(a) : null; }
    if (k === 'm') { var e = EPS[+v - 1]; return e ? fromEp(e) : null; }
    if (k === 'g') return { url: 'guide.html', title: S.guide.title, dek: S.guide.dek, thumb: 'img/towa.jpg', pos: '50% 12%', cat: 'guide' };
    return null;
  }
  function kindCount(id) {
    var n = 0;
    S.news.forEach(function (x) { if (x.kind === id) n++; });
    return n;
  }

  // ---------- 部品 ----------
  function labels(it) {
    var h = '<span class="cat cat-' + it.cat + '">' + CAT[it.cat] + '</span>';
    if (it.kind) h += '<a class="kd" href="news.html#' + it.kind + '">' + esc(KIND[it.kind]) + '</a>';
    return '<p class="labels">' + h + '</p>';
  }
  function thumb(it, extra) {
    var inner = it.thumb
      ? '<img src="' + esc(it.thumb) + '" alt="" loading="lazy"' + (it.pos ? ' style="object-position:' + esc(it.pos) + '"' : '') + '>'
      : '<span class="eye"><b>頭</b><small>' + CAT[it.cat] + '</small></span>';
    return '<a class="th' + (extra ? ' ' + extra : '') + '" href="' + esc(it.url) + '"' + tgt(it.url) + ' tabindex="-1" aria-hidden="true">' + inner + '</a>';
  }
  function credit(c) {
    if (!c) return '';
    var l = c.url ? '<a href="' + esc(c.url) + '"' + tgt(c.url) + '>' + esc(c.label) + '</a>' : esc(c.label);
    return '<p class="cr">画像出典：' + l + (c.note ? '（' + esc(c.note) + '）' : '') + (c.copy ? ' ' + esc(c.copy) : '') + '</p>';
  }
  function title(it, tag) {
    return '<' + tag + ' class="tt"><a href="' + esc(it.url) + '"' + tgt(it.url) + '>' + ph(it.title) +
      (isExt(it.url) ? EXI + '<span class="skip">（外部サイト）</span>' : '') + '</a></' + tag + '>';
  }
  function date(it) { return it.date ? '<p class="dt"><time datetime="' + esc(it.date) + '">' + fdate(it.date) + '</time></p>' : ''; }
  function sources(links) {
    return '<p class="src"><span>出典</span>' + links.map(function (l) {
      return '<a href="' + esc(l.url) + '"' + tgt(l.url) + '>' + esc(l.label) + '</a>';
    }).join('') + '</p>';
  }
  function cardL(it) {
    return '<article class="card card-l">' + thumb(it) + '<div class="bd">' + labels(it) + title(it, 'h3') +
      (it.dek ? '<p class="dek">' + esc(plain(it.dek)) + '</p>' : '') + date(it) + credit(it.credit) + '</div></article>';
  }
  function cardS(it) {
    return '<article class="card">' + thumb(it) + '<div class="bd">' + labels(it) + title(it, 'h3') + date(it) + credit(it.credit) + '</div></article>';
  }
  function row(it, full, attrs) {
    return '<article class="row"' + (attrs || '') + '>' + thumb(it) + '<div class="bd">' + labels(it) + title(it, 'h3') +
      (full && it.dek ? '<p class="dek">' + esc(plain(it.dek)) + '</p>' : '') +
      (full && it.links ? sources(it.links) : '') + date(it) + credit(it.credit) + '</div></article>';
  }
  function sh(en, ja, link, txt) {
    return '<div class="sh"><div><p class="en">' + en + '</p><h2>' + ph(ja) + '</h2></div>' +
      (link ? '<a class="more" href="' + link + '">' + txt + ' →</a>' : '') + '</div>';
  }
  function phd(en, ja, lead) {
    return '<header class="phd"><p class="en">' + en + '</p><h1>' + ph(ja) + '</h1>' + (lead ? '<p class="lead">' + lead + '</p>' : '') + '</header>';
  }
  function bc(list) {
    return '<nav class="bc" aria-label="現在地"><ol><li><a href="./">トップ</a></li>' + list.map(function (x, i) {
      return i === list.length - 1 ? '<li aria-current="page">' + esc(plain(x[0])) + '</li>' : '<li><a href="' + x[1] + '">' + esc(x[0]) + '</a></li>';
    }).join('') + '</ol></nav>';
  }
  function epCard(e, cur) {
    return '<a class="ep" href="' + epUrl(e.no) + '"' + (cur ? ' aria-current="page"' : '') + '><span class="th"><img src="' + esc(e.img) + '" alt="" loading="lazy"></span>' +
      '<span class="no">第' + e.no + '話</span><b>' + ph(e.title) + '</b></a>';
  }
  function shareUrl(file, text) {
    return 'https://x.com/intent/post?text=' + encodeURIComponent(text) + '&url=' + encodeURIComponent(BASE + file);
  }
  function share(file, text) {
    return '<div class="share"><span class="l">この記事をシェア</span><a class="btn" href="' + shareUrl(file, text) + '" target="_blank" rel="noopener">Xでポスト</a>' +
      '<button type="button" class="btn btn-o" data-copyurl="' + esc(BASE + file) + '">リンクをコピー</button></div>';
  }

  // ---------- 共通の枠 ----------
  var NAV = [['home', './', 'トップ'], ['news', 'news.html', 'ニュース'], ['features', 'features.html', '特集'],
    ['manga', 'manga.html', '連載漫画'], ['contents', 'contents.html', 'コンテンツ一覧'], ['blog', 'blog.html', 'ブログ'], ['guide', 'guide.html', '異形頭とは'],
    ['about', 'about.html', 'サイトについて']];
  var TP = { official: '公式・商業', indie: 'インディー・個人', hub: '探す場所・読み物' };
  var MEDIA_ORDER = ['漫画', 'アニメ', 'ゲーム', '小説', '映像', 'グッズ', 'ラジオ', '記事', 'イベント', '施設', '投稿サイト', '通販', 'SNS', '読み物', '辞典'];
  var WORKS = S.works || [];
  function typeCount(t) { var n = 0; WORKS.forEach(function (w) { if (w.type === t) n++; }); return n; }
  function navKey() {
    if (PAGE === 'article') { var a = findArt(ID); return a && a.cat === 'blog' ? 'blog' : 'features'; }
    if (PAGE === 'episode') return 'manga';
    return PAGE;
  }
  function header() {
    var cur = navKey();
    return '<a class="skip" href="#main">本文へ移動</a>' +
      '<header class="site-hd"><div class="wrap"><a class="logo" href="./"><span class="logo-t">アタマノ<b>カタチ</b></span><span class="logo-s">' + esc(S.site.tagline) + '</span></a>' +
      '<a class="xbtn" href="' + X + '" target="_blank" rel="noopener">X @' + esc(S.site.x) + '</a></div></header>' +
      '<nav class="gnav" aria-label="メニュー"><div class="wrap"><ul>' + NAV.map(function (n) {
        return '<li><a href="' + n[1] + '"' + (n[0] === cur ? ' aria-current="page"' : '') + '>' + n[2] + '</a></li>';
      }).join('') + '</ul></div></nav>' +
      '<div class="kindbar"><div class="wrap"><span class="l">頭種で探す</span>' + S.kinds.map(function (k) {
        return '<a class="chip" href="news.html#' + k.id + '">' + esc(k.name) + '</a>';
      }).join('') + '</div></div>';
  }
  function footer() {
    return '<footer class="site-ft"><div class="wrap"><div><p class="logo-t">アタマノ<b>カタチ</b></p><p class="ab">' + esc(S.site.about) + '</p></div>' +
      '<ul class="ft-links">' + NAV.map(function (n) { return '<li><a href="' + n[1] + '">' + n[2] + '</a></li>'; }).join('') +
      '<li><a href="policy.html">サイトポリシー</a></li><li><a href="policy.html#takedown">取り下げのご依頼</a></li>' +
      '<li><a href="' + X + '" target="_blank" rel="noopener">X @' + esc(S.site.x) + '</a></li></ul>' +
      '<p class="copy">© 2026 アタマノカタチ　｜　画像の権利は各権利者に帰属します</p></div></footer>';
  }
  function aside() {
    var rec = S.recommend.map(item).filter(Boolean).map(function (it) {
      return '<li>' + thumb(it) + '<div class="bd">' + labels(it) + '<a class="t" href="' + esc(it.url) + '">' + ph(it.title) + '</a></div></li>';
    }).join('');
    return '<aside class="side" aria-label="サイドメニュー">' +
      '<section class="box follow"><img src="img/x_icon.png" alt="" width="64" height="64"><div><p class="fn">アタマノカタチ</p><p class="fh">@' + esc(S.site.x) + '</p></div>' +
      '<p class="ft">連載漫画とニュースを、Xで毎週お届けしています。推しの頭は #アタマノカタチ で教えてください。</p>' +
      '<a class="btn" href="' + X + '" target="_blank" rel="noopener">Xでフォローする</a></section>' +
      '<section class="box"><h2 class="bh">編集部のおすすめ</h2><ul class="mini">' + rec + '</ul></section>' +
      '<section class="box"><h2 class="bh">頭種で探す</h2><p class="chips">' + S.kinds.map(function (k) {
        return '<a class="chip" href="news.html#' + k.id + '">' + esc(k.name) + ' <span>' + kindCount(k.id) + '</span></a>';
      }).join('') + '</p></section>' +
      '<section class="box"><h2 class="bh">異形頭コンテンツ一覧</h2><p class="dek">公式からインディーまで、異形頭が出てくる作品・イベント・探す場所を' + WORKS.length + '件まとめています。</p>' +
      '<a class="btn btn-o" href="contents.html">一覧を見る</a></section>' +
      '<section class="box"><h2 class="bh">連載中</h2>' + epCard(LATEST) + '<p class="dt">' + esc(S.manga.schedule) + '　全' + EPS.length + '話</p>' +
      '<a class="btn btn-o" href="manga.html">作品ページへ</a></section>' +
      '<section class="box about"><h2 class="bh">このサイトについて</h2><p>' + esc(S.site.about) + '</p>' +
      '<p class="links"><a href="about.html">くわしく</a><a href="policy.html">サイトポリシー</a><a href="policy.html#takedown">取り下げのご依頼</a></p></section>' +
      '</aside>';
  }
  function layout(main) {
    return '<div class="wrap layout"><div class="main" id="main">' + main + '</div>' + aside() + '</div>';
  }

  // ---------- 各ページ ----------
  function mangaBlock() {
    return '<section class="mb">' + sh('SERIES', '連載漫画', 'manga.html', '作品ページへ') +
      '<div class="mb-in"><a class="mb-img" href="' + epUrl(LATEST.no) + '"><img src="' + esc(LATEST.img) + '" alt="' + esc(plain(epTitle(LATEST))) + 'の1ページ目" loading="lazy"></a>' +
      '<div class="mb-tx"><p class="sched">' + esc(S.manga.schedule) + '</p><h3>' + ph(S.manga.title) + '</h3><p>' + esc(S.manga.tagline) + '</p>' +
      '<p class="latest">最新話：' + esc(plain(epTitle(LATEST))) + '</p>' +
      '<p class="btns"><a class="btn" href="' + epUrl(LATEST.no) + '">最新話を読む</a><a class="btn btn-o" href="' + epUrl(1) + '">第1話から読む</a></p></div></div>' +
      '<div class="strip">' + EPS.map(function (e) { return epCard(e); }).join('') + '</div></section>';
  }
  function guideBanner() {
    var g = S.guide;
    return '<section class="gb"><img src="img/towa.jpg" alt="" width="700" height="1050" loading="lazy"><div class="tx"><p class="en">GUIDE</p><h2>' + ph(g.title) + '</h2>' +
      '<p>' + ph(g.def) + '</p><p><a class="btn btn-o" href="guide.html">入門ページを読む</a></p></div></section>';
  }
  function pageHome() {
    var p = S.picks.map(item).filter(Boolean);
    var hello = '<div class="hello"><div class="wrap"><p><b>はじめての方へ</b><span>アタマノカタチは、異形頭のニュース・連載漫画・作品一覧をまとめる、個人運営のファンメディアです。</span><a href="about.html">このサイトについて →</a></p></div></div>';
    var hero = hello + '<section class="hero" aria-label="ピックアップ"><div class="wrap">' + sh('PICK UP', 'ピックアップ') +
      '<div class="hero-g">' + cardL(p[0]) + '<div class="hero-s">' + p.slice(1).map(cardS).join('') + '</div></div></div></section>';
    var news = S.news.slice().sort(byDate).slice(0, 5).map(function (n) { return row(fromNews(n), false); }).join('');
    var feats = S.articles.filter(function (a) { return a.cat === 'feature' || a.cat === 'pickup'; }).sort(byDate).slice(0, 2).map(function (a) { return cardS(fromArt(a)); }).join('');
    var blogs = S.articles.filter(function (a) { return a.cat === 'blog'; }).sort(byDate).slice(0, 3).map(function (a) { return row(fromArt(a), true); }).join('');
    var main =
      '<section>' + sh('NEWS', '新着ニュース', 'news.html', 'ニュース一覧へ') + '<div class="rows">' + news + '</div></section>' +
      mangaBlock() +
      '<section>' + sh('CONTENTS', '異形頭コンテンツ一覧', 'contents.html', '一覧へ') +
      '<p class="dek" style="margin-bottom:12px">漫画・アニメ・ゲームから、個人の作品、イベント、探す場所まで。検索と並べ替えができます。</p><div class="cb">' +
      ['official', 'indie', 'hub'].map(function (t) {
        return '<a class="stat" href="contents.html#' + t + '"><b>' + typeCount(t) + '</b><span>' + TP[t] + '</span></a>';
      }).join('') + '</div></section>' +
      '<section>' + sh('FEATURE', '特集・ピックアップ', 'features.html', '一覧へ') + '<div class="grid2">' + feats + '</div></section>' +
      '<section>' + sh('BLOG', '編集ブログ', 'blog.html', 'ブログ一覧へ') + '<div class="rows">' + blogs + '</div></section>' +
      guideBanner();
    return hero + layout(main);
  }
  function pageNews() {
    var all = S.news.slice().sort(byDate);
    var chips = '<p class="chips" role="group" aria-label="頭種で絞り込む"><a class="chip" href="#all" data-k="">すべて <span>' + all.length + '</span></a>' +
      S.kinds.map(function (k) { return '<a class="chip" href="#' + k.id + '" data-k="' + k.id + '">' + esc(k.name) + ' <span>' + kindCount(k.id) + '</span></a>'; }).join('') + '</p>';
    var list = all.map(function (n) { return row(fromNews(n), true, ' data-kind="' + esc(n.kind) + '"'); }).join('');
    return layout(bc([['ニュース']]) +
      '<section class="stack">' + phd('NEWS', 'ニュース', '異形頭まわりの新作・新刊・イベントを、出典つきで短く紹介しています。見出しを押すと、出典の記事が新しいタブで開きます。') +
      chips + '<p class="now" id="now" aria-live="polite"></p><div class="rows" id="newslist">' + list + '</div>' +
      '<p class="empty" id="empty" hidden>この頭種のニュースは、まだありません。情報は X の #アタマノカタチ で受け付けています。</p></section>');
  }
  function pageFeatures() {
    var list = S.articles.filter(function (a) { return a.cat === 'feature' || a.cat === 'pickup'; }).sort(byDate).map(function (a) { return cardL(fromArt(a)); }).join('');
    return layout(bc([['特集・ピックアップ']]) + '<section class="stack">' +
      phd('FEATURE', '特集・ピックアップ', 'イベントのまとめや、気になる作品の深掘り記事です。') + '<div class="grid2">' + list + '</div></section>');
  }
  function pageBlog() {
    var list = S.articles.filter(function (a) { return a.cat === 'blog'; }).sort(byDate).map(function (a) { return row(fromArt(a), true); }).join('');
    var up = '<section class="box"><h2 class="bh">これから書く予定</h2><ul class="linklist" style="list-style:disc;padding-left:1.2em">' +
      S.upcoming.map(function (u) { return '<li>' + esc(u) + '</li>'; }).join('') + '</ul></section>';
    return layout(bc([['編集ブログ']]) + '<section class="stack">' +
      phd('BLOG', '編集ブログ', 'ニュースには入りきらない「この頭のここが好き」を書いています。') + '<div class="rows">' + list + '</div>' + up + '</section>');
  }
  function pageManga() {
    var first = EPS[0];
    var hero = '<div class="mb-in series"><a class="mb-img" href="' + epUrl(1) + '"><img src="' + esc(first.img) + '" alt="第1話の1ページ目"></a>' +
      '<div class="mb-tx"><p class="sched">' + esc(S.manga.schedule) + '</p><h1>' + ph(S.manga.title) + '</h1><p>' + esc(S.manga.tagline) + '</p>' +
      '<p class="latest">全' + EPS.length + '話　最新話：' + esc(plain(epTitle(LATEST))) + '</p>' +
      '<p class="btns"><a class="btn" href="' + epUrl(1) + '">第1話から読む</a><a class="btn btn-o" href="' + epUrl(LATEST.no) + '">最新話を読む</a></p></div></div>';
    return layout(bc([['連載漫画']]) + '<section class="stack">' + hero +
      sh('EPISODES', '話の一覧') + '<div class="epgrid">' + EPS.map(function (e) { return epCard(e); }).join('') + '</div>' +
      '<p class="dek">感想は X で #アタマノカタチ を付けてポストしてもらえるとうれしいです。</p></section>');
  }
  function pageEpisode() {
    var no = +ID, e = EPS[no - 1];
    if (!e) return layout('<p class="empty">この話は見つかりませんでした。<a href="manga.html">話の一覧へ</a></p>');
    var prev = EPS[no - 2], next = EPS[no];
    var nav = '<nav class="epnav" aria-label="前後の話">' +
      (prev ? '<a href="' + epUrl(prev.no) + '"><small>← 前の話</small><span>' + esc(plain(epTitle(prev))) + '</span></a>' : '<span></span>') +
      (next ? '<a class="n" href="' + epUrl(next.no) + '"><small>次の話 →</small><span>' + esc(plain(epTitle(next))) + '</span></a>' : '<a class="n" href="manga.html"><small>最新話です</small><span>話の一覧へ戻る</span></a>') + '</nav>';
    var text = plain(S.manga.title) + ' 第' + e.no + '話「' + plain(e.title) + '」 #アタマノカタチ #異形頭';
    return layout(bc([['連載漫画', 'manga.html'], ['第' + e.no + '話']]) +
      '<article class="reader"><header class="phd"><p class="en">' + esc(plain(S.manga.title)) + '</p><h1>' + ph(epTitle(e)) + '</h1></header>' +
      '<div class="pg"><img src="' + esc(e.img) + '" alt="' + esc(plain(epTitle(e))) + '。' + esc(e.alt) + '" width="' + e.w + '" height="' + e.h + '"></div>' +
      '<p class="hint">画面がせまいときは、漫画を横にスクロールして読めます。</p>' + nav + share(epUrl(e.no), text) +
      sh('EPISODES', '話の一覧', 'manga.html', '作品ページへ') + '<div class="strip">' + EPS.map(function (x) { return epCard(x, x.no === e.no); }).join('') + '</div></article>');
  }
  function block(b) {
    if (b.p) return '<p>' + fmt(b.p) + '</p>';
    if (b.h) return '<h2>' + ph(b.h) + '</h2>';
    if (b.note) return '<p class="note">' + fmt(b.note) + '</p>';
    if (b.table) {
      var head = b.head ? '<thead><tr>' + b.head.map(function (h) { return '<th scope="col">' + esc(h) + '</th>'; }).join('') + '</tr></thead>' : '';
      var rows = b.table.map(function (r) {
        return b.head ? '<tr><td>' + esc(r[0]) + '</td><td>' + esc(r[1]) + '</td></tr>' : '<tr><th scope="row">' + esc(r[0]) + '</th><td>' + esc(r[1]) + '</td></tr>';
      }).join('');
      return '<div class="tbl"><table>' + head + '<tbody>' + rows + '</tbody></table></div>';
    }
    if (b.links) return '<ul class="linklist">' + b.links.map(function (l) { return '<li><a href="' + esc(l.url) + '"' + tgt(l.url) + '>' + esc(l.label) + (isExt(l.url) ? EXI : '') + '</a></li>'; }).join('') + '</ul>';
    return '';
  }
  function pageArticle() {
    var a = findArt(ID);
    if (!a) return layout('<p class="empty">記事が見つかりませんでした。<a href="./">トップへ</a></p>');
    var it = fromArt(a);
    var crumb = a.cat === 'blog' ? ['編集ブログ', 'blog.html'] : ['特集・ピックアップ', 'features.html'];
    var fig = a.thumb ? '<figure class="fig"><img src="' + esc(a.thumb) + '" alt="">' + (a.credit ? '<figcaption>' + credit(a.credit).replace(/^<p class="cr">|<\/p>$/g, '') + '</figcaption>' : '') + '</figure>' : '';
    var tags = '<p class="tags"><span class="cat cat-' + a.cat + '">' + CAT[a.cat] + '</span>' + (a.kind ? '<a class="chip" href="news.html#' + a.kind + '">頭種：' + esc(KIND[a.kind]) + '</a>' : '') + '</p>';
    var rel = (a.related || []).map(item).filter(Boolean).map(cardS).join('');
    return layout(bc([crumb, [a.title]]) +
      '<article class="art">' + labels(it) + '<h1>' + ph(a.title) + '</h1>' + (a.dek ? '<p class="dek">' + esc(a.dek) + '</p>' : '') +
      '<p class="byl"><time datetime="' + esc(a.date) + '">' + fdate(a.date) + '</time><span>文：' + esc(a.author) + '</span></p>' + fig +
      '<div class="prose">' + a.body.map(block).join('') + '</div>' + tags + share(artUrl(a), plain(a.title) + '｜アタマノカタチ') +
      '<div class="author"><div class="face" aria-hidden="true">頭</div><div><p class="kana">あたまのかたち へんしゅうぶ</p><p class="nm">' + esc(a.author) + '</p>' +
      '<p class="bio">異形頭の漫画・ゲーム・仮面・造形・イベントを追いかける、個人運営のファンメディアです。Xでは連載漫画とニュースを毎週お届けしています。</p></div></div>' +
      '</article>' + (rel ? '<section>' + sh('RELATED', 'あわせて読みたい') + '<div class="grid3">' + rel + '</div></section>' : ''));
  }
  function pageGuide() {
    var g = S.guide;
    var kinds = S.kinds.map(function (k) {
      var n = kindCount(k.id);
      return '<div class="kcard"><h3>' + esc(k.name) + '</h3><p>' + esc(g.kinds[k.id] || '') + '</p>' +
        (n ? '<a href="news.html#' + k.id + '">この頭種のニュース（' + n + '件）→</a>' : '<span class="dt">ニュースはまだありません</span>') + '</div>';
    }).join('');
    var shelf = g.shelf.map(function (x) {
      return '<div><span class="cat cat-guide">' + esc(x.tag) + '</span><h3>' + esc(x.title) + '</h3><p>' + esc(x.text) + '</p><a href="' + esc(x.url) + '"' + tgt(x.url) + '>' + esc(x.label) + '</a></div>';
    }).join('');
    var eps = '<div class="strip">' + EPS.map(function (e) { return epCard(e); }).join('') + '</div>';
    return layout(bc([[g.title]]) + '<div class="stack" style="gap:40px">' + phd('GUIDE', g.title, g.dek) +
      '<section class="towa"><img src="img/towa.jpg" alt="スーツ姿の人物のシルエット。頭が四角い板になっていて、白いはてなマークが描かれている" width="700" height="1050">' +
      '<div class="tx"><p class="yomi">' + esc(g.yomi) + '</p><p class="def">' + ph(g.def) + '</p>' + g.body.map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') +
      '<p class="dek">読み方に決まりはありません。くわしくは漫画の<a href="' + epUrl(3) + '">第3話「読み方問題編」</a>で。人外との違いは<a href="' + epUrl(4) + '">第4話</a>で描いています。</p>' +
      '<p><a href="' + esc(g.more.url) + '" target="_blank" rel="noopener">もっと詳しく：' + esc(g.more.label) + '</a></p></div></section>' +
      '<section>' + sh('KINDS', '頭種（とうしゅ）一覧') + '<div class="kgrid">' + kinds + '</div></section>' +
      '<section>' + sh('BOOKS', 'まず読むなら', 'contents.html', 'コンテンツ一覧へ') + '<div class="shelf">' + shelf + '</div></section>' +
      '<section>' + sh('MANGA', '漫画で知る', 'manga.html', '作品ページへ') + eps + '</section></div>');
  }
  // ---------- コンテンツ一覧 ----------
  function norm(s) {
    s = String(s || '');
    if (s.normalize) s = s.normalize('NFKC');
    return s.toLowerCase().replace(/[ァ-ヶ]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) - 0x60); });
  }
  function host(u) {
    if (!isExt(u)) return 'このサイト';
    var m = /^https?:\/\/([^\/]+)/.exec(u);
    return m ? m[1].replace(/^www\./, '') : '';
  }
  function workHtml(w) {
    var u = w.links[0].url;
    return '<article class="work"><div class="w-top"><h2 class="w-name"><a href="' + esc(u) + '"' + tgt(u) + '>' + ph(w.name) + (isExt(u) ? EXI : '') + '</a></h2>' +
      '<p class="labels"><span class="tp tp-' + w.type + '">' + TP[w.type] + '</span>' +
      w.media.map(function (m) { return '<span class="md">' + esc(m) + '</span>'; }).join('') +
      (w.kinds || []).map(function (k) { return '<span class="kd">' + esc(KIND[k]) + '</span>'; }).join('') + '</p></div>' +
      '<p class="w-meta">' + esc(w.creator) + (w.when ? '<span class="sep">｜</span>' + esc(w.when) : '') + '</p>' +
      '<p class="w-desc">' + esc(w.desc) + '</p>' +
      '<p class="w-links">' + w.links.map(function (l) {
        return '<a class="lnk" href="' + esc(l.url) + '"' + tgt(l.url) + '>' + esc(l.label) + '<small>' + esc(host(l.url)) + '</small>' + (isExt(l.url) ? EXI : '') + '</a>';
      }).join('') + '</p></article>';
  }
  function pageContents() {
    var media = [];
    WORKS.forEach(function (w) { w.media.forEach(function (m) { if (media.indexOf(m) < 0) media.push(m); }); });
    media.sort(function (a, b) { return MEDIA_ORDER.indexOf(a) - MEDIA_ORDER.indexOf(b); });
    var form = '<form class="wf" role="search" aria-label="コンテンツを探す" onsubmit="return false">' +
      '<label class="wf-q" for="wq"><span>キーワード</span><input type="search" id="wq" placeholder="作品名・作者・頭の種類など" autocomplete="off"></label>' +
      '<label for="wm"><span>媒体</span><select id="wm"><option value="">すべて</option>' + media.map(function (m) { return '<option value="' + esc(m) + '">' + esc(m) + '</option>'; }).join('') + '</select></label>' +
      '<label for="wk"><span>頭種</span><select id="wk"><option value="">すべて</option>' + S.kinds.map(function (k) { return '<option value="' + k.id + '">' + esc(k.name) + '</option>'; }).join('') + '</select></label>' +
      '<label for="ws"><span>並び順</span><select id="ws"><option value="kana">名前順（あいうえお）</option><option value="new">新しい順</option><option value="old">古い順</option><option value="media">媒体順</option></select></label></form>';
    var chips = '<p class="chips" role="group" aria-label="区分で絞り込む"><button type="button" class="chip" data-t="" aria-pressed="true">すべて <span>' + WORKS.length + '</span></button>' +
      ['official', 'indie', 'hub'].map(function (t) { return '<button type="button" class="chip" data-t="' + t + '" aria-pressed="false">' + TP[t] + ' <span>' + typeCount(t) + '</span></button>'; }).join('') + '</p>';
    var cta = '<section class="box"><h2 class="bh">載せたい作品を募集しています</h2><p class="dek">個人の作品・同人誌・イベント・お店など、異形頭が出てくるものを教えてください。X の <a href="' + X + '" target="_blank" rel="noopener">@' + esc(S.site.x) + '</a> へのDMか、#アタマノカタチ を付けたポストで受け付けています。掲載をやめたい場合も同じ窓口へどうぞ。</p></section>';
    return layout(bc([['コンテンツ一覧']]) + '<section class="stack">' +
      phd('CONTENTS', '異形頭^コンテンツ一覧', '公式の作品から個人の創作、イベントや探す場所まで、異形頭が出てくるものをまとめています。名前やボタンを押すと、公式サイトや紹介ページが開きます。') +
      form + chips + '<p class="now" id="wcount" aria-live="polite"></p><div class="works" id="wlist"></div>' +
      '<p class="empty" id="wempty" hidden>条件に合うコンテンツがありません。キーワードを短くするか、絞り込みを「すべて」に戻してください。</p>' + cta + '</section>');
  }
  function bindContents() {
    var q = document.getElementById('wq'), wm = document.getElementById('wm'), wk = document.getElementById('wk'), ws = document.getElementById('ws');
    var list = document.getElementById('wlist'), count = document.getElementById('wcount'), empty = document.getElementById('wempty');
    var chips = Array.prototype.slice.call(document.querySelectorAll('[data-t]'));
    var type = (location.hash || '').slice(1);
    if (!TP[type]) type = '';
    var hay = WORKS.map(function (w) {
      return norm([w.name, w.kana, w.creator, w.desc, w.when, w.media.join(' '), (w.kinds || []).map(function (k) { return KIND[k]; }).join(' '), TP[w.type]].join(' '));
    });
    function byKana(a, b) { return a.kana.localeCompare(b.kana, 'ja'); }
    function run() {
      var terms = norm(q.value).split(/\s+/).filter(Boolean);
      var rows = [];
      WORKS.forEach(function (w, i) {
        if (type && w.type !== type) return;
        if (wm.value && w.media.indexOf(wm.value) < 0) return;
        if (wk.value && (w.kinds || []).indexOf(wk.value) < 0) return;
        for (var j = 0; j < terms.length; j++) if (hay[i].indexOf(terms[j]) < 0) return;
        rows.push(w);
      });
      var mode = ws.value;
      rows.sort(function (a, b) {
        if (mode === 'new' || mode === 'old') {
          var ya = a.year == null ? null : a.year, yb = b.year == null ? null : b.year;
          if (ya === null && yb === null) return byKana(a, b);
          if (ya === null) return 1;
          if (yb === null) return -1;
          return (mode === 'new' ? yb - ya : ya - yb) || byKana(a, b);
        }
        if (mode === 'media') return (MEDIA_ORDER.indexOf(a.media[0]) - MEDIA_ORDER.indexOf(b.media[0])) || byKana(a, b);
        return byKana(a, b);
      });
      list.innerHTML = rows.map(workHtml).join('');
      count.textContent = WORKS.length + '件中 ' + rows.length + '件を表示' + (mode === 'new' || mode === 'old' ? '（年がわからないものは最後）' : '');
      empty.hidden = rows.length > 0;
      chips.forEach(function (c) { c.setAttribute('aria-pressed', String(c.getAttribute('data-t') === type)); });
    }
    chips.forEach(function (c) { c.addEventListener('click', function () { type = c.getAttribute('data-t'); run(); }); });
    [q, wm, wk, ws].forEach(function (el) { el.addEventListener('input', run); el.addEventListener('change', run); });
    run();
  }

  // ---------- このサイトについて ----------
  function pageAbout() {
    var A = S.about || { intro: [], rules: [], schedule: [] };
    var blogN = S.articles.filter(function (a) { return a.cat === 'blog'; }).length;
    var featN = S.articles.filter(function (a) { return a.cat === 'feature' || a.cat === 'pickup'; }).length;
    var corners = [
      ['NEWS', 'ニュース', 'news.html', '異形頭まわりの新作・新刊・イベントを、出典つきで短く紹介します。頭種で絞り込めます。', S.news.length + '件'],
      ['FEATURE', '特集・ピックアップ', 'features.html', 'イベントのまとめや、気になる作品を深掘りする記事です。', featN + '本'],
      ['SERIES', '連載漫画', 'manga.html', '「漫画でわかる！異形頭の世界」。読み方や人外との違いなど、異形頭の基本を漫画で。', '全' + EPS.length + '話'],
      ['CONTENTS', 'コンテンツ一覧', 'contents.html', '公式からインディーまで、異形頭が出てくる作品・イベント・探す場所の一覧。検索と並べ替えができます。', WORKS.length + '件'],
      ['BLOG', '編集ブログ', 'blog.html', 'ニュースには入りきらない「この頭のここが好き」を書いています。', blogN + '本'],
      ['GUIDE', '異形頭とは', 'guide.html', 'はじめての人に向けた入門ページ。定義・読み方・頭種・まず読む作品。', '入門']
    ].map(function (c) {
      return '<a class="corner" href="' + c[2] + '"><span class="en">' + c[0] + '</span><b>' + c[1] + '</b><span class="cn">' + esc(c[4]) + '</span><p>' + esc(c[3]) + '</p></a>';
    }).join('');
    var kinds = S.kinds.map(function (k) {
      return '<li><a class="chip" href="news.html#' + k.id + '">' + esc(k.name) + '</a><span>' + esc(S.guide.kinds[k.id] || '') + '</span></li>';
    }).join('');
    var list = function (arr) { return '<ul class="ul">' + arr.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>'; };
    var team = '<div class="team"><img src="img/x_icon.png" alt="広報担当の拡声器頭のキャラクター" width="88" height="88">' +
      '<div class="tbl"><table><tbody>' +
      '<tr><th scope="row">サイト名</th><td>アタマノカタチ（異形頭系総合WEBメディア）</td></tr>' +
      '<tr><th scope="row">運営</th><td>アタマノカタチ編集部（個人の同人活動）</td></tr>' +
      '<tr><th scope="row">開設</th><td>' + esc(A.since || '') + '</td></tr>' +
      '<tr><th scope="row">X</th><td><a href="' + X + '" target="_blank" rel="noopener">@' + esc(S.site.x) + EXI + '</a></td></tr>' +
      '<tr><th scope="row">広報担当</th><td>拡声器頭のキャラクター（Xのアイコン）</td></tr>' +
      '<tr><th scope="row">連絡先</th><td>XのDM（掲載の取り下げ・訂正もこちら）</td></tr>' +
      '</tbody></table></div></div>';
    return layout(bc([['このサイトについて']]) + '<div class="stack about" style="gap:40px">' +
      phd('ABOUT', 'このサイトについて', esc(A.intro[0] || '')) +
      '<section class="prose">' + A.intro.slice(1).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') + '</section>' +
      '<section>' + sh('CORNERS', 'コーナー案内') + '<div class="corners">' + corners + '</div></section>' +
      '<section>' + sh('TOUSHU', '頭種（とうしゅ）について') +
      '<p class="lead2">記事や作品には、頭の種類ごとの札「頭種」を付けています。札を押すと、その頭種のニュースだけを見られます。</p><ul class="klist">' + kinds + '</ul></section>' +
      '<section>' + sh('SCHEDULE', '更新のペース') + list(A.schedule) + '</section>' +
      '<section>' + sh('RULES', '掲載の方針', 'policy.html', 'サイトポリシー') + list(A.rules) + '</section>' +
      '<section class="box"><h2 class="bh">情報提供・掲載希望</h2><p class="dek">新作や個人の創作、イベント、お店など、異形頭が出てくるものを教えてください。X の <a href="' + X + '" target="_blank" rel="noopener">@' + esc(S.site.x) + '</a> へのDMか、#アタマノカタチ を付けたポストで受け付けています。</p>' +
      '<p class="btns"><a class="btn" href="' + X + '" target="_blank" rel="noopener">Xでフォロー・DMする</a><a class="btn btn-o" href="policy.html#takedown">取り下げのご依頼</a></p></section>' +
      '<section>' + sh('TEAM', '運営') + team + '</section></div>');
  }

  function pagePolicy(staticHtml) {
    return layout(bc([['サイトポリシー']]) + '<div class="stack">' + phd('POLICY', 'サイトポリシー', '最終更新：2026年11月18日') + '<div class="doc">' + staticHtml + '</div></div>');
  }

  // ---------- 組み立て ----------
  var st = document.getElementById('static');
  var staticHtml = st ? st.innerHTML : '';
  var body;
  switch (PAGE) {
    case 'news': body = pageNews(); break;
    case 'features': body = pageFeatures(); break;
    case 'blog': body = pageBlog(); break;
    case 'manga': body = pageManga(); break;
    case 'episode': body = pageEpisode(); break;
    case 'article': body = pageArticle(); break;
    case 'guide': body = pageGuide(); break;
    case 'contents': body = pageContents(); break;
    case 'about': body = pageAbout(); break;
    case 'policy': body = pagePolicy(staticHtml); break;
    default: body = pageHome();
  }
  app.innerHTML = header() + body + footer();
  if (PAGE === 'contents') bindContents();

  // ニュースの頭種絞り込み（#mask などのアンカーで切り替え）
  if (PAGE === 'news') {
    var rowsEl = Array.prototype.slice.call(document.querySelectorAll('#newslist .row'));
    var chipsEl = Array.prototype.slice.call(document.querySelectorAll('[data-k]'));
    var nowEl = document.getElementById('now'), emptyEl = document.getElementById('empty');
    var applyKind = function () {
      var k = (location.hash || '').slice(1);
      if (!KIND[k]) k = '';
      var shown = 0;
      rowsEl.forEach(function (r) { var ok = !k || r.getAttribute('data-kind') === k; r.hidden = !ok; if (ok) shown++; });
      chipsEl.forEach(function (c) { c.setAttribute('aria-current', String(c.getAttribute('data-k') === k)); });
      nowEl.textContent = k ? '頭種「' + KIND[k] + '」のニュース　' + shown + '件' : '';
      emptyEl.hidden = shown > 0;
    };
    window.addEventListener('hashchange', applyKind);
    applyKind();
  }

  // ポリシーなどのページ内リンク（#takedown）へ移動
  if (location.hash && PAGE !== 'news' && PAGE !== 'contents') {
    var t = document.getElementById(location.hash.slice(1));
    if (t) t.scrollIntoView();
  }

  // リンクのコピー
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-copyurl]');
    if (!b) return;
    var u = b.getAttribute('data-copyurl');
    var done = function () { b.textContent = 'コピーしました'; setTimeout(function () { b.textContent = 'リンクをコピー'; }, 1600); };
    var fail = function () { b.textContent = u; };
    try { navigator.clipboard.writeText(u).then(done, fail); } catch (e) { fail(); }
  });
})();
