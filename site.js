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
      var atBottom = window.scrollY + window.innerHeight >= document.body.scrollHeight - 2;
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

  var tiles = [].slice.call(gallery.querySelectorAll(".tile"));
  if (!tiles.length) return;

  /* ---- justified rows ----
     Give every image its natural proportions, then scale each row so it
     fills the width exactly. Pure CSS can't do this: grid column widths
     are decided before any image ratio is known. */

  function ratioOf(tile) {
    var img = tile.querySelector("img");
    return img.naturalWidth ? img.naturalWidth / img.naturalHeight : 16 / 9;
  }

  function layout() {
    var total = gallery.clientWidth;
    if (!total) return;

    var styles = getComputedStyle(gallery);
    var gap = parseFloat(styles.gap) || 0;
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
    if (total < 700) {
      tiles.forEach(function (tile) {
        tile.style.width = "";                 // fall back to the CSS
        tile.style.height = "";                // width: 100% + aspect-ratio
      });
      return;
    }

    var row = [];
    var sum = 0;                               // sum of the row's ratios

    function place() {
      var space = total - gap * (row.length - 1);
      var height = space / sum;
      var used = 0;

      row.forEach(function (item, i) {
        // the last tile takes the leftover pixels, so rounding can never
        // push the row wider than the container
        var width = (i === row.length - 1)
          ? space - used
          : Math.floor(item.ratio * height);
        used += width;
        item.tile.style.width = width + "px";
        item.tile.style.height = Math.round(height) + "px";
      });

      row = [];
      sum = 0;
    }

    tiles.forEach(function (tile) {
      var ratio = ratioOf(tile);
      row.push({ tile: tile, ratio: ratio });
      sum += ratio;
      // close the row once its height has shrunk to the target
      if ((total - gap * (row.length - 1)) / sum <= target) place();
    });

    // A leftover row is justified like the others, so every row reaches
    // both edges. The exception is a single image: alone it would have to
    // grow to the full width, towering over the rows above it.
    if (row.length > 1) {
      place();
    } else if (row.length === 1) {
      row[0].tile.style.width = Math.floor(row[0].ratio * target) + "px";
      row[0].tile.style.height = target + "px";
    }
  }

  layout();
  window.addEventListener("resize", layout);
  // ratios are only known once each image has decoded
  tiles.forEach(function (tile) {
    var img = tile.querySelector("img");
    if (!img.complete) img.addEventListener("load", layout);
  });

  /* ---- full-screen viewer ---- */

  var viewer = document.createElement("div");
  viewer.className = "viewer";
  viewer.innerHTML =
    '<button class="viewer-close" type="button" aria-label="Close">&times;</button>' +
    '<div class="viewer-stage"><img alt=""></div>' +
    '<div class="viewer-controls">' +
      '<button class="viewer-prev" type="button">prev</button>' +
      '<span class="viewer-sep">/</span>' +
      '<button class="viewer-next" type="button">next</button>' +
    '</div>';
  document.body.appendChild(viewer);

  var stage = viewer.querySelector(".viewer-stage");
  var index = 0;

  function show(n) {
    index = (n + tiles.length) % tiles.length;    // wrap around
    var tile = tiles[index];
    var big = viewer.querySelector(".viewer-stage img");
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
