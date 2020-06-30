const fsExtra = require('fs-extra');
const fs = require('fs');
const fsPromise = fs.promises;
const OSS = require('ali-oss');
const config = require('../config');

module.exports = class {
    constructor() {
        this.client = new OSS({
            region: config.oss.region,
            accessKeyId: config.oss.accessKeyID,
            accessKeySecret: config.oss.accessKeySecret,
            bucket: config.oss.bucket,
            internal: config.oss.internal || false,
            secure: config.oss.secure || false
        });
    }

    async upload(loaclPath, cloudPath) {
        if (!this.client) {
            throw 'OSS客户端未启动';
        }
        if (!loaclPath) {
            throw '未传入本地地址';
        }
        if (!cloudPath) {
            throw '未传入远程地址';
        }
        const stream = fsExtra.createReadStream(loaclPath);
        const fileLength = (await fsPromise.stat(loaclPath)).size;
        let ossUploadResult = await this.client.putStream(cloudPath, stream, { contentLength: fileLength });
        if (ossUploadResult.res.status != 200) {
            throw `备份保存失败: ${ossUploadResult.res}`;
        }
    }

    async deleteFile(filePath) {
        if (!filePath) {
            throw '未传入文件路径';
        }
        if (!this.client) {
            throw 'OSS客户端未启动';
        }
        let ossDelResult = await this.client.delete(filePath);
        if (ossDelResult.res.status < 200 || ossDelResult.res.status >= 300) {
            throw `文件删除失败: ${ossDelResult.res}`;
        }
    }

    async deleteFolder(folderPath) {
        if (!folderPath) {
            throw '未传入文件夹路径';
        }
        if (folderPath[folderPath.length - 1] != '/') {
            folderPath = `${folderPath}/`;
        }
        const resourceList = await this._listFolder(folderPath);
        for (let item of resourceList.file) {
            await this.deleteFile(item);
        }
        for (let item of resourceList.folder) {
            await this.deleteFolder(item);
        }
        await this.deleteFile(folderPath);
    }

    async _listFolder(folderPath) {
        if (!folderPath) {
            throw '未传入文件夹路径';
        }
        if (folderPath[folderPath.length - 1] != '/') {
            folderPath = `${folderPath}/`;
        }
        if (folderPath[0] == '/') {
            folderPath = folderPath.substr(1);
        }
        if (!this.client) {
            throw 'OSS客户端未启动';
        }
        const ossListResult = await this.client.list({
            prefix: folderPath,
            delimiter: '/'
        });
        if (ossListResult.res.status < 200 || ossListResult.res.status >= 300) {
            throw `列表信息获取失败: ${ossListResult.res}`;
        }
        let folderList = [];
        let fileList = [];
        if (ossListResult.prefixes) {
            for (let item of ossListResult.prefixes) {
                folderList.push(item);
            }
        }
        if (ossListResult.objects) {
            for (let item of ossListResult.objects) {
                fileList.push(item.name);
            }
        }
        return {
            folder: folderList,
            file: fileList
        }
    }
}