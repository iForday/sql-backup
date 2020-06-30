const fs = require('fs');
const fsPromise = fs.promises;
const path = require('path');
const zlib = require('zlib');

module.exports = class {
    constructor(filePath) {
        this.filePath = filePath || undefined;
    }

    gzip(deleteOld = true) {
        return new Promise(async (resolve, reject) => {
            const resultPath = path.resolve(`${this.filePath.localPath}.gz`);
            try {
                if (!this.filePath || !this.filePath.localPath || !this.filePath.absolutePath) {
                    throw '未传入文件地址';
                }
                if (!fs.existsSync(this.filePath.localPath)) {
                    throw '文件不存在';
                }
                const read = fs.createReadStream(this.filePath.localPath);
                const zip = zlib.createGzip();
                const write = fs.createWriteStream(resultPath);
                read.pipe(zip).pipe(write);
                write.on('error', err => {
                    write.end();
                    reject(err);
                });
                write.on('finish', async () => {
                    resolve({
                        localPath: resultPath,
                        absolutePath: `${this.filePath.absolutePath}.gz`
                    });
                    if (deleteOld) {
                        await fsPromise.unlink(this.filePath.localPath);
                    }
                });
            } catch (e) {
                if (fs.existsSync(resultPath)) {
                    await fsPromise.unlink(resultPath);
                }
                reject(e);
            }
        });
    }
}