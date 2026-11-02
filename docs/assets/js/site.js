/* iCapital Finance site behaviour. No dependencies. */
(function () {
  "use strict";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Mobile menu
  var toggle = document.querySelector(".nav-toggle");
  if (toggle) {
    var header = toggle.closest(".site-header");
    var setOpen = function (open) {
      header.classList.toggle("nav-open", open);
      toggle.setAttribute("aria-expanded", String(open));
    };
    toggle.addEventListener("click", function () { setOpen(toggle.getAttribute("aria-expanded") !== "true"); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && header.classList.contains("nav-open")) { setOpen(false); toggle.focus(); }
    });
    document.addEventListener("click", function (e) {
      if (header.classList.contains("nav-open") && !header.contains(e.target)) setOpen(false);
    });
    window.matchMedia("(min-width: 1025px)").addEventListener("change", function (m) { if (m.matches) setOpen(false); });
  }

  // Entrance animations (fadeInDown / fadeIn), as on the original site
  var anims = document.querySelectorAll("[data-anim]");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    anims.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add("is-in"); io.unobserve(entry.target); }
      });
    }, { threshold: 0.1 });
    anims.forEach(function (el) { io.observe(el); });
  }

  // Testimonial slider
  document.querySelectorAll("[data-slider]").forEach(function (slider) {
    var slides = Array.prototype.slice.call(slider.querySelectorAll(".slide"));
    var dotsWrap = slider.querySelector(".slider__dots");
    var current = 0, timer = null;
    var dots = slides.map(function (s, i) {
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
      slides.forEach(function (s, n) { s.hidden = n !== current; });
      dots.forEach(function (d, n) { d.setAttribute("aria-current", n === current ? "true" : "false"); });
    }
    function stop() { clearInterval(timer); timer = null; }
    function start() { if (!reduceMotion && !timer) timer = setInterval(function () { go(current + 1); }, 5000); }
    function restart() { stop(); start(); }
    slider.addEventListener("mouseenter", stop);
    slider.addEventListener("mouseleave", start);
    slider.addEventListener("focusin", stop);
    slider.addEventListener("focusout", start);
    go(0);
    start();
  });

  // Value proposition tabs (accordion on phones)
  document.querySelectorAll("[data-tabs]").forEach(function (box) {
    var tabs = Array.prototype.slice.call(box.querySelectorAll('[role="tab"]'));
    var titles = Array.prototype.slice.call(box.querySelectorAll(".tab-title"));
    var panels = Array.prototype.slice.call(box.querySelectorAll('[role="tabpanel"]'));
    function select(i, focus) {
      tabs.forEach(function (t, n) {
        var on = n === i;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        panels[n].hidden = !on;
        titles[n].setAttribute("aria-expanded", String(on));
      });
      if (focus) tabs[i].focus();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { select(i); });
      t.addEventListener("keydown", function (e) {
        var k = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
        if (k) { e.preventDefault(); select((i + k + tabs.length) % tabs.length, true); }
      });
    });
    titles.forEach(function (t, i) { t.addEventListener("click", function () { select(i); }); });
  });

  // Mouse tilt on the "Want to know more?" photo, like the original motion effect
  if (!reduceMotion && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    document.querySelectorAll("[data-tilt]").forEach(function (box) {
      var img = box.querySelector("img");
      box.addEventListener("mousemove", function (e) {
        var r = box.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        img.style.transform = "perspective(1000px) rotateX(" + (-y * 8).toFixed(2) + "deg) rotateY(" + (x * 8).toFixed(2) + "deg)";
      });
      box.addEventListener("mouseleave", function () { img.style.transform = ""; });
    });
  }

  // Hero background video (YouTube, seconds 15 to 39 on loop), desktop only, loaded after the page
  var video = document.querySelector("[data-video]");
  if (video && !reduceMotion && window.matchMedia("(min-width: 1025px)").matches) {
    window.addEventListener("load", function () {
      var id = video.getAttribute("data-video");
      var startAt = +video.getAttribute("data-start"), endAt = +video.getAttribute("data-end");
      var holder = document.createElement("div");
      video.appendChild(holder);
      function size() {
        var iframe = video.querySelector("iframe");
        if (!iframe) return;
        var w = video.offsetWidth, h = video.offsetHeight;
        if (w / h > 16 / 9) { iframe.width = w; iframe.height = Math.ceil(w * 9 / 16); }
        else { iframe.height = h; iframe.width = Math.ceil(h * 16 / 9); }
      }
      window.onYouTubeIframeAPIReady = function () {
        var player = new YT.Player(holder, {
          videoId: id,
          playerVars: { autoplay: 1, mute: 1, controls: 0, playsinline: 1, rel: 0, modestbranding: 1, start: startAt, end: endAt, disablekb: 1, iv_load_policy: 3 },
          events: {
            onReady: function (e) { e.target.mute(); e.target.playVideo(); size(); },
            onStateChange: function (e) {
              if (e.data === 1) video.classList.add("is-playing");
              if (e.data === 0) player.seekTo(startAt);
            }
          }
        });
        player.getIframe().setAttribute("title", "Background video");
        player.getIframe().setAttribute("tabindex", "-1");
        size();
        window.addEventListener("resize", size);
      };
      var s = document.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(s);
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
        show("Please fill in the required fields.", false);
        invalid[0].focus();
        return;
      }
      var data = new FormData(form);
      if (data.get("_gotcha")) return;
      var endpoint = form.getAttribute("action") || "";
      if (endpoint.indexOf("formspree.io/f/") === -1 || /YOUR_FORM_ID/.test(endpoint)) {
        var body = "Name: " + data.get("name") + "\nEmail: " + data.get("email") + "\nPhone: " + (data.get("phone") || "") +
          "\nService Of Interest: " + data.get("service") + "\n\n" + data.get("message");
        window.location.href = "mailto:info@icapitalfinance.com.au?subject=" +
          encodeURIComponent("Website enquiry: " + data.get("service")) + "&body=" + encodeURIComponent(body);
        show("Your email app should now open with your message ready to send.", true);
        return;
      }
      submit.disabled = true;
      submit.textContent = "Sending...";
      fetch(endpoint, { method: "POST", body: data, headers: { Accept: "application/json" } })
        .then(function (res) {
          if (!res.ok) throw new Error(String(res.status));
          form.reset();
          show("Your submission was successful.", true);
        })
        .catch(function () {
          show("Sorry, your message could not be sent. Please call 1300 833 616 or email info@icapitalfinance.com.au.", false);
        })
        .then(function () { submit.disabled = false; submit.textContent = "Send"; });
    });
  }

  // Footer year
  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
