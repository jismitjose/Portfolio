// js/main.js (updated)
// Shrinks the headshot inside the blob while leaving the blob stroke/outline size unchanged.
// Change IMAGE_SHRINK to make the photo smaller/larger inside the blob (0.6 -> smaller, 0.9 -> closer to original).

document.addEventListener('DOMContentLoaded', function () {
  // ---------- Resume download logic ----------
  const dl = document.getElementById('download-resume');
  if (dl) {
    dl.addEventListener('click', function (e) {
      e.preventDefault();
      const url = 'assets/resume.pdf';
      fetch(url, { method: 'HEAD' }).then(resp => {
        if (resp.ok) {
          window.open(url, '_blank');
        } else {
          alert('Resume not found. Please add assets/resume.pdf to enable download.');
        }
      }).catch(() => {
        alert('Resume not found. Please add assets/resume.pdf to enable download.');
      });
    });
  }

  // ---------- Social links (replace '#' with actual URLs) ----------
  const linkedin = document.getElementById('linkedin');
  const github = document.getElementById('github');
  if (linkedin) linkedin.href = '#'; // replace with real LinkedIn URL
  if (github) github.href = '#';     // replace with real GitHub URL

  // ---------- Blob image sizing logic ----------
  const svgImage = document.querySelector('svg.blob image') || document.querySelector('svg.blob image[xlink\\:href]');
  const blobStroke = document.querySelector('.blob-stroke');
  const blobSvg = document.querySelector('svg.blob');

  const VIEWBOX_SIZE = 600;
  // How much the image should try to fill the blob when large (0..1)
  const TARGET_FILL = 0.78;
  // Extra shrink factor to reduce image inside the blob (user-requested)
  const IMAGE_SHRINK = 0.78; // <1 to make image smaller; change to 0.65 for smaller, 0.9 for milder
  const MIN_SCALE_FOR_SMALL_IMAGES = 0.5;
  const DESIRED_STROKE_PX = 12; // keep the blob stroke constant (we will not scale the stroke)

  function getImageHref(imgEl) {
    if (!imgEl) return null;
    return imgEl.getAttributeNS('http://www.w3.org/1999/xlink', 'href') || imgEl.getAttribute('href') || imgEl.getAttribute('xlink:href');
  }

  function adjustBlobImageOnly() {
    if (!svgImage || !blobSvg) return;

    const href = getImageHref(svgImage);
    if (!href) {
      applyDefaultImageTransform();
      return;
    }

    const img = new Image();
    img.src = href;

    img.onload = function () {
      const naturalW = img.naturalWidth || VIEWBOX_SIZE;
      const naturalH = img.naturalHeight || VIEWBOX_SIZE;
      const naturalMin = Math.min(naturalW, naturalH);

      // base scale (how much of the viewbox the image should occupy)
      let scale = TARGET_FILL;
      if (naturalMin < VIEWBOX_SIZE) {
        const ratio = naturalMin / VIEWBOX_SIZE;
        scale = Math.max(MIN_SCALE_FOR_SMALL_IMAGES, TARGET_FILL * ratio);
      }
      scale = Math.min(TARGET_FILL, scale);

      // Apply user shrink factor so image is smaller inside the blob
      const finalImageScale = scale * IMAGE_SHRINK;

      // Center the scaled image in viewBox coordinates
      const translateForImage = (VIEWBOX_SIZE - (VIEWBOX_SIZE * finalImageScale)) / 2;
      const imageTransform = `translate(${translateForImage}, ${translateForImage}) scale(${finalImageScale})`;

      // Apply transform only to the image (NOT to the blob stroke)
      svgImage.setAttribute('transform', imageTransform);

      // Ensure blob stroke remains full-size and constant stroke width
      if (blobStroke) {
        blobStroke.removeAttribute('transform'); // keep outline at original coordinates
        blobStroke.setAttribute('stroke-width', String(DESIRED_STROKE_PX));
      }
    };

    img.onerror = function () {
      applyDefaultImageTransform();
      if (blobStroke) blobStroke.setAttribute('stroke-width', String(DESIRED_STROKE_PX));
    };
  }

  function applyDefaultImageTransform() {
    const defaultScale = TARGET_FILL * IMAGE_SHRINK;
    const translate = (VIEWBOX_SIZE - (VIEWBOX_SIZE * defaultScale)) / 2;
    const transformStr = `translate(${translate}, ${translate}) scale(${defaultScale})`;
    if (svgImage) svgImage.setAttribute('transform', transformStr);
    if (blobStroke) {
      blobStroke.removeAttribute('transform');
      blobStroke.setAttribute('stroke-width', String(DESIRED_STROKE_PX));
    }
  }

  // Initial run
  adjustBlobImageOnly();

  // Re-run on resize (debounced)
  let _resizeTimer = null;
  window.addEventListener('resize', function () {
    clearTimeout(_resizeTimer);
    _resizeTimer = setTimeout(adjustBlobImageOnly, 140);
  });

  // Observe changes to the image href (if you swap images later)
  if (svgImage && 'MutationObserver' in window) {
    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'attributes' && (m.attributeName === 'href' || m.attributeName === 'xlink:href')) {
          clearTimeout(_resizeTimer);
          _resizeTimer = setTimeout(adjustBlobImageOnly, 120);
        }
      }
    });
    mo.observe(svgImage, { attributes: true });
  }
});