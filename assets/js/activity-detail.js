(function () {
    "use strict";

    const DEFAULT_ACTIVITY = {
        type: 2,
        typeId: 27
    };

    const ACTIVITY_TYPES = {
        1: "年度大会",
        2: "学术研讨会",
        3: "学术 Talk"
    };

    const ROLE_LABELS = {
        1: "大会主席",
        2: "主持人",
        3: "主讲嘉宾"
    };

    document.addEventListener("DOMContentLoaded", initActivityDetail);

    async function initActivityDetail() {
        const root = document.getElementById("activity-detail-root");
        if (!root) {
            return;
        }

        const params = new URLSearchParams(window.location.search);
        const type = readNumber(params.get("type"), DEFAULT_ACTIVITY.type);
        const typeId = readNumber(params.get("id"), DEFAULT_ACTIVITY.typeId);

        root.innerHTML = renderLoading();

        try {
            if (typeof findActivity !== "function") {
                throw new Error("findActivity is not available");
            }

            const result = await findActivity(type, typeId);
            if (!result || !result.activity) {
                throw new Error("Activity not found");
            }

            const activity = normalizeActivity(result.activity);
            const segments = normalizeSegments(result.activitySegments || []);

            updatePageMeta(activity);
            root.innerHTML = renderActivityPage(activity, segments);
            bindDetailInteractions(root);
        } catch (error) {
            console.error("Error fetching activity data:", error);
            root.innerHTML = renderError();
        }
    }

    function readNumber(value, fallback) {
        const parsed = Number(value);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
    }

    function normalizeActivity(activity) {
        return {
            type: readNumber(activity.type, DEFAULT_ACTIVITY.type),
            type_id: readNumber(activity.type_id, DEFAULT_ACTIVITY.typeId),
            time: activity.time || "",
            title: activity.title || "MLNLP 学术活动",
            description: activity.description || "活动介绍待更新，请关注 MLNLP 社区后续通知。",
            cover_url: activity.cover_url || "assets/img/logo/logo.jpeg",
            video_url: activity.video_url || "",
            html_url: activity.html_url || ""
        };
    }

    function normalizeSegments(segments) {
        return segments.slice().sort((a, b) => {
            const groupDiff = safeOrder(a.segment_group) - safeOrder(b.segment_group);
            if (groupDiff !== 0) {
                return groupDiff;
            }

            const numberDiff = safeOrder(a.segment_number) - safeOrder(b.segment_number);
            if (numberDiff !== 0) {
                return numberDiff;
            }

            return safeTime(a.start_time) - safeTime(b.start_time);
        });
    }

    function safeOrder(value) {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 999;
    }

    function safeTime(value) {
        const date = parseDate(value);
        return date ? date.getTime() : 0;
    }

    function updatePageMeta(activity) {
        const plainTitle = stripHtml(activity.title);
        document.title = `${plainTitle} - MLNLP 学术活动`;

        const meta = document.querySelector('meta[name="description"]');
        if (meta) {
            meta.setAttribute("content", getSummary(activity.description, 150));
        }
    }

    function renderActivityPage(activity, segments) {
        return `
            ${renderHero(activity, segments)}
            ${renderInfoCards(activity, segments)}
            <section class="detail-main detail-section" aria-label="活动详情">
                <div class="detail-content">
                    ${renderContentSection("活动简介", "bi-stars", renderRichText(activity.description), "detail-overview")}
                    ${renderContentSection("嘉宾介绍", "bi-person-lines-fill", renderSpeakerCards(segments), "detail-speakers")}
                    ${renderContentSection("活动议程", "bi-calendar2-week", renderSchedule(activity, segments), "detail-agenda")}
                </div>
            </section>
        `;
    }

    function renderHero(activity, segments) {
        const primaryAction = getPrimaryAction(activity);
        const typeLabel = getActivityTypeLabel(activity.type);
        const guestSummary = getGuestSummary(segments);

        return `
            <section class="detail-hero" aria-labelledby="activity-title">
                <div class="detail-hero__inner">
                    <div class="detail-hero__copy">
                        <div class="detail-kicker-row">
                            <span class="detail-pill detail-pill--accent"><i class="bi bi-cpu"></i>${escapeHtml(typeLabel)}</span>
                        </div>
                        <h1 id="activity-title">${escapeHtml(activity.title)}</h1>
                        <p class="detail-hero__lead">${escapeHtml(getSummary(activity.description, 210))}</p>
                        <div class="detail-hero__actions">
                            ${primaryAction ? renderActionLink(primaryAction, "detail-button--primary") : ""}
                            ${renderActionLink({ href: "#detail-overview", label: "查看详情", icon: "bi-arrow-down", external: false }, "detail-button--secondary")}
                            ${renderActionLink({ href: "#footer", label: "关注公众号", icon: "bi-wechat", external: false }, "detail-button--secondary")}
                        </div>
                    </div>
                    <div class="detail-hero__visual" aria-hidden="true">
                        <figure class="detail-poster-card">
                            <img src="${escapeAttr(activity.cover_url)}" alt="${escapeAttr(activity.title)}活动海报" loading="eager">
                            <figcaption class="detail-poster-caption">
                                <div>
                                    <strong>${escapeHtml(typeLabel)} · 第 ${escapeHtml(activity.type_id)} 期</strong>
                                    <span>${escapeHtml(guestSummary)}</span>
                                </div>
                                <span class="detail-poster-badge">MLNLP</span>
                            </figcaption>
                        </figure>
                    </div>
                </div>
            </section>
        `;
    }

    function renderInfoCards(activity, segments) {
        const typeLabel = getActivityTypeLabel(activity.type);
        const cards = [
            {
                icon: "bi-calendar2-check",
                label: "活动时间",
                value: formatDateTime(activity.time)
            },
            {
                icon: "bi-camera-video",
                label: "活动地点",
                value: "线上会议"
            },
            {
                icon: "bi-mic",
                label: "主讲人 / 嘉宾",
                value: getGuestSummary(segments)
            },
            {
                icon: "bi-journal-richtext",
                label: "活动类型",
                value: typeLabel
            },
            {
                icon: "bi-building",
                label: "主办方",
                value: "MLNLP 社区"
            }
        ];

        const [timeCard, ...metaCards] = cards;

        return `
            <section class="detail-info-strip" aria-label="活动核心信息">
                <article class="detail-info-highlight">
                    <div class="detail-info-highlight__icon">
                        <i class="bi ${escapeAttr(timeCard.icon)}"></i>
                    </div>
                    <div>
                        <span>${escapeHtml(timeCard.label)}</span>
                        <strong>${escapeHtml(timeCard.value)}</strong>
                    </div>
                </article>
                <div class="detail-info-list">
                    ${metaCards.map(card => `
                        <article class="detail-info-item">
                            <i class="bi ${escapeAttr(card.icon)}"></i>
                            <div>
                                <span>${escapeHtml(card.label)}</span>
                                <strong>${escapeHtml(card.value)}</strong>
                            </div>
                        </article>
                    `).join("")}
                </div>
            </section>
        `;
    }

    function renderContentSection(title, icon, content, id) {
        return `
            <article class="detail-card" id="${escapeAttr(id)}">
                <div class="detail-section-heading">
                    <i class="bi ${escapeAttr(icon)}"></i>
                    <h2>${escapeHtml(title)}</h2>
                </div>
                ${content}
            </article>
        `;
    }

    function renderSpeakerCards(segments) {
        const speakers = getUniqueSpeakers(segments);
        if (!speakers.length) {
            return renderEmpty("嘉宾信息待更新，请关注后续活动通知。");
        }

        return `
            <div class="detail-speaker-grid">
                ${speakers.map(renderSpeakerCard).join("")}
            </div>
        `;
    }

    function renderSpeakerCard(speaker) {
        const role = ROLE_LABELS[speaker.role] || "嘉宾";
        const affiliation = [speaker.organization, speaker.title].filter(Boolean).join(" · ") || "机构信息待更新";
        const topic = speaker.heading ? `分享：${speaker.heading}` : "分享主题待更新";
        const biography = stripHtml(speaker.biography || "")
            .replace(/\s*二、分享嘉宾：\s*$/, "");

        return `
            <article class="detail-speaker">
                <img src="${escapeAttr(speaker.avatar_url || "assets/img/logo/logo.jpeg")}" alt="${escapeAttr(speaker.name || "嘉宾")}头像" loading="lazy">
                <div>
                    <div class="detail-speaker-role">${escapeHtml(role)}</div>
                    <h3>${escapeHtml(speaker.name || "待更新")}</h3>
                    <p>${escapeHtml(affiliation)}</p>
                    ${speaker.github_url ? `<a class="detail-speaker-github" href="${escapeAttr(speaker.github_url)}" target="_blank" rel="noopener"><i class="bi bi-house-door"></i> 主页</a>` : ""}
                </div>
                <div class="detail-speaker-topic">
                    <strong>${escapeHtml(topic)}</strong>
                    ${biography ? `<p class="detail-speaker-bio">${escapeHtml(biography)}</p>` : ""}
                </div>
            </article>
        `;
    }

    function renderSchedule(activity, segments) {
        const agendaSegments = Number(activity.type) === 2
            ? segments.filter(segment => Number(segment.role) !== 2)
            : segments;

        if (!agendaSegments.length) {
            return renderEmpty("活动议程待更新。");
        }

        const seminarTimeRanges = Number(activity.type) === 2
            ? getSeminarTimeRanges(activity, agendaSegments)
            : [];

        return `
            <div class="detail-schedule">
                ${agendaSegments.map((segment, index) => {
                    const timeRange = Number(activity.type) === 3
                        ? formatTalkTimeRange(activity, segment)
                        : Number(activity.type) === 2
                            ? seminarTimeRanges[index]
                            : formatTimeRange(segment.start_time, segment.end_time);
                    const speakerMeta = [segment.name, segment.organization, segment.title].filter(Boolean).join(" · ");
                    const heading = segment.heading || ROLE_LABELS[segment.role] || "活动环节";
                    const description = getSummary(segment.description || "", 180);

                    return `
                        <article class="detail-schedule-item">
                            <div class="detail-schedule-time">${escapeHtml(timeRange)}</div>
                            <div class="detail-schedule-body">
                                <h3>${escapeHtml(heading)}</h3>
                                ${description ? `<p>${escapeHtml(description)}</p>` : ""}
                                <div class="detail-schedule-meta">
                                    <span><i class="bi bi-person"></i>${escapeHtml(speakerMeta || "嘉宾信息待更新")}</span>
                                    ${canShowReplay(activity) && segment.video_url ? `<a class="detail-link-chip" href="${escapeAttr(segment.video_url)}" target="_blank" rel="noopener"><i class="bi bi-play-circle"></i>回放</a>` : ""}
                                    ${segment.ppt_url ? `<a class="detail-link-chip" href="${escapeAttr(segment.ppt_url)}" target="_blank" rel="noopener"><i class="bi bi-file-earmark-slides"></i>PPT</a>` : ""}
                                </div>
                            </div>
                        </article>
                    `;
                }).join("")}
            </div>
        `;
    }

    function renderActionLink(action, modifier) {
        const isHash = action.href && action.href.indexOf("#") === 0;
        const target = action.external ? ' target="_blank" rel="noopener"' : "";
        const scrollClass = isHash ? " scrollto" : "";

        return `
            <a class="detail-button ${escapeAttr(modifier)}${scrollClass}" href="${escapeAttr(action.href)}"${target}>
                <i class="bi ${escapeAttr(action.icon)}"></i>
                <span>${escapeHtml(action.label)}</span>
            </a>
        `;
    }

    function bindDetailInteractions(root) {
        root.addEventListener("click", event => {
            const link = event.target.closest('a[href^="#"]');
            if (!link) {
                return;
            }

            const target = document.querySelector(link.getAttribute("href"));
            if (!target) {
                return;
            }

            event.preventDefault();
            const header = document.getElementById("header");
            const offset = header ? header.offsetHeight + 18 : 18;
            const targetTop = target.getBoundingClientRect().top + window.scrollY - offset;
            window.scrollTo({
                top: targetTop,
                behavior: "smooth"
            });
        });
    }

    function renderRichText(value) {
        const html = value || "活动介绍待更新，请关注 MLNLP 社区后续通知。";
        return `<div class="detail-rich-text">${html}</div>`;
    }

    function renderEmpty(message) {
        return `<div class="detail-empty"><i class="bi bi-info-circle"></i>${escapeHtml(message)}</div>`;
    }

    function renderLoading() {
        return `
            <div class="detail-loading">
                <div>
                    <i class="bi bi-cpu"></i>
                    <p>正在加载活动信息...</p>
                </div>
            </div>
        `;
    }

    function renderError() {
        return `
            <div class="detail-error">
                <div>
                    <i class="bi bi-exclamation-triangle"></i>
                    <h1>活动信息暂时无法加载</h1>
                    <p>请稍后刷新页面，或返回学术活动列表查看其它活动。</p>
                    <a class="detail-button detail-button--primary" href="activity_category.html">
                        <i class="bi bi-arrow-left"></i>
                        <span>返回活动列表</span>
                    </a>
                </div>
            </div>
        `;
    }

    function getPrimaryAction(activity) {
        if (canShowReplay(activity) && activity.video_url) {
            return {
                href: activity.video_url,
                label: "观看回放",
                icon: "bi-play-circle",
                external: true
            };
        }

        return {
            href: "#footer",
            label: "立即报名",
            icon: "bi-arrow-right-circle",
            external: false
        };
    }

    function getActivityTypeLabel(type) {
        return ACTIVITY_TYPES[type] || "学术活动";
    }

    function canShowReplay(activity) {
        return true;  // 研讨会也显示回放(有video_url即显示)
    }

    function getUniqueSpeakers(segments) {
        const speakerMap = new Map();

        segments.forEach(segment => {
            if (!segment.name) {
                return;
            }

            const key = `${segment.name}-${segment.organization || ""}`;
            if (!speakerMap.has(key)) {
                speakerMap.set(key, Object.assign({}, segment));
                return;
            }

            const current = speakerMap.get(key);
            if (!current.heading && segment.heading) {
                current.heading = segment.heading;
            }
            if (!current.biography && segment.biography) {
                current.biography = segment.biography;
            }
            if (!current.avatar_url && segment.avatar_url) {
                current.avatar_url = segment.avatar_url;
            }
        });

        return Array.from(speakerMap.values());
    }

    function getGuestSummary(segments) {
        const speakers = getUniqueSpeakers(segments);
        if (!speakers.length) {
            return "嘉宾待更新";
        }

        const names = speakers.map(speaker => speaker.name).filter(Boolean);
        if (names.length <= 3) {
            return names.join("、");
        }

        return `${names.slice(0, 3).join("、")} 等`;
    }

    function formatDate(value) {
        const date = parseDate(value);
        if (!date) {
            return "时间待更新";
        }

        return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`;
    }

    function formatDateTime(value) {
        const date = parseDate(value);
        if (!date) {
            return "时间待更新";
        }

        return `${formatDate(value)} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
    }

    function formatTimeRange(startValue, endValue) {
        const start = parseDate(startValue);
        const end = parseDate(endValue);

        if (!start && !end) {
            return "待更新";
        }

        if (start && end) {
            return `${pad(start.getHours())}:${pad(start.getMinutes())} - ${pad(end.getHours())}:${pad(end.getMinutes())}`;
        }

        const date = start || end;
        return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
    }

    function formatTalkTimeRange(activity, segment) {
        const activityDate = parseDate(activity.time);
        const rawStart = parseDate(segment.start_time) || activityDate;
        const rawEnd = parseDate(segment.end_time);

        if (!rawStart && !rawEnd) {
            return "待更新";
        }

        const start = alignTimeToActivityDate(rawStart, activityDate);
        let end = alignTimeToActivityDate(rawEnd, activityDate);

        if (start && (!end || end.getTime() <= start.getTime())) {
            end = new Date(start.getTime() + 60 * 60 * 1000);
        }

        if (start && end) {
            return `${pad(start.getHours())}:${pad(start.getMinutes())} - ${pad(end.getHours())}:${pad(end.getMinutes())}`;
        }

        const date = start || end;
        return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
    }

    function getSeminarTimeRanges(activity, segments) {
        let nextStart = parseDate(activity.time);

        return segments.map(segment => {
            const recordedStart = parseDate(segment.start_time);
            const recordedEnd = parseDate(segment.end_time);

            if (recordedStart && recordedEnd && recordedEnd.getTime() > recordedStart.getTime()) {
                const hasBreak = Number(segment.role) !== 1 && Number(segment.type) !== 1;
                nextStart = new Date(recordedEnd.getTime() + (hasBreak ? 5 : 0) * 60 * 1000);
                return formatTimeRange(segment.start_time, segment.end_time);
            }

            const start = nextStart || recordedStart || recordedEnd;
            if (!start) {
                return "待更新";
            }

            const isOpening = Number(segment.role) === 1 || Number(segment.type) === 1;
            const durationMinutes = isOpening ? 5 : 40;
            const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
            nextStart = new Date(end.getTime() + (isOpening ? 0 : 5) * 60 * 1000);

            return `${pad(start.getHours())}:${pad(start.getMinutes())} - ${pad(end.getHours())}:${pad(end.getMinutes())}`;
        });
    }

    function alignTimeToActivityDate(value, activityDate) {
        if (!value || !activityDate) {
            return value;
        }

        const aligned = new Date(activityDate.getTime());
        aligned.setHours(value.getHours(), value.getMinutes(), value.getSeconds(), value.getMilliseconds());
        return aligned;
    }

    function parseDate(value) {
        if (!value) {
            return null;
        }

        const normalized = String(value)
            .replace(" ", "T")
            .replace(/(\.\d{3})\d+/, "$1");
        const date = new Date(normalized);
        return Number.isNaN(date.getTime()) ? null : date;
    }

    function pad(value) {
        return String(value).padStart(2, "0");
    }

    function getSummary(value, limit) {
        const text = stripHtml(value).replace(/\s+/g, " ").trim();
        if (!text) {
            return "";
        }

        if (text.length <= limit) {
            return text;
        }

        return `${text.slice(0, limit)}...`;
    }

    function stripHtml(value) {
        const node = document.createElement("div");
        node.innerHTML = value || "";
        return (node.textContent || node.innerText || "").trim();
    }

    function escapeHtml(value) {
        return String(value == null ? "" : value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function escapeAttr(value) {
        return escapeHtml(value);
    }
})();
