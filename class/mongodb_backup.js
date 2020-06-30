// const log = require('./log');
const fs = require('fs');
const spawn = require('child_process').spawn;
const path = require('path');
const moment = require('moment');
const makeDir = require('make-dir');
const config = require('../config');

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
            this.mongodump.stdout.on('error', (e) => {
                reject(e.toString());
                fs.unlink(fileDir, () => {

                });
            });
            this.mongodump.stdout.on('close', () => {
                resolve({
                    localPath: fileDir,
                    absolutePath: `${absolutePath}/${database}.gz`
                });
            });
            this.mongodump.stderr.on('data', (data) => {
                let msg = data.toString();
                if (msg.indexOf('Failed:') != -1 || msg.indexOf('error') != -1) {
                    reject(msg);
                    fs.unlink(fileDir, () => {

                    });
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