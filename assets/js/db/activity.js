async function findActivity(type, typeId) {
    // 查询活动信息
    const activityQuery = `
        select *
        from activity
        where type = ${type}
          and type_id = ${typeId};
    `;
    const activityResult = await execute(activityQuery);
    const activity = activityResult[0]

    // 查询活动环节信息
    const activitySegmentQuery = `
        select *
        from activity_segment_view
        where activity_type = ${type}
          and activity_id = ${typeId};
    `;
    const activitySegments = await execute(activitySegmentQuery);

    return {
        "activity": activity,
        "activitySegments": activitySegments
    };
}

async function findActivitiesByPage(page, size){
    // 计算偏移量
    const offset = size * (page - 1);
    // 按页查询活动信息
    const ActivityQuery =  `
        select *
        from activity
        order by time desc
        limit ${size} offset ${offset};
    `;
    const activities = await execute(ActivityQuery);

    const guestList = []
    if (activities != null) {
        for (activity of activities) {
            const activityType = activity["type"];
            const activityTypeId = activity["type_id"];

            const guestQuery = `
                select id, name, organization
                from activity_guest
                where activity_type = ${activityType}
                  and activity_id = ${activityTypeId};
            `;
            const segments = await execute(guestQuery);

            guestList.push(segments);
        }
    }

    return {
        "activities": activities,
        "guestList": guestList
    }
}

async function findActivityCount(){
    const query =  `
        select count(*)
        from activity;
    `;

    const count = await execute(query);
    return count[0]["count(*)"];
}
