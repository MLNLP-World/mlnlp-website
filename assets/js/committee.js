(function () {
    "use strict";

    if (!document.body.classList.contains("committee-page")) {
        return;
    }

    document.body.classList.add("committee-page--enhanced");

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    function showStatic() {
        document.querySelectorAll(".committee-hero, .member-group, .member").forEach((element) => {
            element.classList.add("is-visible");
            element.style.removeProperty("--member-delay");
        });
    }

    function isInInitialViewport(element) {
        const rect = element.getBoundingClientRect();
        return rect.top < window.innerHeight && rect.bottom > 0;
    }

    function initReveal() {
        const targets = document.querySelectorAll(".committee-hero, .member-group, .member");

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

                if (target.classList.contains("member-group")) {
                    target.querySelectorAll(".member").forEach((card, index) => {
                        card.style.setProperty("--member-delay", `${index * 60}ms`);
                    });
                }

                observer.unobserve(target);
            });
        }, {
            threshold: 0.14,
            rootMargin: "0px 0px -8% 0px"
        });

        targets.forEach((target) => {
            if (!target.classList.contains("committee-hero")) {
                target.setAttribute("data-committee-reveal", "");
            }

            if (isInInitialViewport(target)) {
                target.classList.add("is-visible");

                if (target.classList.contains("member-group")) {
                    target.querySelectorAll(".member").forEach((card, index) => {
                        card.classList.add("is-visible");
                        card.style.setProperty("--member-delay", `${index * 30}ms`);
                    });
                }

                return;
            }

            observer.observe(target);
        });
    }

    function waitForMembers() {
        const containers = [
            document.querySelector("#committee-container"),
            document.querySelector("#committee-former-container")
        ].filter(Boolean);

        if (!containers.length) {
            initReveal();
            return;
        }

        const hasRenderedMembers = () => containers.every((container) => container.querySelector(".member"));

        if (hasRenderedMembers()) {
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
            initReveal();
        };

        const observer = new MutationObserver(() => {
            if (hasRenderedMembers()) {
                startReveal();
            }
        });

        containers.forEach((container) => observer.observe(container, {
            childList: true,
            subtree: true
        }));

        fallbackTimer = window.setTimeout(startReveal, 2500);
    }

    window.addEventListener("load", waitForMembers);
    window.addEventListener("mlnlp:committee-members-rendered", waitForMembers);
})();
