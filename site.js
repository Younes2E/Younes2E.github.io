/* The site is plain HTML. This file only adds the two things HTML can't do
   on its own: highlight the nav tab for the section you're looking at, and
   run the art gallery viewer.
   Each part exits immediately if its page isn't the current one. */

(function () {
  "use strict";

  /* ============================================================
     Nav: highlight the section currently in view
     ============================================================ */

  (function scrollspy() {
    var links = document.querySelectorAll("nav a[data-spy]");
    if (!links.length) return;

    // pair each tab with its section
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
        // a short last section never reaches the line, so force it
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

  /* ============================================================
     Art gallery
     ============================================================ */

  var gallery = document.querySelector(".gallery");
  if (!gallery) return;

  /* Read the gallery once, in markup order. Rows fill themselves by default;
     a <br> (or any .row-break) between two tiles forces a row to end there.
     The two mix freely — mark only the breaks you care about and the rest of
     the page still fills on its own.
     The markers are then dropped: layout() rebuilds the gallery on every
     pass, so nothing left in there survives, and the plan has to live in
     these two variables. */
  var tiles = [];
  var breakAfter = [];              // tile indices a row is forced to end on

  [].slice.call(gallery.children).forEach(function (node) {
    if (node.classList && node.classList.contains("tile")) {
      // The caption is written once, as the image's alt text, and mirrored
      // onto the tile here. CSS can't do it: the hover label is drawn by
      // .tile::after, and attr() only reads the element the pseudo-element
      // belongs to — never the alt of the <img> nested inside it.
      // An explicit data-title still wins, for a caption unlike the alt.
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

  /* ---- justified rows ----
     Give every image its natural proportions, then scale each row so it
     fills the width exactly. Pure CSS can't do this: grid column widths
     are decided before any image ratio is known. */

  function ratioOf(tile) {
    var img = tile.querySelector("img");
    // the width/height attributes give the ratio before the file has
    // loaded, so the very first layout is already right and nothing
    // shuffles about afterwards (they are lazy-loaded)
    var w = parseFloat(img.getAttribute("width"));
    var h = parseFloat(img.getAttribute("height"));
    if (w && h) return w / h;
    if (img.naturalWidth) return img.naturalWidth / img.naturalHeight;
    return 16 / 9;
  }

  function layout() {
    // the fractional width, not clientWidth's rounded integer: at any zoom
    // but 100% the real box is fractional, and that gap is what used to
    // push a tile onto the next line
    var total = gallery.getBoundingClientRect().width;
    if (!total) return;

    var styles = getComputedStyle(gallery);
    var gap = parseFloat(styles.getPropertyValue("--gap")) || 0;
    var across = parseFloat(styles.getPropertyValue("--across")) || 2.5;

    // Aim for `across` images per row. Their own ratio decides the height:
    // dividing by the average ratio of the set (the renders are 16:9) is
    // what keeps the count right — assuming a squarer ratio would let far
    // more of them fit on a row than asked for.
    var averageRatio = tiles.reduce(function (sum, tile) {
      return sum + ratioOf(tile);
    }, 0) / tiles.length;

    var target = (total / across) / averageRatio;

    // one image per row once they would get too small to read
    var single = total < 700;

    // ---- decide where the rows break ----
    var rows = [];
    var row = [];
    var sum = 0;                               // sum of the row's ratios

    tiles.forEach(function (tile, i) {
      var ratio = ratioOf(tile);
      row.push({ tile: tile, ratio: ratio });
      sum += ratio;

      var close = single ||                             // one per row
                  breakAfter.indexOf(i) !== -1 ||       // a marked break
                  // or the row's height has shrunk to the target
                  (total - gap * (row.length - 1)) / sum <= target;

      if (close) {
        rows.push(row);
        row = [];
        sum = 0;
      }
    });

    if (row.length) rows.push(row);            // whatever is left over

    // ---- build them ----
    // Every row is justified, without exception: one path, and the only
    // number set is the row's height. A trailing row of one or two images
    // does come out taller than the rest — put a <br> earlier in art.html
    // if that bothers you. That is the same control, used deliberately.
    var fragment = document.createDocumentFragment();

    rows.forEach(function (items) {
      var ratios = items.reduce(function (s, it) { return s + it.ratio; }, 0);

      var el = document.createElement("div");
      el.className = "gallery-row";
      el.style.height = (total - gap * (items.length - 1)) / ratios + "px";

      items.forEach(function (it) {
        // no width anywhere: flexbox splits the row in these proportions
        it.tile.style.flexGrow = it.ratio;
        el.appendChild(it.tile);               // moves it out of its old row
      });

      fragment.appendChild(el);
    });

    gallery.innerHTML = "";                    // drops the emptied old rows
    gallery.appendChild(fragment);
    gallery.classList.add("is-justified");
  }

  layout();

  // resize covers zoom changes too; coalesce bursts into one pass per frame
  var pending = false;
  window.addEventListener("resize", function () {
    if (pending) return;
    pending = true;
    requestAnimationFrame(function () { pending = false; layout(); });
  });

  // an image with no width/height attributes only reveals its ratio on load
  tiles.forEach(function (tile) {
    var img = tile.querySelector("img");
    if (img.getAttribute("width") && img.getAttribute("height")) return;
    if (!img.complete) img.addEventListener("load", layout);
  });

  /* ---- full-screen viewer ---- */

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

  // the bar carries the same name as the page, copied from it rather than
  // written out a second time
  var pageName = document.querySelector(".gallery-header .site-name");
  if (pageName) {
    viewer.querySelector(".viewer-name").textContent = pageName.textContent;
  }

  var stage = viewer.querySelector(".viewer-stage");
  var big = stage.querySelector("img");
  var index = 0;

  // each image fades in as it arrives: the class goes on once it has
  // decoded, and comes off again the moment a new src is set
  big.addEventListener("load", function () { big.classList.add("ready"); });

  function show(n) {
    index = (n + tiles.length) % tiles.length;    // wrap around
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

  // the backdrop closes, the image itself doesn't
  stage.onclick = function (e) { if (e.target === stage) close(); };

  document.addEventListener("keydown", function (e) {
    if (!viewer.classList.contains("open")) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowLeft") show(index - 1);
    else if (e.key === "ArrowRight") show(index + 1);
  });

})();
