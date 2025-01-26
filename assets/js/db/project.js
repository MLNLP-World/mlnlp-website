async function findAllProjects() {
    const query = `
        select *
        from project
        order by id;
    `;
    return await execute(query);
}