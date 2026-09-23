/* Home-value lab. Soft gate plus the two-step form.
   Passphrase constant is documented in lab/README.md.
   This file does not load GTM, GA4, the Follow Up Boss pixel, or the public lead beacon. */
(function () {
  var LAB_PASSPHRASE = "wallace-lab-2026";
  var STORAGE_KEY = "jw-lab-home-value";

  function unlock() {
    document.documentElement.classList.add("lab-unlocked");
  }

  try {
    if (sessionStorage.getItem(STORAGE_KEY) === "1") unlock();
  } catch (e) {}

  var gate = document.getElementById("labGateForm");
  if (gate) {
    gate.addEventListener("submit", function (e) {
      e.preventDefault();
      var input = document.getElementById("labPassphrase");
      var err = document.getElementById("labGateError");
      var value = input ? input.value.replace(/^\s+|\s+$/g, "") : "";
      if (value === LAB_PASSPHRASE) {
        try { sessionStorage.setItem(STORAGE_KEY, "1"); } catch (errStore) {}
        unlock();
        if (err) err.hidden = true;
        if (input) input.removeAttribute("aria-invalid");
        var heading = document.getElementById("labHeading");
        if (heading && heading.focus) heading.focus();
      } else {
        if (input) input.setAttribute("aria-invalid", "true");
        if (err) err.hidden = false;
      }
    });
  }

  var toggle = document.getElementById("navToggle");
  var links = document.getElementById("navLinks");
  if (toggle && links) {
    toggle.addEventListener("click", function () { links.classList.toggle("open"); });
    links.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { links.classList.remove("open"); });
    });
  }

  document.querySelectorAll("#year").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  var form = document.getElementById("labForm");
  var step1 = document.getElementById("labStep1");
  var step2 = document.getElementById("labStep2");
  var label = document.getElementById("labStepLabel");
  if (form && step1 && step2) {
    function showStep(n) {
      var onSecond = n === 2;
      step1.hidden = onSecond;
      step2.hidden = !onSecond;
      step2.disabled = !onSecond;
      if (label) {
        label.textContent = onSecond
          ? "Step 2 of 2. Property details"
          : "Step 1 of 2. Address and contact";
      }
      var focusEl = document.getElementById(onSecond ? "labStep2Legend" : "labStep1Legend");
      if (focusEl && focusEl.focus) focusEl.focus();
    }

    function step1Valid() {
      var fields = step1.querySelectorAll("input, select, textarea");
      for (var i = 0; i < fields.length; i++) {
        if (!fields[i].checkValidity()) {
          fields[i].reportValidity();
          return false;
        }
      }
      return true;
    }

    function advance() {
      if (step1Valid()) showStep(2);
    }

    var cont = document.getElementById("labContinue");
    if (cont) cont.addEventListener("click", advance);

    step1.addEventListener("keydown", function (e) {
      if (e.key !== "Enter") return;
      if (e.target && e.target.tagName === "TEXTAREA") return;
      e.preventDefault();
      advance();
    });
    var back = document.getElementById("labBack");
    if (back) back.addEventListener("click", function () { showStep(1); });

    form.addEventListener("submit", function (e) {
      if (step2.hidden || step2.disabled) {
        e.preventDefault();
        advance();
      }
    });
  }

  var wrap = document.querySelector(".video-embed[data-youtube-id]");
  if (wrap) {
    var id = (wrap.getAttribute("data-youtube-id") || "").replace(/^\s+|\s+$/g, "");
    if (id) {
      var frame = wrap.querySelector(".video-embed__frame");
      if (frame) {
        var iframe = document.createElement("iframe");
        iframe.src = "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(id);
        iframe.title = "A quick note from Jonathan Wallace";
        iframe.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share");
        iframe.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
        iframe.setAttribute("allowfullscreen", "");
        frame.replaceChildren(iframe);
      }
    }
  }
})();
