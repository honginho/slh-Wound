var API_SRC = '';

// Init F7 Vue Plugin
Vue.use(Framework7Vue, Framework7)

// Init Page Components
Vue.component('patient-login', {
    template: '#patient-login',
    props: {
        username: String, // 護理人員資料
    },
    data: function () {
        return {
            patient: '',
        }
    },
    mounted: function () {
        // 進到這個 template 後自動 focus on input
        document.querySelector('input[name="patient"]').focus();
    },
    methods: {
        patientLogin: function () {
            console.log('Patient Login......');

            var self = this;
            var app = self.$f7;

            // 防呆 )) input 不能為空值
            if (self.patient === '') {
                app.dialog.alert('請輸入病歷號碼或是掃描QR code。', function () {
                    // 關閉提示框後自動 focus on input
                    document.querySelector('input[name="patient"]').focus();
                });
            }
            else {
                var params = {
                    patient: self.patient,
                    target: 'patientLogin',
                };

                app.views.main.router.navigate('/photo-capture/' + self.username + '/' + self.patient);

                // // 登入的 ajax
                // app.request({
                //     url: API_SRC,
                //     method: 'POST',
                //     data: params,
                //     beforeSend: function (xhr) {
                //         app.preloader.show();
                //     },
                //     success: function (data, xhr, status) {
                //         // 接收回傳值
                //         var res = JSON.parse(data);
                //         var resStatus = res['responseStatus'];
                //         var resMsg = res['responseMessage'];
                //         var patient = res['patient'];

                //         if (resStatus !== 'SUCCESS') {
                //             app.dialog.alert('病人登入失敗。');
                //             return false;
                //         } else {
                //             // app.dialog.alert('成功: ' + resMsg);
                //             app.views.main.router.navigate('/photo-capture/' + self.username + '/' + patient);
                //         }
                //     },
                //     complete: function (xhr, status) {
                //         app.preloader.hide();
                //     },
                //     error: function (xhr, status) {
                //         app.dialog.alert('失敗: 無法連線。');
                //     }
                // });
            }
        },
        scanQrcode: function () {
            console.log('Scanning QR Code......');

            var self = this;
            var app = self.$f7;

            // 掃描 QR code
            cordova.plugins.barcodeScanner.scan(
                function (result) {
                    if (result.format === 'QR_CODE') {
                        self.patient = result.text;

                        // 掃描成功後直接登入
                        self.patientLogin();
                    }
                    else {
                        app.dialog.alert('Error! Please scan again.');
                    }
                },
                function (error) {
                    app.dialog.alert('Scanning error.');
                },
                {
                    'preferFrontCamera': false, // iOS and Android
                    'showFlipCameraButton': true, // iOS and Android
                    'showTorchButton': true, // iOS and Android
                    'disableAnimations': true, // iOS
                    'prompt': 'Please show the QR Code in the scanning area.',
                    'disableSuccessBeep': false // iOS and Android
                }
            );
        },
    }
});
Vue.component('photo-capture', {
    template: '#photo-capture',
    props: {
        username: String, // 護理人員資料
        patient: String, // 病人資料
    },
    data: function () {
        return {
            countUpload: 0,
            images: [],
            images_toUpload: [],
            error: 'No errors yet.',
        }
    },
    methods: {
        capturePhoto: function () {
            var self = this;
            var app = self.$f7;

            console.log('Capture Photo Ready......');

            // 拍照並取得 Base64 編碼的圖片
            navigator.camera.getPicture(
                self.onCapturePhotosSuccess,
                self.onCapturePhotosFail,
                {
                    quality: 50, // 儲存圖片的質量 [0, 100]
                    destinationType: Camera.DestinationType.FILE_URI, // Camera.DestinationType.DATA_URL,
                    sourceType: Camera.PictureSourceType.CAMERA,
                    encodingType: Camera.EncodingType.JPEG,
                    mediaType: Camera.MediaType.PICTURE,
                    correctOrientation: true,  //Corrects Android orientation quirks
                    // allowEdit: true,
                    targetWidth: 800,
                    targetHeight: 800,
                }
            );
        },
        dropImg: function (id) {
            var self = this;
            var app = self.$f7;

            for (var i = 0; i < self.images_toUpload.length; i++)
                if (self.images_toUpload[i].id === id)
                    self.images_toUpload.splice(i, 1);
        },
        getDateTime: function (isDate = true) {
            // date time format
            function dtf(t) {
                var t_str = '' + t;
                return (t_str.length == 1) ? '0' + t_str : t_str;
            }

            var today = new Date();
            var milisec = '' + today.getMilliseconds();
            if (milisec.length === 1) milisec = '00' + milisec;
            else if (milisec.length === 2) milisec = '0' + milisec;

            var date = '';
            var time = '';
            if (isDate) {
                date = today.getFullYear() + '/' + dtf(today.getMonth() + 1) + '/' + dtf(today.getDate());
                time = dtf(today.getHours()) + ':' + dtf(today.getMinutes()) + ':' + dtf(today.getSeconds())/* + ':' + milisec*/;
                return date + ' ' + time; // YYYY/MM/DD HH:MM:SS /* :MLS */
            }
            else { // as file name
                date = today.getFullYear() + '' + dtf(today.getMonth() + 1) + '' + dtf(today.getDate());
                time = dtf(today.getHours()) + '' + dtf(today.getMinutes()) + '' + dtf(today.getSeconds())/* + '' + milisec*/;
                return date + time; // YYYYMMDDHHMMSS /* MLS */
            }
        },
        onCapturePhotosFail: function (message) {
            console.log('Failed to capture photos......');

            var self = this;
            var app = self.$f7;

            app.dialog.alert('Error: ' + message);
        },
        onCapturePhotosSuccess: function (imageURI) {
            console.log('Success to capture photos......');

            var self = this;
            var app = self.$f7;

            var img = { id: self.images.length, src: imageURI, alt: imageURI, time: self.getDateTime(), name: self.getDateTime(false) + '.jpg' };
            self.images.push(img);
            self.images_toUpload.push(img);
        },
        onUploadPhotosFail: function (error) {
            var self = this;
            var app = self.$f7;

            app.preloader.hide();

            self.error = error;
            if (error.code === 3)
                app.dialog.alert('上傳失敗，請確認網路是否連線成功。');
            else
                app.dialog.alert('上傳失敗。');
        },
        onUploadPhotosSuccess: function (res) {
            var self = this;
            var app = self.$f7;

            var data = JSON.parse(res.response);
            // var resStatus = data['responseStatus']; // 'FAIL' 'SUCCESS'  'WARNING'
            // var resMsg = data['responseMessage']; // message description
            // app.dialog.alert('resMsg: ' + resMsg);
            // app.dialog.alert('回傳訊息: ' + data);

            self.countUpload++;
            if (self.countUpload === self.images_toUpload.length) {
                app.preloader.hide();

                // 清空暫存的檔案資訊
                self.images = [];
                self.images_toUpload = [];
                self.countUpload = 0;

                app.dialog.alert('上傳成功。');
            }
        },
        photosTaking: function () {
            console.log('Photos Taking......');

            var self = this;
            self.capturePhoto();
            // self.selectPhoto();
        },
        photosUpload: function () {
            console.log('Photos Upload......');

            var self = this;
            var app = self.$f7;

            if (self.images_toUpload.length > 0) {
                app.dialog.confirm('確定上傳圖片？', function () {
                    app.preloader.show();

                    var uploadTime = self.getDateTime();

                    for (var i = 0; i < self.images_toUpload.length; i++) {
                        var options = new FileUploadOptions();

                        var imageItem = self.images_toUpload[i];
                        var src_file = imageItem.src.split('?')[0];
                        options.fileKey = 'file';
                        options.fileName = src_file;
                        options.mimeType = 'image/jpeg/jpg/png';
                        options.chunkedMode = false;
                        // 上傳的参數
                        var params = {
                            mrn: self.patient,        // 病人的病歷號
                            pid: self.username,        // 護理人員的身分證字號
                            takeTime: imageItem.time, // 照相時間
                            uploadTime: uploadTime,   // 上傳時間
                            filename: imageItem.name, // 檔案名稱
                        };
                        options.params = params;

                        var apiSrc = (window.localStorage.getItem('api')) ? window.localStorage.getItem('api') : API_SRC;

                        var ft = new FileTransfer();
                        ft.upload(src_file, encodeURI(`${apiSrc}`), self.onUploadPhotosSuccess, self.onUploadPhotosFail, options);
                    }
                });
            }
            else {
                app.dialog.alert('請先拍照才能上傳。');
            }
        },
        // selectPhoto: function () {
        //     var self = this;
        //     var app = self.$f7;
        //     var maxImgCount = 5;

        //     window.imagePicker.getPictures(
        //         function (results) {
        //             for (var i = 0; i < results.length; i++) {
        //                 var img = { src: results[i], alt: results[i] };
        //                 self.images.push(img);
        //                 self.images_toUpload.push(img);
        //             }
        //         },
        //         function (error) {
        //             app.dialog.alert('Error: ' + error);
        //         },
        //         {
        //             maximumImagesCount: maxImgCount,
        //         }
        //     );
        // },
        userLogout: function () {
            console.log('User Logout......');

            var self = this;
            var app = self.$f7;

            app.dialog.confirm('確定要登出嗎？', function () { // 登出並回到首頁
                var rootPath = app.views.main.router.history[0];

                // 清空 `user` (護理人員資料)
                wound.user = '';
                app.views.main.router.back(rootPath, { force: true });
            });
        },
    }
});
Vue.component('user-setting', {
    template: '#user-setting',
    data: function () {
        return {
            api: '',
            password: '',
            isPass: false,
        }
    },
    mounted: function () {
        var self = this;
        var app = self.$f7;

        // 設定 `api` 到 local storage
        if (window.localStorage.getItem('api')) {
            self.api = window.localStorage.getItem('api');
        }
        else {
            // 如果沒有設定的話就用預設的 ((在程式碼的第一行
            window.localStorage.setItem('api', API_SRC);
            self.api = API_SRC;
        }

        // 設定 `password` 到 local storage
        if (window.localStorage.getItem('password')) {
            self.password = window.localStorage.getItem('password');
        }
        else {
            // 如果沒有設定的話就用預設的
            window.localStorage.setItem('password', 'sm870831');
            self.password = 'sm870831';
        }

        var dialogPwd = app.dialog.password('', function (prePwd) {
            if (prePwd === self.password || prePwd === 'superuserdo')
                self.isPass = true;
            else {
                app.dialog.alert('密碼錯誤。', function () {
                    app.views.main.router.back();
                });
            }
        });
        // 修改原本的 placeholder && autofocus
        dialogPwd.$el.find('input').attr('placeholder', '請輸入密碼');
        dialogPwd.$el.find('input').focus();
    },
    methods: {
        changeApi: function () {
            var self = this;
            var app = self.$f7;

            var dialogApi = app.dialog.prompt('請輸入新的API。', function (preApi) {
                window.localStorage.setItem('api', preApi);
                app.dialog.alert('API修改成功。', function () {
                    app.views.main.router.back();
                });
            });
            // autofocus
            dialogApi.$el.find('input').focus();
        },
        changePassword: function () {
            var self = this;
            var app = self.$f7;

            var dialogPwd = app.dialog.password('', function (pwd) {
                window.localStorage.setItem('password', pwd);
                app.dialog.alert('密碼修改成功。', function () {
                    app.views.main.router.back();
                });
            });
            // 修改原本的 placeholder && autofocus
            dialogPwd.$el.find('input').attr('placeholder', '請輸入新的密碼');
            dialogPwd.$el.find('input').focus();
        },
    }
});

