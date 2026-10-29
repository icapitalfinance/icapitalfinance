/* iCapital Finance site behaviour. No dependencies. */
(function () {
  "use strict";
  var doc = document.documentElement;
  doc.classList.add("js");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Mobile navigation
  var toggle = document.querySelector(".nav-toggle");
  if (toggle) {
    var header = toggle.closest(".site-header");
    var setOpen = function (open) {
      header.classList.toggle("nav-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    };
    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && header.classList.contains("nav-open")) { setOpen(false); toggle.focus(); }
    });
    document.addEventListener("click", function (e) {
      if (header.classList.contains("nav-open") && !header.contains(e.target)) setOpen(false);
    });
    window.matchMedia("(min-width: 1025px)").addEventListener("change", function (m) { if (m.matches) setOpen(false); });
  }

  // Reveal on scroll
  var reveals = document.querySelectorAll(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var delay = parseInt(el.getAttribute("data-delay") || "0", 10);
        setTimeout(function () { el.classList.add("is-in"); }, delay);
        io.unobserve(el);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  }

  // Testimonial slider
  document.querySelectorAll("[data-slider]").forEach(function (slider) {
    var track = slider.querySelector(".slider__track");
    var slides = Array.prototype.slice.call(track.children);
    var dotsWrap = slider.querySelector(".slider__dots");
    var current = 0;
    var timer = null;
    var dots = slides.map(function (slide, i) {
      var dot = document.createElement("button");
      dot.type = "button";
      dot.className = "slider__dot";
      dot.setAttribute("aria-label", "Show testimonial " + (i + 1) + " of " + slides.length);
      dot.addEventListener("click", function () { go(i); restart(); });
      dotsWrap.appendChild(dot);
      return dot;
    });
    function go(i) {
      current = (i + slides.length) % slides.length;
      track.scrollTo({ left: slides[current].offsetLeft - slides[0].offsetLeft, behavior: reduceMotion ? "auto" : "smooth" });
      mark();
    }
    function mark() {
      dots.forEach(function (d, i) { d.setAttribute("aria-current", i === current ? "true" : "false"); });
      slides.forEach(function (s, i) { s.setAttribute("aria-hidden", i === current ? "false" : "true"); });
    }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    function start() { if (!reduceMotion && !timer) timer = setInterval(function () { go(current + 1); }, 7000); }
    function restart() { stop(); start(); }
    slider.querySelector("[data-prev]").addEventListener("click", function () { go(current - 1); restart(); });
    slider.querySelector("[data-next]").addEventListener("click", function () { go(current + 1); restart(); });
    var scrollEnd;
    track.addEventListener("scroll", function () {
      clearTimeout(scrollEnd);
      scrollEnd = setTimeout(function () {
        var step = slides.length > 1 ? slides[1].offsetLeft - slides[0].offsetLeft : track.clientWidth;
        var i = Math.round(track.scrollLeft / step);
        if (i !== current) { current = i; mark(); }
      }, 120);
    }, { passive: true });
    slider.addEventListener("mouseenter", stop);
    slider.addEventListener("mouseleave", start);
    slider.addEventListener("focusin", stop);
    slider.addEventListener("focusout", start);
    slider.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { go(current + 1); }
      if (e.key === "ArrowLeft") { go(current - 1); }
    });
    mark();
    start();
  });

  // Mouse tilt on the call-to-action card, like the original's motion effect
  var canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (canHover && !reduceMotion) {
    document.querySelectorAll("[data-tilt]").forEach(function (card) {
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = "perspective(900px) rotateX(" + (-y * 6).toFixed(2) + "deg) rotateY(" + (x * 6).toFixed(2) + "deg)";
      });
      card.addEventListener("mouseleave", function () { card.style.transform = ""; });
    });
  }

  // Contact form. Sends to Formspree when an endpoint is set, otherwise opens an email.
  var form = document.querySelector("[data-contact-form]");
  if (form) {
    var status = form.querySelector(".form-status");
    var submit = form.querySelector("[type=submit]");
    var show = function (msg, ok) {
      status.hidden = false;
      status.textContent = msg;
      status.className = "form-status " + (ok ? "form-status--ok" : "form-status--err");
      status.focus();
    };
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var invalid = Array.prototype.filter.call(form.elements, function (f) {
        var bad = f.willValidate && !f.checkValidity();
        if (f.willValidate) f.setAttribute("aria-invalid", bad ? "true" : "false");
        return bad;
      });
      if (invalid.length) {
        show("Please fill in the highlighted fields.", false);
        invalid[0].focus();
        return;
      }
      var data = new FormData(form);
      if (data.get("_gotcha")) return;
      var endpoint = form.getAttribute("action") || "";
      if (endpoint.indexOf("formspree.io/f/") === -1 || /YOUR_FORM_ID/.test(endpoint)) {
        var body = "Name: " + data.get("name") + "\nEmail: " + data.get("email") + "\nPhone: " + (data.get("phone") || "") +
          "\nEnquiry: " + data.get("enquiry") + "\n\n" + data.get("message");
        window.location.href = "mailto:info@icapitalfinance.com.au?subject=" +
          encodeURIComponent("Website enquiry: " + data.get("enquiry")) + "&body=" + encodeURIComponent(body);
        show("Your email app should now open with your message ready to send.", true);
        return;
      }
      submit.disabled = true;
      var label = submit.innerHTML;
      submit.textContent = "Sending...";
      fetch(endpoint, { method: "POST", body: data, headers: { Accept: "application/json" } })
        .then(function (res) {
          if (!res.ok) throw new Error(String(res.status));
          form.reset();
          show("Thanks. Your message has been sent and Wendy will get back to you shortly.", true);
        })
        .catch(function () {
          show("Sorry, your message could not be sent. Please call 1300 833 616 or email info@icapitalfinance.com.au.", false);
        })
        .then(function () { submit.disabled = false; submit.innerHTML = label; });
    });
  }

  // Footer year
  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
