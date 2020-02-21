// 引用linebot SDK
const linebot = require('linebot');
const express = require('express');
const app = express();
let fs = require('fs');

// 自己的資料
const config = require('./config');
const countyTable = require('./mask/table').COUNTY_TABLE;
const townTable = require('./mask/table').TOWN_TABLE;
const method = require('./mask/method');

// 用於辨識Line Channel的資訊
const bot = linebot({
  channelId: config.channel.CHANNEL_ID,
  channelSecret: config.channel.CHANNEL_SECRET,
  channelAccessToken: config.channel.CHANNEL_ACCESS_TOKEN
});

// Using with your own Express.js server
// 詳情請查看：https://www.npmjs.com/package/linebot#linebotparser
const linebotParser = bot.parser();
app.get('/', function(req, res){
    res.send('Hello');
});

// Global資料
// 資料參考：https://raw.githubusercontent.com/kiang/pharmacies/master/json/points.json
let data = null;

// Global函數
initData = (body) => { data = JSON.parse(body).features };
getDataByCunli = (county, town, cunli) => data.filter(store => store.properties.county===county && store.properties.town===town && store.properties.cunli===cunli && (store.properties.mask_adult>0) && (store.properties.mask_child>0));
getDataByTown = (county, town) => data.filter(store => store.properties.county===county && store.properties.town===town && (store.properties.mask_adult>0) && (store.properties.mask_child>0));
getDataByCounty = (county) => data.filter(store => store.properties.county===county && (store.properties.mask_adult>0) && (store.properties.mask_child>0));

// 取得資料
const request = require('request');
request.get('https://raw.githubusercontent.com/kiang/pharmacies/master/json/points.json', async(error, response, body) => {
    if (!error && response.statusCode == 200) {
        await initData(body);
        console.log('資料接收成功');
    }else{
        console.log('資料接收失敗');
    }
});


// 當有人傳送訊息給Bot時
bot.on('message', function (event) {

    // message from user
    const message = event.message.text;
    let messageArray = message.split(' ');
    let replyMessage  ='';

    // 是否依據縣市查詢資料，開頭必須要是縣市
    if(countyTable.some(county => county===messageArray[0])) {
        let stores = '';
        let replyMaps = '';

        if(messageArray.length===3) {
            //'臺北市', '大安區', '光信里'
            stores = getDataByCunli(messageArray[0], messageArray[1], messageArray[2]);
        }
        else if(messageArray.length===2) {
            //'臺北市', '大安區'
            stores = getDataByTown(messageArray[0], messageArray[1]);
        }else if(messageArray.length===1) {
            //'臺北市'
            // stores = getDataByCounty(messageArray[0]);
            replyMessage = '由於資料過於龐大，因次不建議使用此功能';
            event.reply(replyMessage).then(function (data) {}).catch(function (error) {});
            return;
        }

        let replyInfo = new Array();

        replyMaps = stores.map(store => {
            replyInfo.push({
                maskAdult: store.properties.mask_adult,
                maskChild: store.properties.mask_child,
                updatedTime: store.properties.updated || '無口罩'
            });
            return {
                type: 'location',
                title: store.properties.name,   
                address: store.properties.address,
                longitude: store.geometry.coordinates[0],
                latitude: store.geometry.coordinates[1]
              }
        });

        // 統整有多少口罩可以買
        replyMessage += '總共找到'.concat(stores.length).concat('個地方還有口罩可以買').concat('\n');

        // 列出所有口罩地圖
        replyInfo.forEach((task, i) => {
            const maskAdult = task.maskAdult;
            const maskChild = task.maskChild;
            const updatedTime = task.updatedTime;
            const replyMaskInfo = '成人口罩：'.concat(maskAdult).concat('\n兒童口罩：').concat(maskChild).concat('\n最後更新時間：').concat(updatedTime);
            bot.push(event.source.userId, replyMaps[i]); 
            bot.push(event.source.userId, replyMaskInfo);    
        });
    }
    else {
        replyMessage = {
            type: 'template',
            altText: 'this is a confirm template',
            template: {
                type: 'buttons',
                text: '不知道怎麼使用嗎？按以下內容得到更多資訊\n',
                actions: [
                    {
                        type: 'postback',
                        label: '輸入教學',
                        data: 'guide'
                    }
                ]
            }
        }
    }

    // 回覆內容給使用者
    event.reply(replyMessage).then(function (data) {}).catch(function (error) {});
});

bot.on('postback', function (event) {
    let replyMessage = null;
    let backMessage = event.postback.data;
    if(backMessage==='guide') {
        replyMessage = '以下為可使用的格式範例：\n1. 臺北市 大安區 光信里\n2. 臺北市 大安區\n3. 臺北市（此功能未開放）\n';
    }
    event.reply(replyMessage).then(function (data) {}).catch(function (error) {});
 });

 bot.on('follow', function (event) {
    bot.push(event.source.userId, '歡迎追蹤口罩地圖'); 
 });
 bot.on('unfollow', function (event) {
    bot.push(event.source.userId, '再見'); 
 });

app.post('/linewebhook', linebotParser);

// 跨網域設定
app.all('*', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With');
    next();
});

app.listen(process.env.PORT || 80, function(){
    console.log('bot is running');
});

