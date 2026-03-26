// --- Environment Design Viewer ---
(function () {
    const thumbs = document.querySelectorAll('.viewer-thumbs .thumb');
    const mainImg = document.querySelector('.viewer-img');
    const caption = document.querySelector('.viewer-caption');
    const prevBtn = document.querySelector('.viewer-prev');
    const nextBtn = document.querySelector('.viewer-next');

    if (!thumbs.length || !mainImg) return;

    let current = 0;

    function show(index) {
        if (index < 0) index = thumbs.length - 1;
        if (index >= thumbs.length) index = 0;
        current = index;

        mainImg.src = thumbs[current].src;
        mainImg.alt = thumbs[current].alt;
        if (caption) caption.textContent = thumbs[current].dataset.caption || '';

        thumbs.forEach(t => t.classList.remove('active'));
        thumbs[current].classList.add('active');
        thumbs[current].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }

    thumbs.forEach((thumb, i) => {
        thumb.addEventListener('click', () => show(i));
    });

    prevBtn.addEventListener('click', () => show(current - 1));
    nextBtn.addEventListener('click', () => show(current + 1));

    // Keyboard navigation when viewer is visible
    document.addEventListener('keydown', (e) => {
        if (document.getElementById('lightbox').classList.contains('open')) return;
        if (e.key === 'ArrowLeft') show(current - 1);
        if (e.key === 'ArrowRight') show(current + 1);
    });
})();

// --- Lightbox for gallery images ---
(function () {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const galleryImages = document.querySelectorAll('.gallery figure img');
    const closeBtn = lightbox.querySelector('.lightbox-close');
    const prevBtn = lightbox.querySelector('.lightbox-prev');
    const nextBtn = lightbox.querySelector('.lightbox-next');

    if (!galleryImages.length) return;

    let current = 0;

    function open(index) {
        current = index;
        lightboxImg.src = galleryImages[current].src;
        lightboxImg.alt = galleryImages[current].alt;
        lightbox.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function close() {
        lightbox.classList.remove('open');
        document.body.style.overflow = '';
    }

    function navigate(dir) {
        current = (current + dir + galleryImages.length) % galleryImages.length;
        lightboxImg.src = galleryImages[current].src;
        lightboxImg.alt = galleryImages[current].alt;
    }

    galleryImages.forEach((img, i) => {
        img.style.cursor = 'pointer';
        img.addEventListener('click', () => open(i));
    });

    closeBtn.addEventListener('click', close);
    prevBtn.addEventListener('click', () => navigate(-1));
    nextBtn.addEventListener('click', () => navigate(1));

    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) close();
    });

    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('open')) return;
        if (e.key === 'Escape') close();
        if (e.key === 'ArrowLeft') navigate(-1);
        if (e.key === 'ArrowRight') navigate(1);
    });
})();
