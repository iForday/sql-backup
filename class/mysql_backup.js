const log = require('./log');
const fs = require('fs');
const spawn = require('child_process').spawn;
const mysql = require('mysql2/promise');
const path = require('path');
const moment = require('moment');
const makeDir = require('make-dir');
const config = require('../config');


module.exports = class {
    constructor(host, port, username, password) {
        this.host = host || '127.0.0.1';
        this.port = port || 3306;
        this.username = username || 'root';
        this.password = password || 'passwd';
        this.mysqldump = null;
    }

    backup(dbname) {
        return new Promise(async (resolve, reject) => {
            try {
                if (!dbname) {
                    throw '未传入数据库名';
                }
                const absolutePath = `backup/${config.common.prefix}/${moment().utcOffset(8).format('YYYY-MM-DD')}/${moment().utcOffset(8).format('HH')}/mysql`;
                const pathDir = path.resolve(`${__dirname}/../${absolutePath}`);
                const fileDir = path.resolve(`${await makeDir(pathDir)}/${dbname}.sql`);
                const wstream = fs.createWriteStream(fileDir);
                this.mysqldump = spawn('mysqldump', [
                    '-h',
                    this.host,
                    '-P',
                    this.port,
                    '-u',
                    this.username,
                    `-p${this.password}`,
                    '--single-transaction',
                    '--master-data=2',
                    '--skip-add-drop-table',
                    dbname,
                ]);
                this.mysqldump.stdout
                    .pipe(wstream)
                    .on('finish', () => {
                        resolve({
                            localPath: fileDir,
                            absolutePath: `${absolutePath}/${dbname}.sql`
                        });
                    })
                    .on('error', (err) => {
                        reject(err);
                        log.error(err);
                    });
                this.mysqldump.stderr.on('data', (data) => {
                    let msg = data.toString();
                    if (msg.indexOf('Got error') != -1) {
                        reject(msg);
                    }
                });
            } catch (e) {
                reject(e);
            }
        });
    }

    close() {
        if (this.mysqldump) {
            this.mysqldump.kill('SIGINT');
            this.mysqldump = null;
        }
    }

    async getTables() {
        const conn = await mysql.createConnection({
            host: this.host,
            user: this.username,
            database: 'information_schema',
            password: this.password,
            port: this.port
        });
        const [rows, fields] = await conn.execute('SELECT schema_name FROM schemata');
        await conn.end();
        let dbList = [];
        let systemDB = ['information_schema', 'mysql', 'performance_schema'];
        for (let item of rows) {
            if (systemDB.indexOf(item.schema_name) != -1) {
                continue;
            }
            dbList.push(item.schema_name);
        }
        return dbList;
    }
}