"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const TOOLTIP_DELAY = 500;
  const DISMISS_DELAY = 300;
  const MOUSE_TOLERANCE = 5;
  const MOBILE_BREAKPOINT = 768;

  let isMobile = window.innerWidth <= MOBILE_BREAKPOINT;
  let activeFootnoteRef = null;
  let tooltipTimer = null;
  let dismissTimer = null;

  const tooltip = document.createElement("div");
  tooltip.className = "footnote-tooltip";
  tooltip.style.display = "none";
  document.body.appendChild(tooltip);

  function positionTooltip(target) {
    const targetRect = target.getBoundingClientRect();
    const tooltipWidth = tooltip.offsetWidth;
    const tooltipHeight = tooltip.offsetHeight;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    let left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
    let top = targetRect.bottom + window.scrollY + 5;

    if (left < 0) left = 0;
    if (left + tooltipWidth > windowWidth) left = windowWidth - tooltipWidth;
    if (top + tooltipHeight > window.scrollY + windowHeight) {
      top = targetRect.top + window.scrollY - tooltipHeight - 5;
    }

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  }

  function showTooltip(target) {
    if (isMobile) return;

    clearTimeout(tooltipTimer);
    clearTimeout(dismissTimer);

    tooltipTimer = setTimeout(() => {
      const footnoteId = target.getAttribute("href").slice(1);
      const footnoteContent = document.getElementById(footnoteId);
      if (footnoteContent) {
        const clonedContent = footnoteContent.cloneNode(true);

        const backRefLink = clonedContent.querySelector(".footnote-backref");
        if (backRefLink) {
          backRefLink.remove();
        }

        clonedContent.querySelectorAll("p").forEach((p) => {
          if (p.innerHTML.trim() === "") {
            p.remove();
          }
        });

        let tooltipContent = clonedContent.innerHTML.trim();
        tooltipContent = tooltipContent.replace(
          /^(<br\s*\/?>)*|(<br\s*\/?>)*$/g,
          ""
        );

        tooltip.innerHTML = tooltipContent;
        tooltip.style.display = "block";
        positionTooltip(target);
        activeFootnoteRef = target;
      }
    }, TOOLTIP_DELAY);
  }

  function hideTooltip() {
    if (isMobile) return;

    clearTimeout(tooltipTimer);
    dismissTimer = setTimeout(() => {
      tooltip.style.display = "none";
      activeFootnoteRef = null;
    }, DISMISS_DELAY);
  }

  const debouncedResize = debounce(() => {
    isMobile = window.innerWidth <= MOBILE_BREAKPOINT;
  }, 100);

  window.addEventListener("resize", debouncedResize);

  document.addEventListener("click", (e) => {
    let target = e.target.closest('sup[id^="fnref"] a, .footnote-backref');
    if (target) {
      if (!isMobile && target.closest('sup[id^="fnref"]')) {
        showTooltip(target);
      }
    } else if (
      !isMobile &&
      !tooltip.contains(e.target) &&
      e.target !== activeFootnoteRef
    ) {
      hideTooltip();
    }
  });

  document.addEventListener("mouseover", (e) => {
    if (isMobile) return;
    let target = e.target.closest('sup[id^="fnref"] a');
    if (target) {
      showTooltip(target);
    }
  });

  document.addEventListener(
    "mouseout",
    (e) => {
      if (isMobile) return;
      let target = e.target.closest('sup[id^="fnref"] a');
      if (target) {
        const rect = target.getBoundingClientRect();
        if (
          e.clientX < rect.left - MOUSE_TOLERANCE ||
          e.clientX > rect.right + MOUSE_TOLERANCE ||
          e.clientY < rect.top - MOUSE_TOLERANCE ||
          e.clientY > rect.bottom + MOUSE_TOLERANCE
        ) {
          hideTooltip();
        }
      }
    },
    { passive: true }
  );

  tooltip.addEventListener("mouseover", () => {
    if (isMobile) return;
    clearTimeout(dismissTimer);
  });

  tooltip.addEventListener("mouseout", (e) => {
    if (isMobile) return;
    const rect = tooltip.getBoundingClientRect();
    if (
      e.clientX < rect.left - MOUSE_TOLERANCE ||
      e.clientX > rect.right + MOUSE_TOLERANCE ||
      e.clientY < rect.top - MOUSE_TOLERANCE ||
      e.clientY > rect.bottom + MOUSE_TOLERANCE
    ) {
      hideTooltip();
    }
  });

  function debounce(func, wait) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }
});

setTimeout(() => {
  const images = document.querySelectorAll("img");
  for (const image of images) {
    // wrap the image tag with a div and add a button to rengerate the image
    const wrapper = document.createElement("div");
    wrapper.className = "image-wrapper";
    image.parentNode.insertBefore(wrapper, image);

    wrapper.appendChild(image);
    wrapper.style.position = "relative";

    

    // alt text
    const textarea = document.createElement("textarea");
    textarea.className = "image-alt-text";
    textarea.textContent = image.getAttribute("alt");
    textarea.style.width = "100%";
    textarea.style.height = "100px";
    textarea.onchange = function () {
      image.setAttribute("alt", textarea.value);
    };
    wrapper.appendChild(textarea);

    const button = document.createElement("button");
    button.className = "image-reload-button";
    button.innerHTML = "Reload Image";
    wrapper.appendChild(button);
    
    button.addEventListener("click", () => {
      // image.src = image.src;
      console.log("reloading image");
      const original_src = image.src;
      const image_name = original_src.split("/").pop().split(".")[0];
      const image_extn = original_src.split("/").pop().split(".")[1];
      const file_name = location.pathname.replaceAll('/','') + ".md"

      const prompt = "The story of " + document.querySelector(".content-container h1").innerText + ", " + image.getAttribute("alt");
      // make an api post call to http://127.0.0.1:5555
      fetch("http://127.0.0.1:5555/regenerate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          file_name: file_name,
          old_name: image.src.split("/").pop(),
          new_name: image_name + "0" + "." + image_extn,
          prompt: prompt,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          setTimeout(() => {
            image.src = original_src.replace(old_name, new_name);
          }, 1000);
        })
        .catch((error) => {});
    });
  }
}, 2000);
