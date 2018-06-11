
import { Userdata } from '../../api/userdata/userdata.js';
import { Tradedata } from '../../api/tradedata/tradedata.js';
import tokenconfig from '../../api/config/electrum.js';

Meteor.setInterval(function() {
    if(Userdata.find().count() > 4) {
        Meteor.call('getbalance', 'KMD');
        Meteor.call('getbalance', tokenconfig.dICOtoken.shortcode);
        Meteor.call('getbalance', 'BTC');
        Meteor.call('getbalance', 'LTC');
    }
    if(Userdata.find().count() > 4 && Tradedata.find().count() > 0) {
    Meteor.call('getprice', 'KMD');
    Meteor.call('getprice', 'BTC');
    Meteor.call('getprice', 'LTC');
    Meteor.call("checkswapstatus");
    }
}, 60000);

Meteor.setInterval(function() {
    if(Userdata.find().count() > 6) {
        Meteor.call('listtransactions', "KMD");
        Meteor.call('listtransactions', "LTC");
        Meteor.call('listtransactions', tokenconfig.dICOtoken.shortcode);
        Meteor.call('listtransactions', "BTC");
    }

}, 90000);
