const express = require("express")
const VaptchaSdk = require("../lib/vaptcha")
const http =  require('http')
const bodyparser = require("body-parser")
const session = require('express-session')

const app = express()

const config = {
  ip: 'localhost',
  port: 5000,
  vid: '',
  key: ''
}
const vaptchaSdk = new VaptchaSdk(config.vid, config.key)
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));
app.use(express.static('./view'));
app.use(session({
  secret: "ace0123",		//设置签名秘钥  内容可以任意填写
  cookie:{ maxAge: 80*1000 },		//设置cookie的过期时间，例：80s后session和相应的cookie失效过期
  resave: true,			//强制保存，如果session没有被修改也要重新保存
  saveUninitialized: false		//如果原先没有session那么久设置，否则不设置
}))
// app.use('/dist', express.static('./dist')); 
// app.use('/css', express.static('./dist_css'));

app.post('/validate', (req, res) => {
  let { token } = req.body
  let tokens = req.session.token || ''
  res.type('json')
  vaptchaSdk.validate(req, token, tokens)
  .then((val) => {
    req.session.destroy()
    res.send(val)
  }).catch(err=> {
    res.send({success: 0, msg: err});
  })
});

app.get('/offline', (req, res) => {
  let data = req.query
  if(data.offline_action == 'get') {
    vaptchaSdk.getOfflineCaptcha(data.vid)
    .then(result => {
      let dt = {
        imgid: result.imgid,
        knock: result.knock,
        code: '0103'
      }
      req.session[result.knock] = result.imgid 
      res.send(`${data.callback}(${JSON.stringify(dt)})`)
    })
  } else if (data.offline_action == 'verify') {
    let imgid = req.session[data.knock]
    vaptchaSdk.getOfflineToken(imgid, data.v, data.vid)
    .then((dt) => {
      req.session.token = dt.token || ''
      res.send(`${data.callback}(${JSON.stringify(dt)})`)
    })
  }
  
});

http.createServer(app).listen(config.port, config.ip, function () {
  console.log("listening at http://%s:%s", config.ip, config.port);
});