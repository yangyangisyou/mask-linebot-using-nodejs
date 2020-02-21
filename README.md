# 使用Node.js開發結合口罩地圖開放資料的LINE聊天機器人
此專案為開發LINE機器人搭配政府提供的口罩open data為範例，若有任何意見，歡迎回饋。

開發環境：Node.js  
套件：[linebot-sdk](https://www.npmjs.com/package/linebot), [express](https://www.npmjs.com/package/express), [request](https://www.npmjs.com/package/request)  
資料來源：[mask data made by g0v member - kiang](https://raw.githubusercontent.com/kiang/pharmacies/master/json/points.json)

## 使用步驟
1. 到LINE Business開立一個機器人  
取得以下資料：
```
  channelId: CHANNEL_ID,
  channelSecret: CHANNEL_SECRET,
  channelAccessToken: CHANNEL_ACCESS_TOKEN
```
2. 下載這份repository
專案clone下來後，在根目錄新增config.js
```
// 放入你剛剛取得的資料
const channel = {
    CHANNEL_ID: '',
    CHANNEL_SECRET: '',
    CHANNEL_ACCESS_TOKEN: '',
  };

module.exports =  {
    channel: channel
};
```
3. 安裝套件
```
npm install
```

4. 執行專案
```
node app.js
```

5. 用LINE打開你的機器人，即可使用

## 補充
由於是server to server，所以會有跨網域的問題，因此需要補上：  
```
app.all('*', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With');
    next();
});
```

## 基本功能
機器人會根據收到以下的動作，來執行function內的事件  
```
bot.on('message',      function (event) { });
bot.on('follow',       function (event) { });
bot.on('unfollow',     function (event) { });
bot.on('join',         function (event) { });
bot.on('leave',        function (event) { });
bot.on('memberJoined', function (event) { });
bot.on('memberLeft',   function (event) { });
bot.on('postback',     function (event) { });
bot.on('beacon',       function (event) { });
```

## 資料處理
使用者傳送的資料可以從event中取得
```
const message = event.message.text;
```

## 回覆方式
機器人回覆的方式有兩種
1. reply
只能回覆一次
```
event.reply(replyMessage).then(function (data) {}).catch(function (error) {});
```
2. push
可回覆多次，需得知使用者Id
```
const userId = event.source.userId;
```
回覆內容給指定使用者
```
bot.push(userId, '歡迎追蹤口罩地圖'); 
```
## 回覆格式
可單純回覆一個字串或是指定格式  
以口罩地圖為例：
```
{
                type: 'location',
                title: store.properties.name,   
                address: store.properties.address,
                longitude: store.geometry.coordinates[0],
                latitude: store.geometry.coordinates[1]
}
```

文字：    
```
event.reply('Hello, world');
```

多文字：  
```
event.reply(['Hello, world 1', 'Hello, world 2']);
event.reply({ type: 'text', text: 'Hello, world' });
```

一次回覆多個物件：  
```
event.reply([
  { type: 'text', text: 'Hello, world 1' },
  { type: 'text', text: 'Hello, world 2' }
]);
```

回覆圖片：  
```
event.reply({
  type: 'image',
  originalContentUrl: 'https://example.com/original.jpg',
  previewImageUrl: 'https://example.com/preview.jpg'
});
```
更多範例請參考官方文件
## 參考資料  
1. [政府開放資料平台 - 健保特約機構口罩剩餘數量明細清單](https://data.gov.tw/dataset/116285)  
2. [健保特約機構口罩剩餘數量明細清單](https://data.nhi.gov.tw/Datasets/DatasetResource.aspx?rId=A21030000I-D50001-001)  
