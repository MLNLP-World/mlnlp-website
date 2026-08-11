(function () {
    "use strict";

    const PAGE_SIZE = 5;
    const AUTOPLAY_DELAY = 6200;
    const DEFAULT_FEATURED_ACTIVITY = {
        type: 2,
        typeId: 41
    };
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let slideIndex = 1;
    let autoSlideInterval = null;
    let featuredActivities = [];
    let totalPagesCache = 1;
    let currentType = 0; // 0 表示全部

    const typeMap = {
        1: "MLNLP Conference",
        2: "MLNLP Seminar",
        3: "MLNLP Academic Talk"
    };

    // 活动分类 Tab（任务3：仅对社区自主活动按类型分类展示）
    const TYPE_TABS = [
        { value: 0, label: "全部" },
        { value: 1, label: "年度大会" },
        { value: 2, label: "学术研讨会" },
        { value: 3, label: "学术Talk" }
    ];

    const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);

    const stripHtml = (value) => String(value ?? "")
        .replace(/<br\s*\/?>/gi, " ")
        .replace(/<\/?[^>]+>/g, "")
        .replace(/\s+/g, " ")
        .trim();

    const getIssueText = (activity) => {
        if (!activity) {
            return "";
        }

        const titleMatch = String(activity.title ?? "").match(/第\s*([0-9一二三四五六七八九十百]+)\s*期/);
        if (titleMatch) {
            return `第 ${titleMatch[1]} 期`;
        }

        if (activity.type_id) {
            return Number(activity.type) === 1 ? "年度大会" : `第 ${activity.type_id} 期`;
        }

        return "";
    };

    const parseTopic = (activity) => {
        const description = String(activity?.description ?? "");
        const quotedMatch = description.match(/[“"]<b>(.*?)<\/b>[”"]/i) || description.match(/[“"]([^”"]+)[”"]/);
        let topicText = stripHtml(quotedMatch ? quotedMatch[1] : "");

        if (!topicText) {
            topicText = String(activity?.title ?? "学术活动");
        }

        const splitIndex = topicText.search(/[：:]/);
        if (splitIndex >= 0) {
            return {
                topic: topicText.slice(0, splitIndex).trim(),
                subtopic: topicText.slice(splitIndex + 1).trim()
            };
        }

        return {
            topic: topicText,
            subtopic: Number(activity?.type) === 1 ? "面向机器学习与自然语言处理的年度学术交流" : "开放、深入的学术交流"
        };
    };

    const getEventSummary = (activity, maxLength = 96) => {
        const fallback = Number(activity?.type) === 1
            ? "围绕机器学习与自然语言处理的年度学术交流。"
            : "围绕机器学习与自然语言处理的前沿议题展开交流。";
        const full = stripHtml(activity?.description || fallback) || fallback;
        const summary = full.length > maxLength ? `${full.slice(0, maxLength).trim()}...` : full;

        return { summary, full };
    };

    const formatEventTime = (activity) => {
        if (!activity?.time) {
            return "时间待公布";
        }

        const start = new Date(String(activity.time).replace(" ", "T"));
        if (Number.isNaN(start.getTime())) {
            return "时间待公布";
        }

        const month = start.getMonth() + 1;
        const day = start.getDate();
        const startHour = String(start.getHours()).padStart(2, "0");
        const startMinute = String(start.getMinutes()).padStart(2, "0");

        if (Number(activity.type) === 3) {
            const end = new Date(start.getTime() + 60 * 60 * 1000);
            const endHour = String(end.getHours()).padStart(2, "0");
            const endMinute = String(end.getMinutes()).padStart(2, "0");
            return `${month} 月 ${day} 日 ${startHour}:${startMinute}-${endHour}:${endMinute}`;
        }

        return `${month} 月 ${day} 日 ${startHour}:${startMinute}`;
    };

    const formatListDate = (timeValue) => {
        const time = new Date(String(timeValue).replace(" ", "T"));
        if (Number.isNaN(time.getTime())) {
            return { year: "", day: "" };
        }

        return {
            year: String(time.getFullYear()),
            day: `${String(time.getMonth() + 1).padStart(2, "0")}/${String(time.getDate()).padStart(2, "0")}`
        };
    };

    const setText = (id, value) => {
        const node = document.getElementById(id);
        if (node) {
            node.textContent = value;
        }
    };

    const updateLink = (id, href, enabledText, disabledText) => {
        const node = document.getElementById(id);
        if (!node) {
            return;
        }

        if (href) {
            node.href = href;
            node.textContent = enabledText;
            node.classList.remove("is-disabled");
            node.removeAttribute("aria-disabled");
        } else {
            node.href = "#";
            node.classList.add("is-disabled");
            node.setAttribute("aria-disabled", "true");
            if (disabledText) {
                node.textContent = disabledText;
            }
        }
    };

    const updateEventInfo = (index) => {
        const activity = featuredActivities[index - 1];
        if (!activity) {
            return;
        }

        const topic = parseTopic(activity);
        const typeLabel = typeMap[activity.type] || "MLNLP Event";
        const summary = getEventSummary(activity);
        const summaryNode = document.getElementById("event-subtopic");

        setText("event-type-pill", typeLabel);
        setText("event-issue-pill", getIssueText(activity));
        setText("event-topic", topic.topic);
        setText("event-subtopic", summary.summary);
        summaryNode?.setAttribute("data-full-content", summary.full);
        summaryNode?.removeAttribute("title");
        summaryNode?.setAttribute("tabindex", "0");
        setText("event-time", formatEventTime(activity));

        updateLink("event-detail-link", activity.html_url, "查看详情", "详情待更新");
    };

    async function loadPage(totalPages, currentPage) {
        try {
            const page = Number(currentPage) || 1;
            const result = await findActivitiesByPage(page, PAGE_SIZE, currentType);
            const activities = result.activities || [];

            const html = activities.map((activity, index) => {
                const date = formatListDate(activity.time);
                const description = getEventSummary(activity, 120);
                const typeLabel = typeMap[activity.type] || "MLNLP Event";

                return `
                    <article class="row activity-category-box">
                        <a href="${escapeHtml(activity.html_url)}" class="col-12 col-md-5 activity-category-cover-box" aria-label="${escapeHtml(activity.title)}">
                            <img loading="lazy" src="${escapeHtml(activity.cover_url)}" alt="${escapeHtml(activity.title)}">
                        </a>
                        <div class="col-12 col-md-7 activity-category-info">
                            <div class="activity-category-info-inner">
                                <div class="activity-category-heading">
                                    <div>
                                        <span class="activity-category-type">${escapeHtml(typeLabel)}</span>
                                        <a href="${escapeHtml(activity.html_url)}">
                                            <h2 class="activity-category-data-title">${escapeHtml(activity.title)}</h2>
                                        </a>
                                    </div>
                                    <div class="activity-category-date" aria-label="${escapeHtml(date.year)} 年 ${escapeHtml(date.day)}">
                                        <p class="activity-category-data-year">${escapeHtml(date.year)}</p>
                                        <p class="activity-category-data-day">${escapeHtml(date.day)}</p>
                                    </div>
                                </div>
                                <p class="activity-category-data-description" tabindex="0" data-full-content="${escapeHtml(description.full)}">${escapeHtml(description.summary)}</p>
                            </div>
                        </div>
                    </article>
                `;
            }).join("");

            $("#activity-category").html(html);
            generatePagination(totalPages, page);
            revealActivityItems();
        } catch (error) {
            console.error("Error fetching activity data:", error);
        }
    }

    function generatePagination(totalPages, currentPage) {
        const startPage = Math.max(1, currentPage - 2);
        const endPage = Math.min(totalPages, currentPage + 2);
        let html = "";

        html += `<a class="page-prev" href="#schedule" onclick="loadPage(${totalPages}, ${currentPage > 1 ? currentPage - 1 : 1})" aria-label="上一页"><i class="bi bi-chevron-left" aria-hidden="true"></i></a>`;

        if (startPage > 1) {
            html += `<a class="page-digit" href="#schedule" onclick="loadPage(${totalPages}, 1)">1</a>`;
            if (startPage > 2) {
                html += "<span>...</span>";
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            const activeClass = i === currentPage ? " active" : "";
            html += `<a class="page-digit${activeClass}" href="#schedule" onclick="loadPage(${totalPages}, ${i})">${i}</a>`;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                html += "<span>...</span>";
            }
            html += `<a class="page-digit" href="#schedule" onclick="loadPage(${totalPages}, ${totalPages})">${totalPages}</a>`;
        }

        html += `<a class="page-next" href="#schedule" onclick="loadPage(${totalPages}, ${currentPage < totalPages ? currentPage + 1 : totalPages})" aria-label="下一页"><i class="bi bi-chevron-right" aria-hidden="true"></i></a>`;

        $("#pagination").html(html);
    }

    async function getTotalPages() {
        try {
            const count = await findActivityCount(currentType);
            return Math.ceil(count / PAGE_SIZE);
        } catch (error) {
            console.error("Error fetching total pages:", error);
            return 1;
        }
    }

    async function initSlides() {
        try {
            const [result, defaultResult] = await Promise.all([
                findActivitiesByPage(1, PAGE_SIZE, currentType),
                findActivity(DEFAULT_FEATURED_ACTIVITY.type, DEFAULT_FEATURED_ACTIVITY.typeId)
            ]);
            const recentActivities = result.activities || [];
            const defaultActivity = defaultResult && defaultResult.activity;

            featuredActivities = defaultActivity
                ? [
                    defaultActivity,
                    ...recentActivities.filter((activity) => !(
                        Number(activity.type) === DEFAULT_FEATURED_ACTIVITY.type &&
                        Number(activity.type_id) === DEFAULT_FEATURED_ACTIVITY.typeId
                    ))
                ].slice(0, PAGE_SIZE)
                : recentActivities;

            const slidesHtml = featuredActivities.map((activity, index) => `
                    <div class="slide" aria-label="${escapeHtml(activity.title)}">
                        <a href="${escapeHtml(activity.html_url)}" class="activity-slide-detail-link" aria-label="${escapeHtml(activity.title)}">
                            <img src="${escapeHtml(activity.cover_url)}" alt="${escapeHtml(activity.title)}">
                        </a>
                    </div>
                `).join("");

            const dotsHtml = featuredActivities.map((activity, index) => `
                <button class="dot" type="button" onclick="currentSlide(${index + 1})" aria-label="查看活动 ${index + 1}: ${escapeHtml(activity.title)}"></button>
            `).join("");

            $("#slides-container").html(slidesHtml);
            $("#event-dots").html(dotsHtml);

            showSlides(1);
            setupCarouselInteractions();
            startAutoSlide();
        } catch (error) {
            console.error("Error fetching activity data:", error);
        }
    }

    function showSlides(n) {
        const slides = Array.from(document.getElementsByClassName("slide"));
        const dots = Array.from(document.getElementsByClassName("dot"));
        if (slides.length === 0) {
            return;
        }

        if (n > slides.length) {
            slideIndex = 1;
        } else if (n < 1) {
            slideIndex = slides.length;
        } else {
            slideIndex = n;
        }

        slides.forEach((slide, index) => {
            const isActive = index === slideIndex - 1;
            slide.classList.toggle("active", isActive);
            slide.setAttribute("aria-hidden", String(!isActive));
            slide.tabIndex = isActive ? 0 : -1;
        });

        dots.forEach((dot, index) => {
            const isActive = index === slideIndex - 1;
            dot.classList.toggle("active-dot", isActive);
            dot.setAttribute("aria-current", isActive ? "true" : "false");
        });

        updateEventInfo(slideIndex);
    }

    function currentSlide(n) {
        showSlides(Number(n));
        resetAutoSlide();
    }

    function prevSlide() {
        showSlides(slideIndex - 1);
        resetAutoSlide();
    }

    function nextSlide() {
        showSlides(slideIndex + 1);
    }

    function startAutoSlide() {
        if (prefersReducedMotion || featuredActivities.length <= 1) {
            return;
        }

        stopAutoSlide();
        autoSlideInterval = setInterval(nextSlide, AUTOPLAY_DELAY);
    }

    function stopAutoSlide() {
        if (autoSlideInterval) {
            clearInterval(autoSlideInterval);
            autoSlideInterval = null;
        }
    }

    function resetAutoSlide() {
        stopAutoSlide();
        startAutoSlide();
    }

    function setupCarouselInteractions() {
        const gallery = document.getElementById("activity-category-gallery");
        if (!gallery || gallery.dataset.carouselReady === "true") {
            return;
        }

        gallery.dataset.carouselReady = "true";
        gallery.addEventListener("mouseenter", stopAutoSlide);
        gallery.addEventListener("mouseleave", startAutoSlide);
        gallery.addEventListener("focusin", stopAutoSlide);
        gallery.addEventListener("focusout", startAutoSlide);
        gallery.addEventListener("keydown", (event) => {
            if (event.key === "ArrowLeft") {
                event.preventDefault();
                prevSlide();
            }

            if (event.key === "ArrowRight") {
                event.preventDefault();
                currentSlide(slideIndex + 1);
            }
        });
    }

    function initEntranceAnimations() {
        if (prefersReducedMotion) {
            return;
        }

        document.body.classList.add("activity-page--enhanced");

        const hero = document.getElementById("activity-hero-title");
        const showcase = document.getElementById("activity-category-gallery");
        const previousTitle = document.getElementById("activity-category-title");

        requestAnimationFrame(() => {
            hero?.classList.add("is-visible");
            showcase?.classList.add("is-visible");
            previousTitle?.classList.add("is-visible");
        });
    }

    function revealActivityItems() {
        if (prefersReducedMotion) {
            return;
        }

        const items = document.querySelectorAll(".activity-category-box");
        items.forEach((item, index) => {
            item.style.setProperty("--activity-delay", `${index * 70}ms`);
            item.classList.add("is-visible");
        });
    }

    function renderTypeTabs() {
        const container = document.getElementById("activity-type-tabs");
        if (!container) {
            return;
        }

        container.innerHTML = TYPE_TABS.map((tab) =>
            `<button type="button" class="activity-tab${tab.value === currentType ? " active" : ""}" role="tab" onclick="filterActivityType(${tab.value}, this)">${escapeHtml(tab.label)}</button>`
        ).join("");
    }

    async function filterActivityType(type, btn) {
        currentType = Number(type) || 0;

        document.querySelectorAll("#activity-type-tabs .activity-tab").forEach((b) => b.classList.remove("active"));
        if (btn) {
            btn.classList.add("active");
        }

        totalPagesCache = await getTotalPages();
        await loadPage(totalPagesCache, 1);
        // 页面内点击分类只更新下方列表、不重渲染顶部轮播、不滚动，
        // 保证顶部不动、页面不位移（仅下方内容变化）。
    }

    window.loadPage = loadPage;
    window.currentSlide = currentSlide;
    window.prevSlide = prevSlide;
    window.filterActivityType = filterActivityType;
    window.nextSlide = function () {
        nextSlide();
        resetAutoSlide();
    };

    window.addEventListener("load", async () => {
        const params = new URLSearchParams(window.location.search);
        const page = Number(params.get("page")) || 1;

        // 支持通过 URL ?type= 直接筛选（导航下拉跳转，含「全部」type=0）
        const hasTypeParam = params.has("type");
        const typeParam = Number(params.get("type"));
        if ([1, 2, 3].includes(typeParam)) {
            currentType = typeParam;
        }

        initEntranceAnimations();
        renderTypeTabs();
        totalPagesCache = await getTotalPages();
        await initSlides();
        await loadPage(totalPagesCache, page);

        // 从导航下拉带分类跳转过来时（含「全部」），自动滚动到「往期活动」列表区
        if (hasTypeParam) {
            const target = document.getElementById("schedule");
            if (target) {
                setTimeout(() => target.scrollIntoView({ behavior: "smooth", block: "start" }), 250);
            }
        }
    });
})();
