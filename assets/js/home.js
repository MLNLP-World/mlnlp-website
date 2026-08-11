(function () {
    "use strict";

    if (!document.body.classList.contains("home-page")) {
        return;
    }

    document.body.classList.add("home-page--enhanced");

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    function initReveal() {
        const sections = document.querySelectorAll("#gallery, #home-projects, #committee, .home-project-card");

        if (reduceMotion.matches || !("IntersectionObserver" in window)) {
            sections.forEach((section) => section.classList.add("is-visible"));
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) {
                    return;
                }

                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            });
        }, {
            threshold: 0.16,
            rootMargin: "0px 0px -8% 0px"
        });

        sections.forEach((section, index) => {
            if (section.classList.contains("home-project-card")) {
                section.setAttribute("data-home-reveal", "");
                section.style.setProperty("--home-reveal-delay", `${(index % 8) * 60}ms`);
            }

            observer.observe(section);
        });
    }

    function initParallax() {
        if (reduceMotion.matches || window.matchMedia("(pointer: coarse)").matches) {
            return;
        }

        const hero = document.querySelector(".home-hero");
        const logo = document.querySelector(".home-hero__brand");
        const panel = document.querySelector(".home-hero__summary");

        if (!hero || !logo || !panel) {
            return;
        }

        let frame = null;

        hero.addEventListener("mousemove", (event) => {
            if (frame) {
                window.cancelAnimationFrame(frame);
            }

            frame = window.requestAnimationFrame(() => {
                const rect = hero.getBoundingClientRect();
                const x = (event.clientX - rect.left) / rect.width - 0.5;
                const y = (event.clientY - rect.top) / rect.height - 0.5;

                logo.style.setProperty("--parallax-x", `${(x * 8).toFixed(2)}px`);
                logo.style.setProperty("--parallax-y", `${(y * 8).toFixed(2)}px`);
                panel.style.setProperty("--panel-parallax-x", `${(x * 4).toFixed(2)}px`);
                panel.style.setProperty("--panel-parallax-y", `${(y * 4).toFixed(2)}px`);
            });
        });

        hero.addEventListener("mouseleave", () => {
            logo.style.setProperty("--parallax-x", "0px");
            logo.style.setProperty("--parallax-y", "0px");
            panel.style.setProperty("--panel-parallax-x", "0px");
            panel.style.setProperty("--panel-parallax-y", "0px");
        });
    }

    function waitForDynamicModules() {
        const targets = [
            document.querySelector("#home-project-grid"),
            document.querySelector("#committee-container")
        ].filter(Boolean);

        if (!targets.length) {
            initReveal();
            initParallax();
            return;
        }

        let didInit = false;
        const start = () => {
            if (didInit) {
                return;
            }

            const hasProjects = document.querySelector(".home-project-card");
            const hasMembers = document.querySelector(".home-member-grid .member");
            if (!hasProjects || !hasMembers) {
                return;
            }

            didInit = true;
            observers.forEach((observer) => observer.disconnect());
            initReveal();
            initParallax();
        };

        const observers = targets.map((target) => {
            const observer = new MutationObserver(start);
            observer.observe(target, {
                childList: true,
                subtree: true
            });
            return observer;
        });

        window.setTimeout(() => {
            if (!didInit) {
                didInit = true;
                observers.forEach((observer) => observer.disconnect());
                initReveal();
                initParallax();
            }
        }, 1600);

        start();
    }

    window.addEventListener("load", () => {
        waitForDynamicModules();
    });
})();