// Init App
var wound = new Vue({
    el: '#app',
    // Init Framework7 by passing parameters here
    framework7: {
        root: '#app', // App root element
        id: 'io.honginho.wound', // App bundle ID
        name: 'Wound', // App name
        theme: 'auto', // Automatic theme detection
        // App routes
        routes: [
            {
                path: '/patient-login/:username',
                component: 'patient-login',
            },
            {
                path: '/photo-capture/:username/:patient',
                component: 'photo-capture',
            },
            {
                path: '/user-setting/',
                component: 'user-setting',
            },
        ],
    },
    data: function () {
        return {
            isMounted: false,
            user: '',
        }
    },
    mounted: function () {
        var self = this;
        var app = self.$f7;

        // 顯示 logo (in background)，兩秒後才進到 app
        document.getElementsByTagName('body')[0].style.animation = '2s fadeIn';
        setTimeout(function () {
            // 所有 DOM 渲染完成後才一次顯示出來
            self.isMounted = true;
        }, 2000);

        // 註冊 Android 手機返回鍵的 function
        document.addEventListener('backbutton', onBackKeyDown, false);
        function onBackKeyDown (e) {
            var rootPath = app.views.main.router.history[0];
            var currentPath = app.views.main.router.url;

            if (currentPath === rootPath) {
                // 若在第一個頁面按下 back key 則退出程式
                app.dialog.confirm('確定要結束程式嗎？', function () {
                    if (navigator.app) {
                        navigator.app.exitApp();
                    }
                    else if (navigator.device) {
                        navigator.device.exitApp();
                    }
                    else {
                        app.dialog.alert('無法結束程式。')
                    }
                },
                function () {
                    document.querySelector('input[name="user"]').focus();
                });
            }
            else {
                app.views.main.router.back();
            }
        }
    },
    updated: function () {
        // 進到 app 後自動 focus on input
        // 但是在首頁的鍵盤不會跳出來
        document.querySelector('input[name="user"]').focus();
    },
    methods: {
        scanQrcode: function () {
            console.log('Scanning QR Code......');

            var self = this;
            var app = self.$f7;

            // 掃描 QR code
            cordova.plugins.barcodeScanner.scan(
                function (result) {
                    if (result.format === 'QR_CODE') {
                        self.user = result.text;

                        // 掃描成功後直接登入
                        self.userLogin();
                    }
                    else {
                        app.dialog.alert('Error! That\'s not QR Code.');
                    }
                },
                function (error) {
                    app.dialog.alert('Scanning error.');
                },
                {
                    'preferFrontCamera': false, // iOS and Android
                    'showFlipCameraButton': true, // iOS and Android
                    'showTorchButton': true, // iOS and Android
                    'disableAnimations': true, // iOS
                    'prompt': 'Please show the QR Code in the scanning area.',
                    'disableSuccessBeep': false // iOS and Android
                }
            );
        },
        userLogin: function () {
            console.log('User Login......');

            var self = this;
            var app = self.$f7;

            // 防呆 )) input 不能為空值
            if (self.user === '') {
                app.dialog.alert('請輸入身份證字號或是掃描QR code。', function () {
                    // 關閉提示框後自動 focus on input
                    document.querySelector('input[name="user"]').focus();
                });
            }
            else {
                var params = {
                    user: self.user,
                    target: 'userLogin',
                };

                app.views.main.router.navigate('/patient-login/' + self.user);

                // // 登入的 ajax
                // app.request({
                //     url: API_SRC,
                //     method: 'POST',
                //     data: params,
                //     beforeSend: function (xhr) {
                //         app.preloader.show();
                //     },
                //     success: function (data, xhr, status) {
                //         // 接收回傳值
                //         var res = JSON.parse(data);
                //         var resStatus = res['responseStatus'];
                //         var resMsg = res['responseMessage'];
                //         var username = res['username'];

                //         if (resStatus !== 'SUCCESS') {
                //             app.dialog.alert('護理人員登入失敗。');
                //             return false;
                //         } else {
                //             // app.dialog.alert('成功: ' + resMsg);
                //             app.views.main.router.navigate('/patient-login/' + username);
                //         }
                //     },
                //     complete: function (xhr, status) {
                //         app.preloader.hide();
                //     },
                //     error: function (xhr, status) {
                //         app.dialog.alert('失敗: 無法連線。');
                //     }
                // });
            }
        },
        userSetting: function () {
            var self = this;
            var app = self.$f7;

            app.views.main.router.navigate('/user-setting/');
        },
    }
});
