"use strict";

document.querySelectorAll("button[aria-controls]").forEach((button) => {
  const detail = document.getElementById(
    button.getAttribute("aria-controls")
  );
  const label = button.querySelector(".button-label");
  const mark = button.querySelector(".button-mark");

  if (!detail || !label || !mark) return;

  // JavaScriptが使えない場合も、HTMLの説明文はそのまま読めます。
  detail.hidden = true;
  button.hidden = false;

  button.addEventListener("click", () => {
    const isOpen = button.getAttribute("aria-expanded") === "true";
    const nextOpen = !isOpen;

    button.setAttribute("aria-expanded", String(nextOpen));
    detail.hidden = !nextOpen;
    label.textContent = nextOpen ? "説明をとじる" : "説明をひらく";
    mark.textContent = nextOpen ? "−" : "＋";
  });
});
