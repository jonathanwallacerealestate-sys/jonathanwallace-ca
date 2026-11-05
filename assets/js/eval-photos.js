/* Photo lightbox for the private evaluation page. One 16:9 opener per sale. */
(function () {
  var dataNode = document.getElementById("eval-galleries");
  var dialog = document.getElementById("evalLightbox");
  if (!dataNode || !dialog) return;

  var galleries;
  try { galleries = JSON.parse(dataNode.textContent); } catch (e) { return; }

  var img = dialog.querySelector(".eval-lightbox__frame img");
  var title = dialog.querySelector(".eval-lightbox__title");
  var count = dialog.querySelector(".eval-lightbox__count");
  var currentId = null;
  var index = 0;
  var pointerId = null;
  var startX = 0;

  function photos() {
    var gallery = galleries[currentId];
    return gallery && gallery.photos ? gallery.photos : [];
  }

  function show(i) {
    var list = photos();
    if (!list.length) return;
    index = (i + list.length) % list.length;
    var photo = list[index];
    img.src = photo.src;
    img.alt = photo.alt;
    var gallery = galleries[currentId];
    title.textContent = gallery.title;
    count.textContent = (index + 1) + " of " + list.length;
    var upcoming = list[(index + 1) % list.length];
    if (upcoming && upcoming.src) {
      var pre = new Image();
      pre.src = upcoming.src;
    }
  }

  function open(id) {
    if (!galleries[id] || !galleries[id].photos || !galleries[id].photos.length) return;
    currentId = id;
    show(0);
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  }

  document.querySelectorAll(".eval-photo").forEach(function (button) {
    button.addEventListener("click", function () {
      open(button.getAttribute("data-gallery"));
    });
  });

  dialog.querySelector(".eval-lightbox__close").addEventListener("click", function () {
    dialog.close();
  });
  dialog.querySelector(".eval-lightbox__nav--prev").addEventListener("click", function () {
    show(index - 1);
  });
  dialog.querySelector(".eval-lightbox__nav--next").addEventListener("click", function () {
    show(index + 1);
  });

  dialog.addEventListener("keydown", function (e) {
    if (e.key === "ArrowLeft") { e.preventDefault(); show(index - 1); }
    if (e.key === "ArrowRight") { e.preventDefault(); show(index + 1); }
  });

  var stage = dialog.querySelector(".eval-lightbox__stage");
  stage.addEventListener("pointerdown", function (e) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    pointerId = e.pointerId;
    startX = e.clientX;
  });
  stage.addEventListener("pointerup", function (e) {
    if (pointerId !== e.pointerId) return;
    var dx = e.clientX - startX;
    pointerId = null;
    if (dx <= -40) show(index + 1);
    else if (dx >= 40) show(index - 1);
  });
})();
