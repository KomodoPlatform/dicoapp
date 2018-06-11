import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import Clipboard from 'clipboard';
import './wallet.html';
import { Userdata } from '/imports/api/userdata/userdata.js';
import { Transactions } from '/imports/api/transactions/transactions.js';
import tokenconfig from '/imports/api/config/electrum.js';

const numcoin = 100000000;

Template.wallet.onCreated(function () {
  if (!Meteor.isDesktop) {
      Meteor.subscribe('userdata.all');
      Meteor.subscribe('transactions.all');
  }
  Session.set("currentcoin", "KMD");
});

Template.wallet.onRendered(function() {
  var clipboard = new Clipboard('.btn-copy-link');
  clipboard.on('success', function(e) {
      console.info('Action:', e.action);
      console.info('Text:', e.text);
      console.info('Trigger:', e.trigger);

      e.clearSelection();
  });
});

console.log(Transactions.find().count());

Template.registerHelper('loading', function() {
  return Session.get("loading");
});

Template.wallet.helpers({
  activeSendButton: function(){
    //return Session.get("activeSendButton");
  },
  activeAddressButton: function(){
    //return Session.get("activeAddressButton");
  },
  coins: function(){
     return ["KMD", tokenconfig.dICOtoken.shortcode, "LTC", "BTC"];
  },
  currentcoin: function(){
   return Session.get("currentcoin");
  },
  coinsString: function() {
    if (Session.get("currentcoin") == "KMD") {
      return "Komodo";
    } else if (Session.get("currentcoin") == tokenconfig.dICOtoken.shortcode) {
      return tokenconfig.dICOtoken.name;
    } else if (Session.get("currentcoin") == "LTC") {
      return "Litecoin";
    }else if (Session.get("currentcoin") == "BTC") {
      return "Bitcoin";
    }
  },
  balance: function(){
      return Userdata.findOne({coin:Session.get("coin")}) && parseFloat(Userdata.findOne({coin:Session.get("coin")}).balance/numcoin).toFixed(8);
  },
  balanceKMD: function(){
      return Userdata.findOne({coin:"KMD"}) && parseFloat(Userdata.findOne({coin:"KMD"}).balance/numcoin).toFixed(8);
  },
  balancedICOT: function(){
      return Userdata.findOne({coin:tokenconfig.dICOtoken.shortcode}) && parseFloat(Userdata.findOne({coin:tokenconfig.dICOtoken.shortcode}).balance/numcoin).toFixed(8);
  },
  balanceLTC: function(){
      return Userdata.findOne({coin:"LTC"}) && parseFloat(Userdata.findOne({coin:"LTC"}).balance/numcoin).toFixed(8);
  },
  dICOTName: function(){
    return tokenconfig.dICOtoken.shortcode;
  },
  balanceBTC: function(){
      return Userdata.findOne({coin:"BTC"}) && parseFloat(Userdata.findOne({coin:"BTC"}).balance/numcoin).toFixed(8);
  },
  address: function(){
    return Userdata.findOne({coin:Session.get("currentcoin")}) && Userdata.findOne({coin:Session.get("currentcoin")}).smartaddress.toString();
  },
  transactions: function(){
    return Transactions.find({}, {sort: {createdAt: -1}, limit: 10});
  },
  activecoinKMD: function(){
    if (Session.get("coin") == "KMD") {
      return true;
    } else {
      return false;
    }
  },
  activecoindICOT: function(){
    if (Session.get("coin") == tokenconfig.dICOtoken.shortcode) {
      return true;
    } else {
      return false;
    }
  },
  activecoinLTC: function(){
    if (Session.get("coin") == "LTC") {
      return true;
    } else {
      return false;
    }
  },
  activecoinBTC: function(){
    if (Session.get("coin") == "BTC") {
      return true;
    } else {
      return false;
    }
  },
  price: function(){
    if(Session.get("price")==0){
      return NaN;
    }
    else{
      return Session.get("price");
    }
  },
  total: function(){
    return Session.get("price"); //* Session.get("buyamount")/numcoin;
  },
  swaps: function(){
    //return SwapData.find({}, {sort: {sorttime: -1}});
  },
  sendDisabled: () => {
    return Session.get("sendInProgress") === 'yes';
  }
});

Template.registerHelper('formatDate', function(date) {
  return moment(date).format('MM-DD-YYYY');
});

Session.set("activeSendButton", true);
Template.wallet.events({
"change #coin-select": function (event, template) {
    var coin = $(event.currentTarget).val();
    Session.set("currentcoin", coin);
},
 "click .sendcoins": function (event, template) {
    event.preventDefault();
    const amount = Number(Number(template.find(".amount").value).toFixed(8)) * numcoin;
    const addr = template.find(".sendaddress").value;
    if(Number(Userdata.findOne({coin:Session.get("currentcoin")}).balance) > (amount + Number(0.00010000*numcoin)) && addr != "")
    {
        const coin = Session.get("currentcoin");
        console.log(Session.get("currentcoin"));
        if (Meteor.isDesktop) {
            Session.set('sendInProgress', 'yes');
            Desktop.fetch('marketmaker', 'sendToAddress', 60000, coin, addr, amount)
                .then(([result, value]) => {
                    if (result) {
                        swal("Transaction sent", "txid: " + value, "success");
                        Session.set('sendInProgress', 'no');
                    } else {
                        throw new Error(value);
                        Session.set('sendInProgress', 'no');
                    }
                })
                .catch(e => {
                    swal("Error!", e.toString(), "error");
                    Session.set('sendInProgress', 'no');
                });
        } else {
            Session.set('sendInProgress', 'yes');
            Meteor.call("sendtoaddress", Session.get("currentcoin"), addr, amount, (error, result) => {
                if (error) {
                    console.log(error);
                    swal("Error!", "Errorcode: " + error.error.code, "error");
                    Session.set('sendInProgress', 'no');
                }
                else {
                    swal("Transaction sent", "txid: " + result, "success");
                    Session.set('sendInProgress', 'no');
                }
            });
        }
    }
    else swal("Error!", "Not enough balance (forgot txfee?)", "error");
    Session.set('sendInProgress', 'no');
  },
});
