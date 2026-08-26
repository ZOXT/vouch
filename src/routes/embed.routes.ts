import { Router } from "express";
import { Request, Response } from "express";
import { env } from "../config/env";

const router = Router();

router.get("/embed.js", (req: Request, res: Response) => {
  const apiBase = env.APP_URL || 'http://localhost:3000';

  const script = `
(function() {
  const containers = document.querySelectorAll('[data-vouch-id]');
  
  containers.forEach(async function(container) {
    if (container.getAttribute('data-vouch-loaded') === 'true') return;

    const embedId = container.getAttribute('data-vouch-id');
    if (!embedId) return;

    container.setAttribute('data-vouch-loaded', 'true');

    try {
      const res = await fetch('${apiBase}/api/v1/embed-sections/embed/' + encodeURIComponent(embedId));
      if (!res.ok) throw new Error('Unable to load embed (' + res.status + ')');
      const { data } = await res.json();
      
      if (!data || !data.testimonials) return;

      const layout = data.layout || 'carousel';
      
      container.style.fontFamily = 'sans-serif';
      container.style.padding = '20px';
      
      if (data.title) {
        const heading = document.createElement('h2');
        heading.textContent = data.title;
        heading.style.marginBottom = '16px';
        container.appendChild(heading);
      }

      const wrapper = document.createElement('div');
      wrapper.style.display = 'flex';
      wrapper.style.gap = '16px';
      wrapper.style.overflowX = layout === 'carousel' ? 'auto' : 'visible';
      wrapper.style.flexWrap = layout === 'grid' ? 'wrap' : 'nowrap';
      wrapper.style.flexDirection = layout === 'list' ? 'column' : 'row';

      data.testimonials.forEach(function(t) {
        const card = document.createElement('div');
        card.style.minWidth = '280px';
        card.style.border = '1px solid #e5e7eb';
        card.style.borderRadius = '12px';
        card.style.overflow = 'hidden';
        card.style.background = '#fff';

        if (t.thumbnailUrl) {
          const img = document.createElement('img');
          img.src = t.thumbnailUrl;
          img.style.width = '100%';
          img.style.height = '160px';
          img.style.objectFit = 'cover';
          img.style.cursor = 'pointer';
          img.onclick = function() {
            if (t.videoUrl) window.open(t.videoUrl, '_blank');
          };
          card.appendChild(img);
        }

        const info = document.createElement('div');
        info.style.padding = '12px';

        const name = document.createElement('p');
        name.textContent = t.clientName;
        name.style.fontWeight = 'bold';
        name.style.margin = '0 0 4px';
        info.appendChild(name);

        if (t.durationSeconds) {
          const duration = document.createElement('p');
          duration.textContent = Math.round(t.durationSeconds / 60) + ' min';
          duration.style.color = '#6b7280';
          duration.style.fontSize = '12px';
          duration.style.margin = '0';
          info.appendChild(duration);
        }

        card.appendChild(info);
        wrapper.appendChild(card);
      });

      container.appendChild(wrapper);
    } catch(err) {
      console.error('Vouch embed error:', err);
    }
  });
})();
  `.trim();

  res.setHeader("Content-Type", "application/javascript");
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  res.send(script);
});

export default router;
