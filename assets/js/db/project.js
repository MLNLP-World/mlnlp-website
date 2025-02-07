async function findAllProjects() {
    const query = `
        select *
        from project
        order by stars desc;
    `;
    return await execute(query);
}