import config from '../config/config.js'
import schedule from 'node-schedule'
import tools from '../other/tools.js'
import fetch from 'node-fetch'
import { segment } from "oicq"

/** 得到工作配置 */
let works = config.getConfig('work', 'work')
/** 获取工作白名单群号 */
let whitelist = works.whitegrouplist

let workList = []

/** 初始化工作配置 */
for (let i in whitelist) {
    work('openwork', whitelist[i].groupid)
    work('closework', whitelist[i].groupid)
}

/**
 * 工作开关
 * @param {String} type openwork 开启 一 closework 关闭
 * @param {Number} groupid 群号 
 */
function work (type, groupid) {
    /** 得到工作配置 */
    let workConfig = works[type]
    /** 得到工作时间 */
    let hour = workConfig.time.hour
    let minute = workConfig.time.minute
    /** 如果分钟是58或59 */
    if (minute === 58 || minute === 59) {
        minute = tools.randomNum(minute - 2, minute)
    }
    else {
        minute = tools.randomNum(minute, minute + 2)
    }
    let second = workConfig.time.second
    /** 生成cron表达式 */
    let cron = `${second} ${minute} ${hour} * * ?`
    /** 补零 */
    if (minute <= 9) {
        minute = `0${minute}`
    }
    if (second <= 9) {
        second = `0${second}`
    }
    /** 得到工作提示文案 */
    let tipContent = workConfig.tip
    /** 将提示文案中的机器人名字进行替换 */
    tipContent = tipContent.replace('小雪', tools.botName)
    let groupWork = {
        type: type,
        groupqq: groupid,
        hour: hour,
        minute: minute,
        second: second
    }
    workList.push(groupWork)
    /** 如果是开始工作 */
    if (type === 'openwork') {
        /** 创建定时任务 */
        schedule.scheduleJob(cron, async () => {
            redis.del(`Yz:xiaoxue:${groupid}:getoffwork`)
            let url = 'http://pkpk.run/to_image/out_image.php'
            let res = await fetch(url).catch((err) => logger.error(err))
            if (!res) {
                logger.error('[早晚安] 接口请求失败')
                return await Bot.pickGroup(groupid).sendMsg(tipContent)
            }
            Bot.pickGroup(groupid).sendMsg(segment.image(url))
        })
    }
    /** 如果是关闭工作 */
    else {
        /** 创建定时任务 */
        schedule.scheduleJob(cron, async () => {
            redis.set(`Yz:xiaoxue:${groupid}:getoffwork`, 1)
            let url = 'http://pkpk.run/to_image/out_image.php'
            let res = await fetch(url).catch((err) => logger.error(err))
            if (!res) {
                logger.error('[早晚安] 接口请求失败')
                return await Bot.pickGroup(groupid).sendMsg(tipContent)
            }
            Bot.pickGroup(groupid).sendMsg(segment.image(url))
        })
    }
}

export { workList }