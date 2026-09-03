(function () {
  "use strict";

  (function scrollspy() {
    var links = document.querySelectorAll("nav a[data-spy]");
    if (!links.length) return;

    var pairs = [];
    links.forEach(function (a) {
      var section = document.getElementById(a.getAttribute("data-spy"));
      if (section) pairs.push({ link: a, section: section });
    });
    if (!pairs.length) return;

    function update() {
      var atBottom = window.scrollY + window.innerHeight >=
                     document.documentElement.scrollHeight - 2;
      var current = pairs[0];

      if (atBottom) {
        current = pairs[pairs.length - 1];
      } else {
        var line = window.scrollY + 120;
        pairs.forEach(function (p) {
          if (p.section.offsetTop <= line) current = p;
        });
      }

      pairs.forEach(function (p) {
        p.link.classList.toggle("active", p === current);
      });
    }

    window.addEventListener("scroll", update, { passive: true });
    update();
  })();

  var gallery = document.querySelector(".gallery");
  if (!gallery) return;

  var tiles = [];
  var breakAfter = [];

  [].slice.call(gallery.children).forEach(function (node) {
    if (node.classList && node.classList.contains("tile")) {
      var img = node.querySelector("img");
      if (img && !node.hasAttribute("data-title")) {
        node.setAttribute("data-title", img.getAttribute("alt") || "");
      }
      tiles.push(node);
      return;
    }
    var isMarker = node.tagName === "BR" ||
                   (node.classList && node.classList.contains("row-break"));
    if (isMarker) {
      if (tiles.length) breakAfter.push(tiles.length - 1);
      node.remove();
    }
  });

  if (!tiles.length) return;

  function ratioOf(tile) {
    var img = tile.querySelector("img");
    var w = parseFloat(img.getAttribute("width"));
    var h = parseFloat(img.getAttribute("height"));
    if (w && h) return w / h;
    if (img.naturalWidth) return img.naturalWidth / img.naturalHeight;
    return 16 / 9;
  }

  function layout() {
    var total = gallery.getBoundingClientRect().width;
    if (!total) return;

    var styles = getComputedStyle(gallery);
    var gap = parseFloat(styles.getPropertyValue("--gap")) || 0;
    var across = parseFloat(styles.getPropertyValue("--across")) || 2.5;

    var averageRatio = tiles.reduce(function (sum, tile) {
      return sum + ratioOf(tile);
    }, 0) / tiles.length;

    var target = (total / across) / averageRatio;

    var single = total < 700;

    var rows = [];
    var row = [];
    var sum = 0;

    tiles.forEach(function (tile, i) {
      var ratio = ratioOf(tile);
      row.push({ tile: tile, ratio: ratio });
      sum += ratio;

      var close = single ||
                  breakAfter.indexOf(i) !== -1 ||
                  (total - gap * (row.length - 1)) / sum <= target;

      if (close) {
        rows.push(row);
        row = [];
        sum = 0;
      }
    });

    if (row.length) rows.push(row);

    var fragment = document.createDocumentFragment();

    rows.forEach(function (items) {
      var ratios = items.reduce(function (s, it) { return s + it.ratio; }, 0);

      var el = document.createElement("div");
      el.className = "gallery-row";
      el.style.height = (total - gap * (items.length - 1)) / ratios + "px";

      items.forEach(function (it) {
        it.tile.style.flexGrow = it.ratio;
        el.appendChild(it.tile);
      });

      fragment.appendChild(el);
    });

    gallery.innerHTML = "";
    gallery.appendChild(fragment);
    gallery.classList.add("is-justified");
  }

  layout();

  var pending = false;
  window.addEventListener("resize", function () {
    if (pending) return;
    pending = true;
    requestAnimationFrame(function () { pending = false; layout(); });
  });

  tiles.forEach(function (tile) {
    var img = tile.querySelector("img");
    if (img.getAttribute("width") && img.getAttribute("height")) return;
    if (!img.complete) img.addEventListener("load", layout);
  });

  var viewer = document.createElement("div");
  viewer.className = "viewer";
  viewer.innerHTML =
    '<div class="viewer-bar">' +
      '<span class="viewer-name"></span>' +
      '<button class="viewer-close" type="button" aria-label="Close">&times;</button>' +
    '</div>' +
    '<div class="viewer-stage"><img alt=""></div>' +
    '<div class="viewer-controls">' +
      '<button class="viewer-prev" type="button" aria-label="Previous">&#8249;</button>' +
      '<button class="viewer-next" type="button" aria-label="Next">&#8250;</button>' +
    '</div>';
  document.body.appendChild(viewer);

  var pageName = document.querySelector(".gallery-header .site-name");
  if (pageName) {
    viewer.querySelector(".viewer-name").textContent = pageName.textContent;
  }

  var stage = viewer.querySelector(".viewer-stage");
  var big = stage.querySelector("img");
  var index = 0;

  big.addEventListener("load", function () { big.classList.add("ready"); });

  function show(n) {
    index = (n + tiles.length) % tiles.length;
    var tile = tiles[index];
    big.classList.remove("ready");
    big.src = tile.getAttribute("href");
    big.alt = tile.getAttribute("data-title") || "";
  }

  function close() {
    viewer.classList.remove("open");
    document.body.style.overflow = "";
  }

  tiles.forEach(function (tile, i) {
    tile.addEventListener("click", function (e) {
      e.preventDefault();
      show(i);
      viewer.classList.add("open");
      document.body.style.overflow = "hidden";
    });
  });

  viewer.querySelector(".viewer-prev").onclick = function () { show(index - 1); };
  viewer.querySelector(".viewer-next").onclick = function () { show(index + 1); };
  viewer.querySelector(".viewer-close").onclick = close;

  stage.onclick = function (e) { if (e.target === stage) close(); };

  document.addEventListener("keydown", function (e) {
    if (!viewer.classList.contains("open")) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowLeft") show(index - 1);
    else if (e.key === "ArrowRight") show(index + 1);
  });
})();
