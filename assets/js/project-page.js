(function () {
    "use strict";

    if (!document.body.classList.contains("project-page")) {
        return;
    }

    document.body.classList.add("project-page--enhanced");

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    function showStatic() {
        document.querySelectorAll("#project-title, .project-card").forEach((element) => {
            element.classList.add("is-visible");
            element.style.removeProperty("--project-delay");
        });
    }

    function initReveal() {
        const title = document.querySelector("#project-title");
        const cards = document.querySelectorAll(".project-card");

        if (reduceMotion.matches || !("IntersectionObserver" in window)) {
            showStatic();
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) {
                    return;
                }

                const target = entry.target;
                target.classList.add("is-visible");
                observer.unobserve(target);
            });
        }, {
            threshold: 0.14,
            rootMargin: "0px 0px -8% 0px"
        });

        if (title) {
            observer.observe(title);
        }

        cards.forEach((card, index) => {
            card.style.setProperty("--project-delay", `${index * 80}ms`);
            observer.observe(card);
        });
    }

    function formatCount(value) {
        const number = Number(value) || 0;
        if (number >= 1000) {
            return `${(number / 1000).toFixed(number >= 10000 ? 0 : 1).replace(/\.0$/, "")}k`;
        }
        return `${number}`;
    }

    function hydrateForks() {
        // 实时从 GitHub 公开 API 拉取 star / fork（同一次请求同时拿到两者，纯前端、不依赖任何后端，
        // 任何静态托管平台都通用）。用 localStorage + 1 小时 TTL 缓存，降低未登录 API 60 次/小时限流的影响；
        // 拉取失败/被限流时，保留数据库里的兜底值。
        const TTL = 60 * 60 * 1000;
        const badges = document.querySelectorAll("[data-forks-repo]");

        badges.forEach(async (badge) => {
            const repo = badge.getAttribute("data-forks-repo");
            const forkEl = badge.querySelector("[data-forks-count]");
            const card = badge.closest(".project-card");
            const starEl = card ? card.querySelector("[data-stars-count]") : null;

            if (!repo) {
                return;
            }

            const apply = (stars, forks) => {
                if (starEl && stars !== undefined && stars !== null) {
                    starEl.textContent = formatCount(stars);
                }
                if (forkEl && forks !== undefined && forks !== null) {
                    forkEl.textContent = formatCount(forks);
                }
            };

            try {
                const raw = window.localStorage.getItem(`mlnlp:gh:${repo}`);
                if (raw) {
                    const cached = JSON.parse(raw);
                    if (cached && (Date.now() - cached.ts) < TTL) {
                        apply(cached.stars, cached.forks);
                        return;
                    }
                }
            } catch (error) {
                // 忽略缓存读取异常
            }

            try {
                const response = await fetch(`https://api.github.com/repos/${repo}`);
                if (!response.ok) {
                    return; // 限流/失败：保留数据库兜底值
                }

                const data = await response.json();
                apply(data.stargazers_count, data.forks_count);
                try {
                    window.localStorage.setItem(`mlnlp:gh:${repo}`, JSON.stringify({
                        stars: data.stargazers_count,
                        forks: data.forks_count,
                        ts: Date.now()
                    }));
                } catch (error) {
                    // 忽略缓存写入异常
                }
            } catch (error) {
                // GitHub 不可达或被限流时，保留兜底值
            }
        });
    }

    function waitForProjects() {
        const container = document.querySelector("#project-container-data");

        if (!container) {
            initReveal();
            return;
        }

        if (container.querySelector(".project-card")) {
            hydrateForks();
            initReveal();
            return;
        }

        let didInit = false;
        let fallbackTimer = null;
        const startReveal = () => {
            if (didInit) {
                return;
            }

            didInit = true;
            observer.disconnect();
            if (fallbackTimer) {
                window.clearTimeout(fallbackTimer);
            }
            hydrateForks();
            initReveal();
        };

        const observer = new MutationObserver(() => {
            if (container.querySelector(".project-card")) {
                startReveal();
            }
        });

        observer.observe(container, {
            childList: true,
            subtree: true
        });

        fallbackTimer = window.setTimeout(startReveal, 2500);
    }

    window.addEventListener("load", waitForProjects);
})();
