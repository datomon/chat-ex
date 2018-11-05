//---- vue component ----


//------- vue.js --------
let vm = new Vue({
    el: '#app',
    data: {
        socket: null,
        nickname: '',
        input: '',
        placeText: '請輸入你的暱稱',
        btnText: '加入聊天室',
        users: [],  //使用者列表
        msgdata: [
            { from: 'other', content: 'jfeijei', name: 'Leo'},
            { from: 'me', content: 'aaaaeddee'},
            { from: 'login', name: 'Mary'},
        ]
    },
    computed: {
        userlist() {
            return this.users.sort();  //排序使用者，確保與Server端順序相同
        },
        msglist() {
            if(this.msgdata) {
                return this.msgdata.map(item => {
                    switch(item['from']) {
                        case 'other':
                            return `<div class="msg_other"><div class="msgname"></div>${item['name']}<div class="msgcontent">${item['content']}</div></div>`;
                            break;
                        case 'me':
                            return `<div class="msg_me"><div class="msgname">你說：</div>${item['content']}</div>`;
                            break;
                        case 'login':
                            return `<div class="msg_login">${item['name']} 進入了聊天室</div>`;
                            break;
                    }
                });
            } else {
                return [];
            }
        }
    }, 
    methods: {
        submit() {
            //向Server發送自訂的事件名稱、值
            //emit()對socket Server 向某個事件傳值過去
            if(this.nickname) {
                this.socket.emit('ClinetPushMsg', { content:this.input, name: this.nickname});
                this.input = '';  //清空輸入欄位
            } else {
                this.socket.emit('FirstLogin', this.input);

                //監聽是否登入成功
                this.socket.on('LoginSuccess', res => {
                    if(res.success) {
                        //將暱稱加到使用者清單中
                        this.users.push(this.input);
                        
                        //記錄暱稱、修改表單樣式
                        this.nickname = this.input;
                        this.placeText = '請輸入你想說的話';
                        this.btnText = '送出訊息';
                        this.input = '';

                    } else {
                        
                    }
                });
            }
        }
    },
    mounted() {
        //連接 socket Server
        //當io()不帶入參數時，會直接去連線提供此網頁的網站伺服器
        // this.socket = io();

        // //取得線上的使用者列表
        // this.socket.on('getUsers', res => {
        //     this.users = res;
        // });

        // //與伺服器斷線時
        // this.socket.on('disconnect', () => {
        //     alert('與伺服器失去連線');
        // });

        // //監聽是否有新人進聊天室
        // this.socket.on('NewUser', nickname => {
        //     this.users.push(nickname);  //將新使用者名字加入列表中
        // });

        // this.socket.on('someOneLogout', res => {
        //     this.users.splice(res.idx, 1);
        //     console.log(res.user + ' 離線了');
        // });

        // //監聽新的對話訊息
        // this.socket.on('newMsg', msg => {
        //     console.log(msg);
        // });
    }
})

function getMsgHTML(obj) {
    
}