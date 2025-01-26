async function findMembersByGroup() {
    const membersList = [];

    const maxTermResult = await execute('select count(*) from dict_member_term');
    const maxTerm = maxTermResult[0]["count(*)"];

    const maxRoleResult = await execute('select count(*) from dict_member_role');
    const maxRole = maxRoleResult[0]["count(*)"];

    for (let i = 1; i <= maxRole; i++) {
        const membersByRoleList = [];

        for (let j = maxTerm; j > 0; j--) {
            const members = await findMembersByRoleAndByTerm(i, j);
            membersByRoleList.push(members);
        }

        membersList.push(membersByRoleList);
    }

    return membersList;
}

async function findMembersByRoleAndByTerm(role_id, term_id) {
    const query =  `
        select *
        from member_view
        where role_id = ${role_id} 
          and term_id = ${term_id}
        order by pinyin;
    `;
    return await execute(query);
}