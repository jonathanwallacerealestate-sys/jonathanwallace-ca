/* Home-value lab. Soft gate plus the two-step form.
   Passphrase constant is documented in lab/README.md.
   This file does not load GTM, GA4, the Follow Up Boss pixel, or the public lead beacon. */
(function () {
  var LAB_PASSPHRASE = "wallace-lab-2026";
  var STORAGE_KEY = "jw-lab-home-value";
  var LEAD_KEY = "jw-lab-home-value-lead";
  var CALENDLY_IN_HOME = "https://calendly.com/jonathan-faristeam/jonathan-wallace-in-home-evaluation-full-cma";
  var CALENDLY_PHONE = "https://calendly.com/jonathan-faristeam/jonathan-wallace-quick-phone-call";

  function trim(value) {
    return String(value == null ? "" : value).replace(/^\s+|\s+$/g, "");
  }

  function fieldValue(formEl, name) {
    var el = formEl.querySelector('[name="' + name + '"]');
    return el ? trim(el.value) : "";
  }

  function saveLead(formEl) {
    var lead = {
      first_name: fieldValue(formEl, "first_name"),
      last_name: fieldValue(formEl, "last_name"),
      email: fieldValue(formEl, "email"),
      phone: fieldValue(formEl, "phone"),
      address: fieldValue(formEl, "address")
    };
    try { sessionStorage.setItem(LEAD_KEY, JSON.stringify(lead)); } catch (errLead) {}
  }

  function readLead() {
    try {
      var raw = sessionStorage.getItem(LEAD_KEY);
      if (!raw) return null;
      var lead = JSON.parse(raw);
      if (!lead || typeof lead !== "object") return null;
      return lead;
    } catch (errRead) {
      return null;
    }
  }

  function queryPairs(pairs) {
    var parts = [];
    for (var i = 0; i < pairs.length; i++) {
      if (!pairs[i][1]) continue;
      parts.push(encodeURIComponent(pairs[i][0]) + "=" + encodeURIComponent(pairs[i][1]));
    }
    return parts.length ? "?" + parts.join("&") : "";
  }

  function calendlyQuery(lead, includePhone) {
    var first = trim(lead.first_name);
    var last = trim(lead.last_name);
    var name = trim(first + " " + last);
    var phoneTyped = trim(lead.phone);
    var phoneDigits = phoneTyped.replace(/\D/g, "");
    var pairs = [
      ["name", name],
      ["email", trim(lead.email)],
      ["a1", trim(lead.address)]
    ];
    if (includePhone) {
      pairs.push(["location", phoneDigits]);
      pairs.push(["a2", phoneTyped]);
    }
    return queryPairs(pairs);
  }

  function applyCalendlyPrefill() {
    var inHome = document.getElementById("labCalendlyInHome");
    var phoneLink = document.getElementById("labCalendlyPhone");
    if (!inHome && !phoneLink) return;
    var lead = readLead();
    if (!lead) return;
    var queryInHome = calendlyQuery(lead, false);
    var queryPhone = calendlyQuery(lead, true);
    if (!queryInHome && !queryPhone) return;
    if (inHome && queryInHome) inHome.href = CALENDLY_IN_HOME + queryInHome;
    if (phoneLink && queryPhone) phoneLink.href = CALENDLY_PHONE + queryPhone;
    var note = document.getElementById("labPrefillNote");
    if (note && (trim(lead.first_name) || trim(lead.last_name) || trim(lead.email))) {
      note.hidden = false;
    }
  }

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
        return;
      }
      saveLead(form);
    });
  }

  applyCalendlyPrefill();

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
