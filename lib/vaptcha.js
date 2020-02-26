"use strict"

const crypto = require("crypto")
const request = require("request")
const uuid = require('uuid')
const CONFIG = {
  validate_url: 'http://0.vaptcha.com/verify', // 二次验证地址
  channel_url: 'http://channel2.vaptcha.com/config/', //获取离线key
  verify_url: 'http://offline.vaptcha.com/' //离线验证地址
}


class VAPTCHA {
  /**
   * 实例化
   * @param {string} vid 
   * @param {string} key 
   */

  constructor(vid, key) {
    this._vid = vid
    this._key = key
  }

  /**
   * 二次验证
   * @param {*} req 
   * @param {string} token 
   * @param {int} scenseId 场景
   * @return {Promise}
   */
  validate(req, token, sessionToken = '', scenseId = 0) {
    if(token.indexOf('offline-') >= 0) {
      return this._offlineValidate(token, sessionToken)
    } else {
      let ip = VAPTCHA._getClientIP(req)
      return this._normalValidate(ip, token, scenseId)
    }
  }

  async getOfflineCaptcha(vid) {
    let channel = JSON.parse(await VAPTCHA._getOfflineKey(vid))
    return new Promise((resolve, reject) => {
      const str = VAPTCHA._getRandomStr()
      const imgid = crypto.createHash('md5').update(channel.offline_key + str).digest('hex')
      const knock = uuid.v1();
      resolve({ imgid, knock })
    })
  }

  async getOfflineToken(imgid, v, vid) {
    let channel = JSON.parse(await VAPTCHA._getOfflineKey(vid))
    let validatekey = crypto.createHash('md5').update(v + imgid).digest('hex')
    return new Promise((resolve, reject) => {
      request.get({
        url: CONFIG.verify_url + channel.offline_key + '/' + validatekey
      }, function(err, res, body){
        if(res.statusCode == 200) {
          let token = 'offline-' + uuid.v1() + '-' + new Date().getTime() + VAPTCHA._getRandomStr()
          resolve({
            token,
            code: '0103'
          })
        } else {
          resolve({code: '0104'})
        }
      })
    })
  }

  _normalValidate(ip, token, scenseId) {
    if(!token) return Promise.reject('token not exit')
    let data = {
      id: this._vid,
      secretkey: this._key,
      scense: scenseId,
      ip,
      token
    }
    return new Promise((resolve, reject) => {
      request({
        url: CONFIG.validate_url,
        method: 'POST',
        json: true,
        body: data
      }, function(err, res, body) {
        err? reject(err): resolve(body)

      })

    })
  }

  _offlineValidate(token, sessionToken) {
    return new Promise(resolve => {
      if(token != '' && token == sessionToken) {
        let str = token.split('-')
        let time = Number(str[str.length - 1].substring(0, 13))
        if(new Date().getTime() - time < 180000) {
          resolve({
            success: 1,
          })
        } else {
          resolve({
            success: 0,
            msg: 'token expire'
          })
        }
      } else {
        resolve({
          success: 0,
          msg: 'token error'
        })
      }

    })
  }

  static _getOfflineKey(vid) {
    return new Promise((resolve, reject) => {
      request.get({
        //url: CONFIG.channel_url + '/offline' 测试离线模式时使用，上线请删除
        url: CONFIG.channel_url + vid,
      }, function(err, res, body) {
        err==null?resolve(body): resolve(err)
      })
    })
  }

  static _getClientIP(req) {
    return req.headers['x-forwarded-for'] || // 判断是否有反向代理 IP
        req.connection.remoteAddress || // 判断 connection 的远程 IP
        req.socket.remoteAddress || // 判断后端的 socket 的 IP
        req.connection.socket.remoteAddress;
  }

  static _getRandomStr() {
    const str = '0123456789abcdef'
    return Array(4).fill(0).map(v=>str[Math.floor(Math.random() * 16)]).join('');
  }

  static _getOfflineValidate(offline_key, validate_key) {
    return new Promise(resole => {
      request.get({
        url: CONFIG.validate_url + offline_key + validate_key
      })
    })
  }
}

module.exports = VAPTCHA;
