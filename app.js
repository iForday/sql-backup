const log = require('./class/log');
const AutoTasks = require('./class/AutoTasks');
const cron = require('node-cron');
const moment = require('moment');


log.info('数据库备份服务启动成功');
cron.schedule('15 * * * *', async () => {
    // 每小时的第15分钟执行
    try {
        const taskId = moment().utcOffset(8).format('YYYY-MM-DD HH');
        log.info(`备份任务 ${taskId} 开始执行`);
        let start_at = new Date().getTime();
        await AutoTasks.backupMysql();
        await AutoTasks.bakupMongoDB();
        await AutoTasks.deleteBackup();
        let end_at = new Date().getTime();
        let used_time = Math.round((end_at - start_at) / 1000 * 100) / 100;
        log.info(`备份$ {taskId} 执行完成, 用时 ${used_time} 秒`);
    } catch (e) {
        log.error(e);
    }
}, {
    scheduled: true,
    timezone: 'Asia/Shanghai'
});
