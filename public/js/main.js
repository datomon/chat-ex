let vm = new Vue({
    el: '#app',
    data: {
        socket: null,
        nickname: null,
        input: '',
        placeText: '請輸入你的暱稱，輸入完直按 Enter 就可以送出暱稱。',
        btnText: '加入聊天室',
        users: [],  //使用者列表
        msglist: [{  //訊息列表
                    from: 'other', 
                    content: '歡迎~進入聊天室才看的到別人說什麼，快輸入你的暱稱跟大家一起聊聊天吧!',
                    name: '系統',
                    img: false
                }],
        imglist: ['image/1.png', 'image/2.png', 'image/3.png', 'image/4.png', 'image/5.png', 'image/6.png', 'image/7.png', 'image/8.png', 'image/9.png', 'image/10.png', 'image/11.png', 'image/12.png'],
        fileuploadImg: true,
        uploadImgsrc: ''
    },
    computed: {
        userlist() {
            return this.users.sort();  //排序使用者，確保與Server端順序相同
        }
    },
    watch: {
        msglist() {
            //將捲軸拉到最新的訊息，用 $nextTick 等 DOM 改變完再做動作
            //因為訊息列表是用 data 去 render，所以要等 re-render 頁面後，才計算的到正確高度
            this.$nextTick(() => {
                this.$refs.msglist.scrollTop = this.$refs.msglist.scrollHeight;
            })
        }
    },
    methods: {
        submit() {
            if(this.nickname) {
                //向Server發送自訂的事件名稱、值
                //emit()對socket Server 向某個事件傳值過去
                this.socket.emit('ClinetPushMsg', { content:this.input, name: this.nickname});

                //把你輸入的訊息加到自己的訊息列表中
                this.msglist.push({ from: 'me', content:this.input, name: '你', img: false});

                this.input = '';  //清空輸入欄位
            } else {
                //初次輸入訊息時，是送出暱稱做登入
                this.socket.emit('FirstLogin', this.input);
            }
        },
        addImg(img) {
            if(this.nickname) {
                this.socket.emit('pushImg', { img: img, name: this.nickname });

                //把你輸入的訊息加到自己的訊息列表中
                this.msglist.push(
                    { from: 'me', content: '', name: '你', img: img }
                );
            }
        },
        upload() {
            if(confirm('貼圖上傳時會縮小為 100 x 100 的圖片，ok嗎?')) {
                fileform.uploadfile.click();  //觸發file input的點擊事件
            }
        },
        selectfile(e) {
            let file = e.target.files.item(0);
            let reader = new FileReader;  //新增一個檔案讀取器的實例

            //讓讀取器開始偵聽一個 load(讀取事件)，結束後就執行 vue 的 imgLoaded 方法
            reader.addEventListener('load', this.imgLoaded);

            //用讀取器讀取上傳的圖片，轉成base64網址(用網址就能看到圖)
            reader.readAsDataURL(file);
        },
        imgLoaded(e) {
            this.uploadImgsrc = e.target.result;  //指派已上傳圖片的src
            this.fileuploadImg = false;  //隱藏初始的上傳按鈕圖
        }
    },
    mounted() {
        // 連接 socket Server
        // 當io()不帶入參數時，會直接去連線提供此網頁的網站伺服器
        this.socket = io();

        //取得線上的使用者列表
        this.socket.on('getUsers', res => {
            this.users = res;
        });

        //與伺服器斷線時
        this.socket.on('disconnect', () => {
            alert('與伺服器失去連線');
        });

        //監聽是否有新人進聊天室
        this.socket.on('NewUser', nickname => {
            //有人進聊天室的訊息
            this.msglist.push(
                { from: 'login', content: '', name: nickname, img: false }
            );
            this.users.push(nickname);  //將新使用者名字加入列表中
        });

        //監聽是否有人離線
        this.socket.on('someOneLogout', res => {
            if(this.nickname) {  //有加入聊天才看的到訊息
                if(this.users.length > 0) {
                    this.users.splice(res.idx, 1);

                    //有人進聊天室的訊息
                    this.msglist.push(
                        { from: 'logout', content: '', name: res.user, img: false }
                    );
                }
            }
        });

        //監聽其他人發出的對話訊息
        this.socket.on('newMsg', msg => {
            if(this.nickname) {  //有加入聊天才看的到訊息
                this.msglist.push(
                    { from: 'other', content: msg.content, name: msg.name, img: false }
                );
            }
        });

        //監聽其他人發出的貼圖
        this.socket.on('newImg', msg => {
            if(this.nickname) {  //有加入聊天才看的到訊息
                this.msglist.push(
                    { from: 'other', content: '', name: msg.name, img: msg.img }
                );
            }
        });

        //監聽登入成功訊息
        this.socket.on('LoginSuccess', res => {
            //將暱稱加到自己使用者清單中 (自己的話，會多個「你」)
            this.users.push(this.input + ' (你)');
            
            //記錄暱稱、修改表單樣式
            this.nickname = this.input;
            this.placeText = '請輸入你想說的話，輸入完直按 Enter 就可以送出訊息。';
            this.btnText = '送出訊息';
            this.input = '';
        });

        //監聽登入失敗訊息
        this.socket.on('LoginFalse', res => {
            //暱稱已有人使用
            this.msglist.push(
                { from: 'other', content: '這個暱稱已有人使用，請換一個!', name: '系統', img: false }
            );
            this.input = '';
        });
    }
});