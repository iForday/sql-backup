const log = require('./log');
const fs = require('fs');
const spawn = require('child_process').spawn;
const path = require('path');
const moment = require('moment');
const makeDir = require('make-dir');
const config = require('../config');
const rimraf = require('rimraf');
const util = require('util');
const promisify = util.promisify;
const rimrafSync = promisify(rimraf);

module.exports = class {
    constructor(host, port) {
        this.host = host || '127.0.0.1';
        this.port = port || 27017;
        this.mongodump = null;
    }

    backup(username = 'root', password = 'passwd', authenticationDatabase = 'admin', database = 'test') {
        return new Promise(async (resolve, reject) => {
            const absolutePath = `backup/${config.common.prefix}/${moment().utcOffset(8).format('YYYY-MM-DD')}/${moment().utcOffset(8).format('HH')}/mongodb`;
            const pathDir = path.resolve(`${__dirname}/../${absolutePath}`);
            const fileDir = path.resolve(`${await makeDir(pathDir)}/${database}.gz`); 
            this.mongodump = spawn('mongodump', [
                '-h',
                this.host,
                '--port',
                this.port,
                '-u',
                username,
                '-p',
                password,
                '--authenticationDatabase',
                authenticationDatabase,
                '-d',
                database,
                `--archive=${fileDir}`,
                '--gzip'
            ]);
            this.mongodump.stdout.on('end', () => {
                resolve({
                    localPath: fileDir,
                    absolutePath: `${absolutePath}/${database}.gz`
                });
            });
            this.mongodump.stdout.on('error', async (e) => {
                try {
                    reject(e.toString());
                    await rimrafSync(fileDir);
                } catch (_err) {
                    log.error(_err);
                }
            });
            this.mongodump.stdout.on('close', () => {
                resolve({
                    localPath: fileDir,
                    absolutePath: `${absolutePath}/${database}.gz`
                });
            });
            this.mongodump.stderr.on('data', async (data) => {
                try {
                    let msg = data.toString();
                    if (msg.indexOf('Failed:') != -1 || msg.indexOf('error') != -1) {
                        reject(msg);
                        await rimrafSync(fileDir);
                    }
                } catch (_err) {
                    log.error(_err);
                }
            });
        });
    }

    close() {
        if (this.mongodump) {
            this.mongodump.kill('SIGINT');
            this.mongodump = null;
        }
    }
}