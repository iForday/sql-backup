module.exports = {
    common: {
        prefix: 'lab-dev'
    },
    mysql: {
        host: '127.0.0.1',
        username: 'root',
        password: 'password',
        port: 3306
    },
    mongodb: {
        host: '127.0.0.1',
        port: 27017,
        db: [{
            database: 'database',
            username: 'database',
            password: 'password',
            authenticationDatabase: 'admin'
        }]
    },
    oss: {
        accessKeyID: '',
        accessKeySecret: '',
        bucket: '',
        region: 'oss-cn-hangzhou',
        internal: false, //内网访问
        secure: true,
    },
}
