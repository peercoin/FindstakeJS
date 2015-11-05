 module.exports = (function() {

     var activeLanguage = 'en';

     var languagePack = {

         'en': {
             'title':'Peercoin Findstakejs',
             'subtitle': 'see if your coins will mint in the next few days...',
             'Last-known-difficulty': 'Last known difficulty:',
             'Findstake-available': 'Findstake is available untill ',
             'progressstart': 'Findstake started',
             'progressnok': 'unable to retrieve modifier data.',
             'progressStarting': 'Starting...',
             'progressDataOk': 'Data successfully retrieved',
             'go': 'GO',
             'stop': 'STOP',
             'PeercoinAddress': 'Peercoin Address',
             'results': 'results',
             'messages': 'messages',
             'mint-time': 'mint time',
             'max-difficulty': 'max difficulty',
             'stake': 'stake',
             'fininshed': 'Done!',
             'Nounspentoutputs':'No unspent outputs found.'
         },
         'zh': {
             'title':'点点币权益检查FindStakeJS',
             'subtitle': '检查您在接下来几天里是否可以挖到币...',
             'Last-known-difficulty': '上一个难度：',
             'Findstake-available': '权益检查是可用的，直到  ',
             'progressstart': '权益检查开始',
             'progressnok': '不能够提取到modifier数据',
             'progressStarting': '开始...',
             'progressDataOk': '数据成功提取',
             'go': '开始',
             'stop': '停止',
             'PeercoinAddress': '点点币地址',
             'results': '结果',
             'messages': '消息',
             'mint-time': '挖币时间',
             'max-difficulty': '最大难度',
             'stake': '权益',
             'fininshed': '完成！',
             'Nounspentoutputs':'没有找到未花费的输出'
         }


     }
     var translate = function(key, language) {
         if (typeof languagePack[language] == 'undefined') {
             return;
         } else {
             return languagePack[language][key];
         }
     };

     return {
         init: function(language) {
             if (languagePack[language])
                 activeLanguage = language;
         },
         getString: function(key, defaultText) {
             var text = translate(key, activeLanguage);
             if (typeof(text) === 'undefined' || text.length == 0 || text == null) {
                 text = defaultText;
             }
             return text;
         }


     }


 })();
