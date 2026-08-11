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

    function hydrateGithubStats() {
        const targets = new Map();
        const statsCacheVersion = "20260721-github-stats";

        Object.keys(window.sessionStorage).forEach((key) => {
            if (key.startsWith("mlnlp:github-stats:") && !key.startsWith(`mlnlp:github-stats:${statsCacheVersion}:`)) {
                window.sessionStorage.removeItem(key);
            }
        });

        document.querySelectorAll("[data-stars-repo], [data-forks-repo]").forEach((badge) => {
            const repo = badge.getAttribute("data-stars-repo") || badge.getAttribute("data-forks-repo");

            if (!repo) {
                return;
            }

            if (!targets.has(repo)) {
                targets.set(repo, { stars: [], forks: [] });
            }

            const target = targets.get(repo);
            const starsCount = badge.querySelector("[data-stars-count]");
            const forksCount = badge.querySelector("[data-forks-count]");

            if (starsCount) {
                target.stars.push(starsCount);
            }

            if (forksCount) {
                target.forks.push(forksCount);
            }
        });

        function applyStats(target, stats) {
            if (stats.stars != null) {
                target.stars.forEach((count) => {
                    count.textContent = formatCount(stats.stars);
                });
            }

            if (stats.forks != null) {
                target.forks.forEach((count) => {
                    count.textContent = formatCount(stats.forks);
                });
            }
        }

        targets.forEach(async (target, repo) => {
            const cacheKey = `mlnlp:github-stats:${statsCacheVersion}:${repo}`;
            const cachedValue = window.sessionStorage.getItem(cacheKey);
            if (cachedValue) {
                applyStats(target, JSON.parse(cachedValue));
                return;
            }

            try {
                const response = await fetch(`https://api.github.com/repos/${repo}`);
                if (!response.ok) {
                    return;
                }

                const data = await response.json();
                const stats = {
                    stars: data.stargazers_count,
                    forks: data.forks_count
                };
                window.sessionStorage.setItem(cacheKey, JSON.stringify(stats));
                applyStats(target, stats);
            } catch (error) {
                // Leave the database values when GitHub is unavailable or rate-limited.
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
            hydrateGithubStats();
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
            hydrateGithubStats();
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
