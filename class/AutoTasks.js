const MysqlBackup = require('./mysql_backup');
const MongoBackup = require('./mongodb_backup');
const CompressFile = require('./compress_file');
const AliOSS = require('./oss');
const config = require('../config');
const log = require('./log');
const moment = require('moment');
const path = require('path');
const fs = require('fs');
const fsPromise = fs.promises;
const rimraf = require('rimraf');
const util = require('util');
const promisify = util.promisify;
const rimrafSync = promisify(rimraf);

module.exports = class {
    static async backupMysql() {
        const mBackup = new MysqlBackup(config.mysql.host, config.mysql.port, config.mysql.username, config.mysql.password);
        const oss = new AliOSS();
        const databaseList = await mBackup.getTables();
        for (let item of databaseList) {
            try {
                let path = await mBackup.backup(item);
                mBackup.close();
                const compress = new CompressFile(path);
                path = await compress.gzip();
                log.info(`MYSQL数据库[${item}]本地备份成功, 文件路径[${path.localPath}]`);
                await oss.upload(path.localPath, path.absolutePath);
                log.info(`MYSQL数据库[${item}]OSS备份成功, 文件路径[${path.absolutePath}]`);
            } catch (err) {
                log.error(`MYSQL数据库[${item}]出现异常:`, err);
            }
        }
    }

    static async bakupMongoDB() {
        const mongo = new MongoBackup(config.mongodb.host, config.mongodb.port);
        const oss = new AliOSS();
        for (let item of config.mongodb.db) {
            try {
                let path = await mongo.backup(item.username, item.password, item.authenticationDatabase, item.database);
                log.info(`MongoDB数据库[${item.database}]本地备份成功, 文件路径[${path.localPath}]`);
                await oss.upload(path.localPath, path.absolutePath);
                log.info(`MongoDB数据库[${item.database}]OSS备份成功, 文件路径[${path.absolutePath}]`);
            } catch (error) {
                log.error(`MongoDB数据库[${item.database}]出现异常:`, error);
            }
        }
    }

    static async deleteBackup() {
        const oss = new AliOSS();
        const absolutePath = `backup/${config.common.prefix}/${moment().subtract(4, 'days').utcOffset(8).format('YYYY-MM-DD')}/${moment().subtract(4, 'days').utcOffset(8).format('HH')}`;
        const localPath = path.resolve(`${__dirname}/../${absolutePath}`);
        const isFileExist = await fs.existsSync(localPath);
        if (isFileExist) {
            await rimrafSync(localPath);
            log.info(`删除过期本地备份[${localPath}]完成`);
        }
        await oss.deleteFolder(absolutePath);
        log.info(`删除过期OSS备份[${absolutePath}]完成`);
    }
}