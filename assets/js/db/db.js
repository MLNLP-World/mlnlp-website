/**
 * 配置 SQLite.js 环境，并从指定路径加载 SQLite 数据库文件。
 *
 * @param {string} path 数据库文件的路径。
 * @returns {Promise<SQL.Database>} 加载完成的 SQLite 数据库实例。
 * @throws {Error} 如果数据库文件加载失败或初始化过程中发生错误，将抛出异常。
 */
let cachedDb = null;

async function initDb(path) {
    if (cachedDb == null) {
        config = {
            locateFile: file => `./assets/vendor/sql/${file}`
        };

        // 初始化 SQLite.js 环境
        const SQL = await initSqlJs(config);

        // 加载指定路径的 SQLite 数据库文件
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error(`Failed to load database file from ${path}`);
        }

        // 创建并返回 SQLite 数据库实例
        const buffer = await response.arrayBuffer();
        cachedDb = new SQL.Database(new Uint8Array(buffer))
    }

    return cachedDb;
}

async function execute(query) {
    const db = await initDb('db/mlnlp.sqlite');

    const result = db.exec(query);
    try {
        return convertToDictArray(result);
    } catch (e) {
        return null;
    }
}

/**
 * 将数据库查询结果转换为字典数组。
 *
 * @param result 数据库查询结果。
 * @returns {*} 包含数据库查询结果信息的字典数组。
 * @throws {Error} 输入的 result 格式无效。
 */
function convertToDictArray(result) {
    // 检查 result 是否有效
    if (!result || !result.length || !result[0].values || !result[0].columns) {
        throw new Error("Invalid result format");
    }

    // 提取列名和数据
    const columns = result[0].columns;
    const values = result[0].values;

    // 将每一行数据转换为字典
    const rows = values.map(row => {
        const rowDict = {};
        columns.forEach((column, index) => {
            rowDict[column] = row[index];
        });
        return rowDict;
    });

    return rows;
}