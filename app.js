const log = require('./class/log');
const AutoTasks = require('./class/AutoTasks');
const cron = require('node-cron');


log.info('数据库备份服务启动成功');
cron.schedule('15 * * * *', async () => {
    // 每小时的第15分钟执行
    try {
        await AutoTasks.backupMysql();
        await AutoTasks.bakupMongoDB();
        await AutoTasks.deleteBackup();
    } catch (e) {
        log.error(e);
    }
}, {
    scheduled: true,
    timezone: 'Asia/Shanghai'
});