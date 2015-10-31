 

 
module.exports = (function() {

    var activeLanguage = 'en';

    var languagePack = {

        'en': {
            'subtitle': 'see if your coins will mint in the next few days...',
            'Last-known-difficulty:': 'Last known difficulty:',
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
            'stake': 'stake'
        },
        'zh': {
            'subtitle': 'see if your coins will mint in the next few days...',
            'Last-known-difficulty:': 'Last known difficulty:',
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
            'stake': 'stake'
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
