const PROJECT_GITHUB_STATS = {
    "MLNLP-World/MIT-Linear-Algebra-Notes": { stars: 3752, forks: 699 },
    "MLNLP-World/Top-AI-Conferences-Paper-with-Code": { stars: 2670, forks: 601 },
    "MLNLP-World/AI-Paper-Collector": { stars: 1174, forks: 119 },
    "MLNLP-World/SimBiber": { stars: 468, forks: 38 },
    "MLNLP-World/Paper-Writing-Tips": { stars: 4567, forks: 534 },
    "MLNLP-World/DeepLearning-MuLi-Notes": { stars: 3799, forks: 591 },
    "MLNLP-World/Paper-Picture-Writing-Code": { stars: 1244, forks: 119 },
    "MLNLP-World/Deep_Learning_Notes": { stars: 88, forks: 10 },
    "MLNLP-World/Pytorch-Deep-Learning-Practice-Notes": { stars: 87, forks: 14 },
    "MLNLP-World/MyArxiv": { stars: 343, forks: 26 },
    "MLNLP-World/NLP-Course-Chinese": { stars: 179, forks: 17 },
    "MLNLP-World/LLMs-from-scratch-CN": { stars: 2766, forks: 456 },
    "MLNLP-World/Reinforcement-Learning-Comic-Notes": { stars: 68, forks: 3 },
    "MLNLP-World/Overleaf-Bib-Helper": { stars: 128, forks: 5 },
    "MLNLP-World/Academic-Resume-Template": { stars: 263, forks: 23 },
    "MLNLP-World/minimind-notes": { stars: 123, forks: 7 },
    "MLNLP-World/MachineLearning2025Spring--Notes": { stars: 43, forks: 2 },
    "MLNLP-World/reasoning-from-scratch-CN": { stars: 51, forks: 7 },
    "MLNLP-World/gpu-watchdog": { stars: 3, forks: 1 },
    "MLNLP-World/LLMBeginner": { stars: 178, forks: 21 },
    "MLNLP-World/Paper-Rebuttal-Tips": { stars: 162, forks: 17 }
};

async function findAllProjects() {
    const query = `
        select id,
               title,
               case
                   when github_repo = 'MLNLP-World/AI-Paper-Collector'
                       then '本项目提供了一套用于自动收集 AI 领域论文的脚本，可按研究方向持续追踪并整理最新成果。项目支持从多个来源获取论文信息，减少重复检索与人工归档的成本，帮助研究者更高效地构建和维护自己的论文资料库。'
                   when github_repo = 'MLNLP-World/Paper-Rebuttal-Tips'
                       then 'MLNLP 社区用来帮助大家准备论文 Rebuttal 的资料整理仓库，并汇总回复思路、常见问题与实用表达。'
                   else description
               end as description,
               html_url,
               github_repo,
               stars,
               forks
        from project
        where github_repo <> 'MLNLP-World/Awesome-LLM'
        order by stars desc;
    `;
    const projects = await execute(query);

    return projects
        .map((project) => ({
            ...project,
            ...(PROJECT_GITHUB_STATS[project.github_repo] || {})
        }))
        .sort((a, b) => Number(b.stars) - Number(a.stars));
}
