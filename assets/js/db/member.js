const MEMBER_HOMEPAGE_OVERRIDES = {
    "张林峰": "https://archiplab-linfengzhang.github.io/",
    "潘亮铭": "https://liangmingpan.bio/",
    "陈冲": "https://chenchongthu.github.io",
    "柴成亮": "https://chai-chengliang.github.io/",
    "杜梦楠": "https://mengnandu.com/",
    "王金鹏": "http://fingerrec.github.io",
    "矣晓沅": "https://xiaoyuanyi.github.io/",
    "赵翔宇": "https://zhaoxyai.github.io/"
};

const MEMBER_ORGANIZATION_OVERRIDES = {
    "李北": "美团",
    "许德容": "中国科学技术大学 & 香港城市大学"
};

async function findMembersByGroup() {
    const membersList = [];

    const maxTermResult = await execute('select max(term_id) from dict_member_term');
    const maxTerm = maxTermResult[0]["max(term_id)"];

    const roles = await findOrderedMemberRoleIds();

    for (const i of roles) {
        const membersByRoleList = [];

        for (let j = maxTerm; j > 0; j--) {
            const members = await findMembersByRoleAndByTerm(i, j);
            if (members != null) {
                membersByRoleList.push(members);
            }
        }

        membersList.push(membersByRoleList);
    }

    return membersList;
}

async function findCurrentMembersByGroup() {
    const membersList = [];

    const latestTerms = await execute(`
        select role_id, max(term_id) as term_id
        from member_view
        group by role_id
        order by
            case role_id
                when 1 then 1
                when 3 then 2
                when 2 then 3
                else role_id + 10
            end;
    `);

    for (const role of latestTerms) {
        const members = await findMembersByRoleAndByTerm(role.role_id, role.term_id);
        if (members != null) {
            membersList.push(members);
        }
    }

    return membersList;
}

async function findHomeMembersByGroup() {
    const membersList = await findCurrentMembersByGroup();
    const founderMembers = await findMembersByRoleAndByTerm(1, 1);

    if (founderMembers != null) {
        membersList.push(founderMembers);
    }

    return membersList;
}

async function findAllMemberGroups() {
    return await findMembersByGroup();
}

async function findFormerMembersByGroup() {
    const membersList = [];

    const roles = await findOrderedMemberRoleIds();

    for (const i of roles) {
        const currentTermResult = await execute(`
            select max(term_id) as term_id
            from member_view
            where role_id = ${i};
        `);

        if (currentTermResult == null) {
            continue;
        }

        const currentTerm = currentTermResult[0].term_id;
        const formerTermResult = await execute(`
            select distinct term_id
            from member_view
            where role_id = ${i}
              and term_id < ${currentTerm}
            order by term_id desc;
        `);
        const membersByRoleList = [];

        if (formerTermResult != null) {
            for (const term of formerTermResult) {
                const members = await findMembersByRoleAndByTerm(i, term.term_id);
                if (members != null) {
                    membersByRoleList.push(members);
                }
            }
        }

        if (membersByRoleList.length) {
            membersList.push(membersByRoleList);
        }
    }

    return membersList;
}

async function findOrderedMemberRoleIds() {
    const result = await execute(`
        select role_id
        from dict_member_role
        order by
            case role_id
                when 1 then 1
                when 3 then 2
                when 2 then 3
                else role_id + 10
            end;
    `);
    return result.map((row) => row.role_id);
}

async function findMembersByRoleAndByTerm(role_id, term_id) {
    const query =  `
        select *
        from member_view
        where role_id = ${role_id} 
          and term_id = ${term_id}
        order by pinyin;
    `;
    const members = await execute(query);

    return members == null
        ? null
        : members.map((member) => ({
            ...member,
            ...(MEMBER_HOMEPAGE_OVERRIDES[member.name]
                ? { homepage_url: MEMBER_HOMEPAGE_OVERRIDES[member.name] }
                : {}),
            ...(MEMBER_ORGANIZATION_OVERRIDES[member.name]
                ? { organization: MEMBER_ORGANIZATION_OVERRIDES[member.name] }
                : {})
        }));
}
