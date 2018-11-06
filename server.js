//因為 socket 協定需 http 做交握
//實例化 Experss，並用它建立 http Server
//再把 http Server 給 socket.io 建立 socket Server
let express = require('express');
let app = express();
let http = require('http').Server(app);
let io = require('socket.io')(http);

let userlist = [];  //使用者列表

//設定 express 的靜態資源目錄(這樣才能讀取到link的css檔之類的)
app.use(express.static('./public'));

//定義首頁的路由
app.get('/', (req, res) => {
    //傳送給 client 端根目錄下 public/index.html 檔內容
    //__dirname 是返回這隻檔案所在目錄的路徑(只顯示到目錄)，類似系統的 pwd 指令
    res.sendFile(__dirname + 'public/index.html');
});

//當 socket Server 與 client 端連結上時(監聽 connection 事件)
io.on('connection', socket => {
    //連結成功時，馬上回傳目前的使用者列表
    socket.emit('getUsers', userlist);

    //---- 監聽第一次登入時，傳來的暱稱 ----
    socket.on('FirstLogin', nickname => {
        //核對暱稱是否已被使用
        $hasName = userlist.find(item => {
            return nickname === item;
        });

        //假如有找到就回傳錯誤
        if($hasName) {
            socket.emit('LoginFalse', { success: false });

        } else {
            socket.username = nickname;  //將暱稱存到這次連線的自訂屬性 username 中
            userlist.push(nickname);  //將暱稱加到使用者列表
            userlist.sort();  //排序列表

            //向client端的「LoginSuccess」事件傳送成功訊息
            socket.emit('LoginSuccess', { success: true });

            //用廣播的方式(自己以外的人都會收到)，告訴所有人新的使用者名字
            socket.broadcast.emit('NewUser', nickname);

            console.log(`${socket.username} 進入聊天室(${new Date().toLocaleString()})`);
        }
    });
    
    //----當與 client 端斷開連結時(監聽 disconnect 事件)----
    socket.on('disconnect', res => {
        if(socket.username) {
            //從使用者清單中找出索引
            let idx = userlist.findIndex(item => {
                return item === socket.username;
            });
            
            userlist.splice(idx, 1);  //移除該使用者

            //若還有登入中的使用者，廣播說有人離線及該使用者的資料
            if(userlist.length > 0) {
                socket.broadcast.emit('someOneLogout', {
                    idx: idx,
                    user: socket.username
                });
            }
            
            console.log(`${socket.username} 已離線(${new Date().toLocaleString()})`);
        }
    });

    //---- 監聽 client 端輸入的訊息 ----
    //收到訊息後，用廣播傳給其他人
    socket.on('ClinetPushMsg', msg => {
        socket.broadcast.emit('newMsg', msg);
    });

    
});

http.listen(3000, () => {
    console.log('listening on *:3000');
});