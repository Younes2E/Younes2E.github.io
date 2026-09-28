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

  var viewerItems = [];

  (function justifiedGallery() {
    var gallery = document.querySelector(".gallery");
    if (!gallery) return;

    var tiles = [];
    var breakAfter = [];

    [].slice.call(gallery.children).forEach(function (node) {
      if (node.classList.contains("tile")) {
        if (!node.hasAttribute("data-title")) {
          node.setAttribute("data-title", node.querySelector("img").getAttribute("alt") || "");
        }
        tiles.push(node);
      } else if (node.tagName === "BR") {
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

    var lastWidth = 0;

    function layout(settling) {
      var total = gallery.getBoundingClientRect().width;
      if (!total) return;
      lastWidth = total;

      var styles = getComputedStyle(gallery);
      var gap = parseFloat(styles.getPropertyValue("--gap")) || 0;
      var across = parseFloat(styles.getPropertyValue("--across")) || 2.5;

      var averageRatio = tiles.reduce(function (sum, tile) {
        return sum + ratioOf(tile);
      }, 0) / tiles.length;

      var target = (total / across) / averageRatio;

      var maxRowHeight = window.innerHeight * 0.8;

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
        var height = (total - gap * (items.length - 1)) / ratios;
        var capped = height > maxRowHeight;

        if (capped) {
          height = maxRowHeight;
          el.style.justifyContent = "center";
        }

        el.style.height = height + "px";

        items.forEach(function (it) {
          if (capped) {
            it.tile.style.flexGrow = "0";
            it.tile.style.flexBasis = (it.ratio * height) + "px";
          } else {
            it.tile.style.flexGrow = it.ratio / ratios;
            it.tile.style.flexBasis = "";
          }
          el.appendChild(it.tile);
        });

        fragment.appendChild(el);
      });

      gallery.innerHTML = "";
      gallery.appendChild(fragment);
      gallery.classList.add("is-justified");

      if (!settling && gallery.getBoundingClientRect().width !== total) layout(true);
    }

    layout();

    var pending = false;
    new ResizeObserver(function () {
      if (pending || gallery.getBoundingClientRect().width === lastWidth) return;
      pending = true;
      requestAnimationFrame(function () { pending = false; layout(); });
    }).observe(gallery);

    tiles.forEach(function (tile) {
      var img = tile.querySelector("img");
      if (img.getAttribute("width") && img.getAttribute("height")) return;
      if (!img.complete) img.addEventListener("load", function () { layout(); });
    });

    tiles.forEach(function (tile) {
      viewerItems.push({
        trigger: tile,
        src: tile.getAttribute("href"),
        title: tile.getAttribute("data-title") || ""
      });
    });
  })();

  [].slice.call(document.querySelectorAll("img.entry-teaser")).forEach(function (img) {
    viewerItems.push({
      trigger: img,
      src: img.getAttribute("src"),
      title: img.getAttribute("alt") || "",
      figure: true
    });
  });

  if (!viewerItems.length) return;

  var viewer = document.createElement("div");
  viewer.className = "viewer";
  viewer.innerHTML =
    '<div class="viewer-bar">' +
      '<span class="viewer-name"></span>' +
      '<button class="viewer-close" type="button" aria-label="Close">&times;</button>' +
    '</div>' +
    '<div class="viewer-stage"><img alt=""></div>' +
    '<button class="viewer-prev" type="button" aria-label="Previous">&#8249;</button>' +
    '<button class="viewer-next" type="button" aria-label="Next">&#8250;</button>';
  document.body.appendChild(viewer);

  var pageName = document.querySelector(".site-name");
  if (pageName) {
    viewer.querySelector(".viewer-name").textContent = pageName.textContent;
  }

  var stage = viewer.querySelector(".viewer-stage");
  var big = stage.querySelector("img");
  var index = 0;

  big.addEventListener("load", function () { big.classList.add("ready"); });
  big.draggable = false;

  var zoom = { s: 1, x: 0, y: 0 };
  var MAX_ZOOM = 8;

  function baseCentre() {
    return {
      x: big.offsetLeft + big.offsetWidth / 2,
      y: big.offsetTop + big.offsetHeight / 2
    };
  }

  function clampAxis(t, half, centre, size, prev) {
    var a = half - centre;
    var b = size - half - centre;
    var lo = Math.min(a, b);
    var hi = Math.max(a, b);
    if (prev !== undefined) {
      lo = Math.min(lo, prev);
      hi = Math.max(hi, prev);
    }
    return Math.min(hi, Math.max(lo, t));
  }

  function clampPan(prev) {
    if (zoom.s === 1) {
      zoom.x = 0;
      zoom.y = 0;
      return;
    }
    var c = baseCentre();
    var p = getComputedStyle(stage);
    var left = parseFloat(p.paddingLeft);
    var top = parseFloat(p.paddingTop);
    var w = stage.clientWidth - left - parseFloat(p.paddingRight);
    var h = stage.clientHeight - top - parseFloat(p.paddingBottom);
    zoom.x = clampAxis(zoom.x, big.offsetWidth * zoom.s / 2, c.x - left, w, prev && prev.x);
    zoom.y = clampAxis(zoom.y, big.offsetHeight * zoom.s / 2, c.y - top, h, prev && prev.y);
  }

  function applyZoom(prev, noClamp) {
    if (!noClamp) clampPan(prev);
    big.style.transform =
      "translate(" + zoom.x + "px, " + zoom.y + "px) scale(" + zoom.s + ")";
    stage.classList.toggle("zoomed", zoom.s > 1);
  }

  function resetZoom() {
    zoom = { s: 1, x: 0, y: 0 };
    applyZoom();
  }

  stage.addEventListener("wheel", function (e) {
    e.preventDefault();
    var next = Math.min(MAX_ZOOM, Math.max(1, zoom.s * Math.exp(-e.deltaY * 0.0015)));
    if (next === zoom.s) return;

    var r = stage.getBoundingClientRect();
    var c = baseCentre();
    var cx = e.clientX - (r.left + c.x) - zoom.x;
    var cy = e.clientY - (r.top + c.y) - zoom.y;
    var zoomingIn = next > zoom.s;
    var prev = { x: zoom.x * next / zoom.s, y: zoom.y * next / zoom.s };
    zoom.x += cx * (1 - next / zoom.s);
    zoom.y += cy * (1 - next / zoom.s);
    zoom.s = next;
    applyZoom(prev, zoomingIn);
  }, { passive: false });

  var drag = null;
  var dragged = false;

  var downOnBackdrop = false;

  stage.addEventListener("pointerdown", function (e) {
    downOnBackdrop = e.target === stage;
    if (zoom.s === 1 || e.button !== 0) return;
    drag = { px: e.clientX, py: e.clientY, x: zoom.x, y: zoom.y };
    dragged = false;
    stage.setPointerCapture(e.pointerId);
    stage.classList.add("dragging");
  });

  stage.addEventListener("pointermove", function (e) {
    if (!drag) return;
    var dx = e.clientX - drag.px;
    var dy = e.clientY - drag.py;
    if (Math.abs(dx) + Math.abs(dy) > 3) dragged = true;
    var prev = { x: zoom.x, y: zoom.y };
    zoom.x = drag.x + dx;
    zoom.y = drag.y + dy;
    applyZoom(prev);
  });

  function endDrag() {
    drag = null;
    stage.classList.remove("dragging");
  }

  stage.addEventListener("pointerup", endDrag);
  stage.addEventListener("pointercancel", endDrag);

  window.addEventListener("resize", function () {
    if (viewer.classList.contains("open")) applyZoom();
  });

  function show(n) {
    index = (n + viewerItems.length) % viewerItems.length;
    var item = viewerItems[index];
    resetZoom();
    big.classList.remove("ready");
    big.src = item.src;
    big.alt = item.title;
    big.classList.toggle("figure", !!item.figure);
  }

  function close() {
    viewer.classList.remove("open");
    document.body.style.overflow = "";
    resetZoom();
  }

  viewerItems.forEach(function (item, i) {
    item.trigger.addEventListener("click", function (e) {
      e.preventDefault();
      show(i);
      viewer.classList.add("open");
      document.body.style.overflow = "hidden";
    });
  });

  viewer.querySelector(".viewer-prev").addEventListener("click", function () { show(index - 1); });
  viewer.querySelector(".viewer-next").addEventListener("click", function () { show(index + 1); });
  viewer.querySelector(".viewer-close").addEventListener("click", close);

  stage.addEventListener("click", function () {
    if (downOnBackdrop && !dragged) close();
    dragged = false;
  });

  document.addEventListener("keydown", function (e) {
    if (!viewer.classList.contains("open")) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowLeft") show(index - 1);
    else if (e.key === "ArrowRight") show(index + 1);
  });
})();
