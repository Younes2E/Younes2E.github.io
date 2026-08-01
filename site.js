/* ============================================================
   SITE CONFIG — edit only this block.
   Everything below rebuilds the header, nav and footer on every
   page, so a change here updates the whole site at once.
   ============================================================ */

var SITE = {
  name: "Younes Boufouss",
  tagline: "Master's student in Artificial Intelligence at Université Paris-Saclay",
  email: "younes.boufouss@universite-paris-saclay.fr",

  photo: "",

  favicon: "",

  social: [
    { label: "GitHub", url: "https://github.com/Younes2E", cls: "gh",
      icon: "M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222 0 1.606-.014 2.898-.014 3.293 0 .322.216.694.825.576C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" },

    // { label: "Google Scholar", url: "#", cls: "sc",
    //   icon: "M5.242 13.769L0 9.5 12 0l12 9.5-5.242 4.269C17.548 11.249 14.978 9.5 12 9.5c-2.977 0-5.548 1.748-6.758 4.269zM12 10a7 7 0 1 0 0 14 7 7 0 0 0 0-14z" },

    { label: "LinkedIn", url: "https://www.linkedin.com/in/younes-boufouss", cls: "li",
      icon: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z" }
  ],

  // the tabs, in order. `href` is where the tab points: a page
  // (e.g. "art.html") or a section on the home page ("index.html#projects").
  nav: [
    { href: "index.html",              label: "About" },
    { href: "index.html#publications", label: "Publications" },
    { href: "index.html#projects",     label: "Projects" },
    { href: "art.html",                label: "Art" }
  ],

  footer: "Last updated: August 2026"
};

/* ============================================================
   Rendering — you normally don't need to touch anything below.
   ============================================================ */

(function () {

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  // render the social icons straight from SITE.social (the single source of truth)
  function socialHTML() {
    var out = SITE.social.map(function (n) {
      return '<a class="' + esc(n.cls) + '" href="' + esc(n.url) + '" target="_blank" rel="noopener" ' +
             'aria-label="' + esc(n.label) + '" title="' + esc(n.label) + '">' +
             '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + n.icon + '"/></svg></a>';
    }).join("");
    return '<div class="social">' + out + '</div>';
  }

  function currentFile() {
    var f = location.pathname.split("/").pop();
    return f === "" ? "index.html" : f;
  }

  function splitHref(href) {
    var parts = href.split("#");
    return { file: parts[0] || "index.html", hash: parts[1] ? "#" + parts[1] : "" };
  }

  // returns the tab links (injected into the <nav id="site-nav"> bar)
  function navLinksHTML() {
    var here = currentFile();
    var hash = location.hash;              // "" or "#projects"
    var onHome = (here === "index.html");
    return SITE.nav.map(function (n) {
      var t = splitHref(n.href);
      // on the home page, home tabs become in-page fragments (scroll, no reload);
      // from other pages they keep the full "index.html#..." path
      var href = (onHome && t.file === "index.html") ? (t.hash || "#") : n.href;
      // active when the tab points at this page AND the same section (hash)
      var active = (t.file === here && t.hash === hash) ? ' class="active"' : '';
      // data-spy lets the scrollspy match a tab to its section on the home page
      var spy = (t.file === "index.html") ? ' data-spy="' + (t.hash ? t.hash.slice(1) : "about") + '"' : '';
      return '<a href="' + href + '"' + spy + active + '>' + esc(n.label) + '</a>';
    }).join("\n  ");
  }

  function avatarHTML() {
    if (SITE.photo) {
      return '<img class="avatar" src="' + esc(SITE.photo) + '" alt="' + esc(SITE.name) + '">';
    }
    return '<div class="avatar avatar-placeholder" aria-hidden="true"></div>';
  }

  function headerHTML() {
    return '' +
      '<div class="header-top">\n' +
      '  <div class="header-id">\n' +
      '    ' + avatarHTML() + '\n' +
      '    <div>\n' +
      '      <h1>' + esc(SITE.name) + '</h1>\n' +
      '      <p class="tagline">' + esc(SITE.tagline) + '</p>\n' +
      '    </div>\n' +
      '  </div>\n' +
      '  <div class="contact">\n' +
      '    <span class="contact-label">Contact</span>\n' +
      '    <a href="mailto:' + esc(SITE.email) + '">' + esc(SITE.email) + '</a>\n' +
      '    ' + socialHTML() + '\n' +
      '  </div>\n' +
      '</div>';
  }

  // ---- favicon (browser-tab icon) ----
  if (SITE.favicon) {
    var icon = document.createElement("link");
    icon.rel = "icon";
    icon.href = SITE.favicon;
    if (/\.svg(\?|$)/i.test(SITE.favicon)) icon.type = "image/svg+xml";
    document.head.appendChild(icon);
  }

  // ---- inject shared chrome ----
  var header = document.getElementById("site-header");
  if (header) header.innerHTML = headerHTML();

  // the nav is a separate element so it can stick to the top while scrolling
  var navBar = document.getElementById("site-nav");
  if (navBar) navBar.innerHTML = navLinksHTML();

  // scrollspy: on the home page, highlight whichever section is actually in
  // view, so scrolling back up returns the highlight to About (not stuck on
  // the last-clicked tab).
  (function () {
    if (currentFile() !== "index.html" || !header) return;

    var sections = [];
    SITE.nav.forEach(function (n) {
      var t = splitHref(n.href);
      if (t.file !== "index.html") return;
      var el = document.getElementById(t.hash ? t.hash.slice(1) : "about");
      if (el) sections.push(el);
    });
    if (!sections.length) return;

    function mark(id) {
      if (!navBar) return;
      Array.prototype.forEach.call(navBar.querySelectorAll("a"), function (a) {
        a.classList.toggle("active", a.getAttribute("data-spy") === id);
      });
    }
    
    var ticking = false;
    function update() {
      ticking = false;
      var current = sections[0].id;
      var scrollable = document.documentElement.scrollHeight - window.innerHeight;
      // at the very bottom, force the last section — a short final section never
      // scrolls up far enough to cross the detection line otherwise
      if (scrollable > 0 && window.scrollY >= scrollable - 2) {
        current = sections[sections.length - 1].id;
      } else {
        var line = window.scrollY + 120;   // detection line near the top
        sections.forEach(function (sec) {
          if (sec.offsetTop <= line) current = sec.id;
        });
      }
      mark(current);
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  })();

  var footer = document.getElementById("site-footer");
  if (footer) footer.innerHTML = esc(SITE.footer);

  // browser-tab title: each page declares only its section via
  // <title data-section="Publications">; the name is added here.
  var titleEl = document.querySelector("title");
  if (titleEl && titleEl.hasAttribute("data-section")) {
    var section = titleEl.getAttribute("data-section");
    document.title = section ? section + " · " + SITE.name : SITE.name;
  }

  /* ============================================================
     Image viewer (the original Environment-Design viewer): a large
     image on a dark stage with an overlaid caption, black side arrows,
     a horizontal strip of landscape thumbnails, keyboard nav, and a
     fullscreen lightbox when the main image is clicked.
     Turns any <div class="carousel"> holding a plain list of <img>.
     ============================================================ */
  document.querySelectorAll(".carousel").forEach(function (car) {
    var source = Array.prototype.slice.call(car.querySelectorAll("img"));
    if (!source.length) return;

    var items = source.map(function (img) {
      return {
        src: img.getAttribute("src"),
        alt: img.getAttribute("alt") || "",
        caption: img.getAttribute("data-caption") || ""
      };
    });

    car.innerHTML = "";

    // main stage: arrows + image + overlaid caption
    var main = document.createElement("div");
    main.className = "viewer-main";

    var prev = document.createElement("button");
    prev.type = "button";
    prev.className = "viewer-prev";
    prev.setAttribute("aria-label", "Previous");
    prev.innerHTML = "&#8249;";

    var big = document.createElement("img");
    big.className = "viewer-img";

    var next = document.createElement("button");
    next.type = "button";
    next.className = "viewer-next";
    next.setAttribute("aria-label", "Next");
    next.innerHTML = "&#8250;";

    var cap = document.createElement("div");
    cap.className = "viewer-caption";

    main.appendChild(prev);
    main.appendChild(big);
    main.appendChild(next);
    main.appendChild(cap);

    // horizontal thumbnail strip
    var thumbs = document.createElement("div");
    thumbs.className = "viewer-thumbs";

    var thumbEls = items.map(function (it, idx) {
      var t = document.createElement("img");
      t.className = "thumb";
      t.src = it.src;
      t.alt = it.alt;
      t.addEventListener("click", function () { show(idx); });
      thumbs.appendChild(t);
      return t;
    });

    car.appendChild(main);
    if (items.length > 1) car.appendChild(thumbs);

    // ---- fullscreen lightbox ----
    var lb = document.createElement("div");
    lb.className = "lightbox";
    lb.innerHTML =
      '<button class="lightbox-close" aria-label="Close">&times;</button>' +
      '<button class="lightbox-prev" aria-label="Previous">&#8249;</button>' +
      '<img class="lightbox-img" alt="">' +
      '<button class="lightbox-next" aria-label="Next">&#8250;</button>';
    document.body.appendChild(lb);

    var lbImg   = lb.querySelector(".lightbox-img");
    var lbPrev  = lb.querySelector(".lightbox-prev");
    var lbNext  = lb.querySelector(".lightbox-next");
    var lbClose = lb.querySelector(".lightbox-close");

    function lbOpen() { return lb.classList.contains("open"); }

    function openLightbox() {
      lb.classList.add("open");
      document.body.style.overflow = "hidden";
    }

    function closeLightbox() {
      lb.classList.remove("open");
      document.body.style.overflow = "";
    }

    var i = 0;

    function show(n) {
      i = (n + items.length) % items.length;   // wrap around
      big.src = items[i].src;
      big.alt = items[i].alt;
      cap.textContent = items[i].caption;
      lbImg.src = items[i].src;
      lbImg.alt = items[i].alt;
      thumbEls.forEach(function (t, idx) {
        t.classList.toggle("active", idx === i);
      });
      thumbEls[i].scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }

    prev.addEventListener("click", function () { show(i - 1); });
    next.addEventListener("click", function () { show(i + 1); });
    big.addEventListener("click", openLightbox);

    lbPrev.addEventListener("click", function () { show(i - 1); });
    lbNext.addEventListener("click", function () { show(i + 1); });
    lbClose.addEventListener("click", closeLightbox);
    lb.addEventListener("click", function (e) { if (e.target === lb) closeLightbox(); });

    if (items.length < 2) {
      prev.style.display = "none";
      next.style.display = "none";
      lbPrev.style.display = "none";
      lbNext.style.display = "none";
    }

    document.addEventListener("keydown", function (e) {
      if (lbOpen()) {
        if (e.key === "Escape") closeLightbox();
        else if (e.key === "ArrowLeft") show(i - 1);
        else if (e.key === "ArrowRight") show(i + 1);
      } else if (items.length > 1) {
        if (e.key === "ArrowLeft") show(i - 1);
        else if (e.key === "ArrowRight") show(i + 1);
      }
    });

    show(0);
  });

})();
