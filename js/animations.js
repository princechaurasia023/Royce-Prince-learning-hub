// ═══ SCROLL PROGRESS BAR ═══
(function () {
  const bar = document.createElement("div");
  bar.id = "scroll-progress";
  document.body.prepend(bar);
  window.addEventListener("scroll", () => {
    bar.style.width = (window.scrollY / (document.body.scrollHeight - window.innerHeight) * 100) + "%";
  });
})();

// ═══ NAVBAR SCROLL + ACTIVE LINKS ═══
(function () {
  const nav = document.getElementById("navbar");
  const links = document.querySelectorAll(".nav-link");
  const sections = document.querySelectorAll("section[id]");
  window.addEventListener("scroll", () => {
    if (nav) nav.classList.toggle("scrolled", window.scrollY > 50);
    let current = "";
    sections.forEach(s => { if (window.scrollY >= s.offsetTop - 120) current = s.id; });
    links.forEach(l => l.classList.toggle("active", l.getAttribute("href") === "#" + current));
  });
})();

// ═══ REVEAL ON SCROLL ═══
(function () {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add("visible");
        const fill = e.target.querySelector(".skill-fill");
        if (fill) fill.classList.add("animated");
      }
    });
  }, { threshold: 0.15 });
  document.querySelectorAll(".reveal").forEach(el => observer.observe(el));
})();

// ═══ COUNTER ANIMATION ═══
(function () {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const target = +el.dataset.target;
      let current = 0;
      const step = target / 60;
      const timer = setInterval(() => {
        current = Math.min(current + step, target);
        el.textContent = Math.floor(current);
        if (current >= target) clearInterval(timer);
      }, 20);
      observer.unobserve(el);
    });
  }, { threshold: 0.5 });
  document.querySelectorAll(".stat-number").forEach(el => observer.observe(el));
})();
