(() => {
    const nav = document.querySelector("[data-site-nav]");
    const navToggle = document.querySelector("[data-nav-toggle]");

    navToggle?.addEventListener("click", () => {
        const isOpen = nav?.classList.toggle("is-open");
        navToggle.setAttribute("aria-expanded", String(Boolean(isOpen)));
    });

    document.querySelectorAll("[data-site-nav] a").forEach((link) => {
        link.addEventListener("click", () => {
            nav?.classList.remove("is-open");
            navToggle?.setAttribute("aria-expanded", "false");
        });
    });

    const sectionLinks = [...document.querySelectorAll("[data-site-nav] a[href^='#']")];
    const sections = sectionLinks
        .map((link) => document.querySelector(link.getAttribute("href")))
        .filter(Boolean);

    const updateActiveSection = () => {
        const offset = window.innerHeight * 0.35;
        let activeId = sections[0]?.id;
        sections.forEach((section) => {
            if (section.getBoundingClientRect().top <= offset) activeId = section.id;
        });
        sectionLinks.forEach((link) => {
            link.classList.toggle("is-section-active", link.getAttribute("href") === `#${activeId}`);
        });
    };

    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);

    const revealItems = document.querySelectorAll("[data-reveal]");
    if ("IntersectionObserver" in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("is-visible");
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12 });
        revealItems.forEach((item) => observer.observe(item));
    } else {
        revealItems.forEach((item) => item.classList.add("is-visible"));
    }

    document.querySelectorAll("[data-filter-scope]").forEach((scope) => {
        const buttons = scope.querySelectorAll("[data-filter]");
        const items = scope.querySelectorAll("[data-filter-item]");
        buttons.forEach((button) => {
            button.addEventListener("click", () => {
                const filter = button.dataset.filter;
                buttons.forEach((item) => item.classList.toggle("is-active", item === button));
                items.forEach((item) => {
                    const tags = (item.dataset.tags || "").split(/\s+/);
                    item.classList.toggle("is-hidden", filter !== "all" && !tags.includes(filter));
                });
            });
        });
    });

    const lightbox = document.querySelector("[data-lightbox-viewer]");
    if (lightbox) {
        const image = lightbox.querySelector("img");
        const close = lightbox.querySelector("[data-lightbox-close]");
        const closeLightbox = () => {
            lightbox.classList.remove("is-open");
            image.removeAttribute("src");
        };

        document.querySelectorAll("[data-lightbox]").forEach((button) => {
            button.addEventListener("click", () => {
                image.src = button.dataset.lightbox;
                image.alt = button.dataset.lightboxAlt || "";
                lightbox.classList.add("is-open");
                close?.focus();
            });
        });

        close?.addEventListener("click", closeLightbox);
        lightbox.addEventListener("click", (event) => {
            if (event.target === lightbox) closeLightbox();
        });
        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && lightbox.classList.contains("is-open")) closeLightbox();
        });
    }

    document.querySelectorAll("[data-accordion]").forEach((accordion) => {
        accordion.querySelectorAll(".accordion-item button").forEach((button) => {
            button.addEventListener("click", () => {
                const item = button.closest(".accordion-item");
                const isOpen = item.classList.toggle("is-open");
                button.setAttribute("aria-expanded", String(isOpen));
            });
        });
    });

    const newsletter = document.querySelector("[data-newsletter-form]");
    newsletter?.addEventListener("submit", (event) => {
        event.preventDefault();
        const email = newsletter.querySelector("input[type='email']").value.trim();
        const status = newsletter.querySelector("[data-form-status]");
        const emails = JSON.parse(localStorage.getItem("zooNewsletter") || "[]");
        if (email && !emails.includes(email)) {
            emails.push(email);
            localStorage.setItem("zooNewsletter", JSON.stringify(emails));
        }
        status.textContent = "已记录订阅邮箱，本地预览环境不会发送真实邮件。";
        newsletter.reset();
    });

    const feedbackForm = document.querySelector("[data-feedback-form]");
    const wall = document.querySelector("[data-message-wall]");
    const renderMessages = () => {
        if (!wall) return;
        const messages = JSON.parse(localStorage.getItem("zooMessages") || "[]");
        wall.innerHTML = messages.length
            ? messages.map((item) => `<article class="message-item"><strong>${escapeHtml(item.name)}</strong><p>${escapeHtml(item.message)}</p></article>`).join("")
            : [
                `<article class="message-item message-item--demo"><strong>试玩玩家 A<span class="demo-label">DEMO</span></strong><p>Signal Run 的网页试玩入口很顺手，希望后续可以加排行榜。</p></article>`,
                `<article class="message-item message-item--demo"><strong>独立游戏关注者<span class="demo-label">DEMO</span></strong><p>作品库和媒体库放在同一个首页里，比单独跳页面更清楚。</p></article>`
            ].join("");
    };

    feedbackForm?.addEventListener("submit", (event) => {
        event.preventDefault();
        const name = feedbackForm.querySelector("[name='name']").value.trim() || "匿名玩家";
        const message = feedbackForm.querySelector("[name='message']").value.trim();
        const status = feedbackForm.querySelector("[data-form-status]");
        if (!message) {
            status.textContent = "先写一点反馈内容。";
            return;
        }
        const messages = JSON.parse(localStorage.getItem("zooMessages") || "[]");
        messages.unshift({ name, message });
        localStorage.setItem("zooMessages", JSON.stringify(messages.slice(0, 6)));
        status.textContent = "反馈已加入本地留言墙。";
        feedbackForm.reset();
        renderMessages();
    });
    renderMessages();

    document.querySelectorAll("[data-copy]").forEach((button) => {
        button.addEventListener("click", async () => {
            const value = button.dataset.copy;
            const oldText = button.textContent;
            try {
                await navigator.clipboard.writeText(value);
                button.textContent = "已复制";
            } catch {
                button.textContent = value;
            }
            setTimeout(() => {
                button.textContent = oldText;
            }, 1400);
        });
    });

    const modal = document.getElementById("mini-game-modal");
    const frame = document.getElementById("mini-game-frame");
    const openButtons = document.querySelectorAll("[data-open-mini-game]");
    const closeButtons = modal ? modal.querySelectorAll("[data-close-mini-game]") : [];
    let activeTrigger = null;

    const openGame = (trigger) => {
        if (!modal || !frame) return;
        activeTrigger = trigger;
        if (!frame.getAttribute("src")) frame.setAttribute("src", frame.dataset.src);
        modal.classList.add("is-open");
        modal.setAttribute("aria-hidden", "false");
        document.body.classList.add("game-modal-open");
        closeButtons[0]?.focus({ preventScroll: true });
    };

    const closeGame = () => {
        if (!modal) return;
        modal.classList.remove("is-open");
        modal.setAttribute("aria-hidden", "true");
        document.body.classList.remove("game-modal-open");
        activeTrigger?.focus({ preventScroll: true });
    };

    openButtons.forEach((button) => {
        button.addEventListener("click", () => openGame(button));
    });

    closeButtons.forEach((button) => {
        button.addEventListener("click", closeGame);
    });

    modal?.addEventListener("click", (event) => {
        if (event.target === modal) closeGame();
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && modal?.classList.contains("is-open")) closeGame();
    });

    window.addEventListener("message", (event) => {
        if (event.data?.type === "zoo-mini-game-close" && modal?.classList.contains("is-open")) closeGame();
    });

    function escapeHtml(value) {
        return value.replace(/[&<>"']/g, (char) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        }[char]));
    }
})();
