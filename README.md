# VAPTCHA-nodejs-v3
vaptcha-v3 nodejs demo

1. 在view文件夹下的index.html 页面填入vid
2. 在server文件夹下的inde.js 中填入vid和key
3. 初始化项目：npm install
4. 启动项目：npm start 
5. 测试离线模式时需要在index.html中vaptcha配置中添加`mode: 'offline' `，同时将lib文件夹下的vaptcha.js中_getOfflineKey()的url替换为`url: CONFIG.channel_url + '/offline'`
