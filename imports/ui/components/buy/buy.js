import './buy.html';


import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Userdata } from '/imports/api/userdata/userdata.js';
import { Tradedata } from '/imports/api/tradedata/tradedata.js';
import { Swapdata } from '/imports/api/swapdata/swapdata.js';
import tokenconfig from '/imports/api/config/electrum.js';

import '../animations/sloader.html';
import '../animations/check.html';

const numcoin = 100000000;

Template.buy.onCreated(function () {
  console.log("rendered");
function init() {
    try{
        Session.set("pricekmd", Tradedata.findOne({key:"priceKMD"}).price/numcoin);
        Session.set("priceltc", Tradedata.findOne({key:"priceLTC"}).price/numcoin);
        Session.set("pricebtc", Tradedata.findOne({key:"priceBTC"}).price/numcoin);
        // if(Tradedata.findOne({key:"priceKMD"}).price/numcoin > 0){
        //   Session.set("ready", true);
        // }else{
        //   Session.set("ready", false);
        // }
    }
    catch(e){
        Session.set("ready", false);
        Session.set("pricekmd", "NaN");
        Session.set("priceltc", "NaN");
        Session.set("pricebtc", "NaN");
    }

}
    if (!Meteor.isDesktop) {
        Meteor.subscribe('userdata.all');
        Meteor.subscribe('swapdata.all');
        this.subscribe('tradedata.all', {
            onReady: function () {
                init();
            },
            onError: function () {
            }
        });
    } else {
        init();
    }

  Session.set("currentcoin", "KMD");
});

Template.registerHelper('loading', function() {
  return Session.get("loading");
});

Template.buy.helpers({
  activeSendButton: function(){
    //return Session.get("activeSendButton");
  },
  activeAddressButton: function(){
    //return Session.get("activeAddressButton");
  },
  coins: function(){
     return ["KMD", "LTC", "BTC"];
  },
  currentcoin: function(){
   return Session.get("currentcoin");
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
  dICOTName: function(){
    return tokenconfig.dICOtoken.shortcode;
  },
  balanceLTC: function(){
      return Userdata.findOne({coin:"LTC"}) && parseFloat(Userdata.findOne({coin:"LTC"}).balance/numcoin).toFixed(8);
  },
  balanceBTC: function(){
      return Userdata.findOne({coin:"BTC"}) && parseFloat(Userdata.findOne({coin:"BTC"}).balance/numcoin).toFixed(8);
  },
  address: function(){
    return Userdata.findOne({coin:Session.get("currentcoin")}) && Userdata.findOne({coin:Session.get("currentcoin")}).smartaddress.toString();
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
  pricekmd: function(){
      return Tradedata.findOne({key:"priceKMD"}) && Tradedata.findOne({key:"priceKMD"}).price/numcoin;
  },
  priceltc: function(){
      return Tradedata.findOne({key:"priceLTC"}) && Tradedata.findOne({key:"priceLTC"}).price/numcoin;
  },
  pricebtc: function(){
      return Tradedata.findOne({key:"priceBTC"}) && Tradedata.findOne({key:"priceBTC"}).price/numcoin;
  },
  ready: function() {
    //Session.get("ready");
    return Tradedata.findOne({key:"priceKMD"}) && Tradedata.findOne({key:"priceKMD"}).price/numcoin > 0 && Tradedata.findOne({key:"priceBTC"}) && Tradedata.findOne({key:"priceBTC"}).price/numcoin > 0 && Tradedata.findOne({key:"priceLTC"}) && Tradedata.findOne({key:"priceLTC"}).price/numcoin > 0;
  },
  pricemongokmd: function(){
    return Tradedata.findOne({key:"priceKMD"}).price/numcoin;
  },
  total: function(){
    return Session.get("price"); //* Session.get("buyamount")/numcoin;
  },
  swaps: function(){
    return Swapdata.find({}, {sort: {createdAt: -1}});
  },
  // oneutxo: function(){
  //   return Tradedata.findOne({key:"oneutxo"}).value;
  // }
  buyDisabled: () => {
    return Session.get("buyInProgress") === 'yes';
  }
});

Template.registerHelper('formatDate', function(date) {
  return moment(date).format('MM-DD-YYYY');
});

Template.registerHelper('and',(a,b)=>{
  return a && b;
});
Template.registerHelper('or',(a,b)=>{
  return a || b;
});

Template.buy.events({
    "click .bntnplus": function(event, template){
      if(Number(template.find(".bntnbuyamount").value) < 500000){
        if(Number(template.find(".bntnbuyamount").value) === 2){
          template.find(".bntnbuyamount").value = 500;
        }else{
          template.find(".bntnbuyamount").value = Number(template.find(".bntnbuyamount").value) + 500;
        }
      }
    },
    "click .bntnminus": function(event, template){
      if(Number(template.find(".bntnbuyamount").value) > 2 && Number(template.find(".bntnbuyamount").value) != 500){
        template.find(".bntnbuyamount").value = Number(template.find(".bntnbuyamount").value) - 500;
      }else if(Number(template.find(".bntnbuyamount").value).toFixed(8) == 0.00000000 || Number(template.find(".bntnbuyamount").value) === 500){
        template.find(".bntnbuyamount").value = 2;
      }
    },
    "click .buybloc": function(event, template) {
        event.preventDefault();
        console.log("Num: " + template.find(".bntnbuyamount").value);
        const amount = Number(Number(template.find(".bntnbuyamount").value).toFixed(8)) * numcoin;
        console.log(amount);
        var unspent = 0;

        function handleResult(coin, result) {
            unspent = result.length;
            if (unspent > 1) {
                if (Meteor.isDesktop) {
                    Desktop.fetch('marketmaker', 'buy', 60000, amount, coin)
                        .then(result => {
                            if (result[0]) {
                                swal("Buy issued", "locked for 3 mins", "success");
                            } else {
                                swal("Oops!", result[1], "error");
                            }
                            Session.set('buyInProgress', 'no');
                        })
                        .catch(e => {
                            swal("Oops!", error.toString(), "error");
                            Session.set('buyInProgress', 'no');
                        });
                } else {
                    Meteor.call("buy", amount, coin, function (error, result) {
                        if (error) {
                            //console.log(error);
                            //  console.log("C "+error.error.message);
                            swal("Oops!", error.message, "error");
                            //swal("Oops!", error.error.message, "error");
                        } else {
                            swal("Buy issued", "locked for 3 mins", "success");
                        }
                    });
                }

            } else {
                if (Number(Userdata.findOne({
                    coin: coin
                }).balance) > ((amount / numcoin * Tradedata.findOne({
                    key: "price" + coin
                }).price / numcoin) + Number(0.00010000 * numcoin)) && amount > 0) {
                    if (Meteor.isDesktop) {
                        Desktop.fetch('marketmaker', 'buy', 60000, amount, coin)
                            .then(result => {
                                if (result[0]) {
                                    console.log(result[1]);
                                    swal("Your funds are being prepared", "please wait a few minutes before buying again.", "success");
                                } else {
                                    console.log(result[1]);
                                    swal("Oops!", result[1], "error");
                                }
                                Session.set('buyInProgress', 'no');
                            })
                            .catch(e => {
                                swal("Oops!", error.toString(), "error");
                                Session.set('buyInProgress', 'no');
                            });
                    } else {
                        Meteor.call("buy", amount, coin, function (error, result) {
                            if (error) {
                                //console.log(error);
                                console.log(error.error);
                                swal("Oops!", error.error.message, "error");
                            } else {
                                console.log(result);
                                swal("Your funds are being prepared", "please wait a few minutes before buying again.", "success");
                            }
                        });
                    }
                } else {
                    {
                        console.log("error");
                        swal("Oops!", "Amount is too big or too small.", "error");
                    }
                }
            }
        }

        if (Number(Userdata.findOne({
                coin: "KMD"
            }).balance) > ((amount / numcoin * Tradedata.findOne({
                key: "priceKMD"
            }).price / numcoin) + Number(0.00010000 * numcoin)) && amount > 0) {
            //start unspent

            if (Meteor.isDesktop) {
                Session.set('buyInProgress', 'yes');
                Desktop.fetch('marketmaker', 'listUnspent', 60000, 'KMD')
                    .then(result => {
                        if (result[0]) {
                            handleResult('KMD', result[1]);
                        } else {
                            console.log(result[1]);
                            swal("Oops!", result[1], "error");
                            Session.set('buyInProgress', 'no');
                        }
                    })
                    .catch(e => {
                        console.log(e);
                        Session.set('buyInProgress', 'no');
                        swal("Oops!", e.toString(), "error");
                    });
            } else {
                Meteor.call("listunspent", "KMD", function (error, result) {
                    if (error) {
                        // console.log(error);
                        console.log(error.error);
                        swal("Oops!", error.error, "error");
                    } else {
                        handleResult('KMD', result);
                    }
                });
            }
            //end unspent
        } else if (Number(Userdata.findOne({
                coin: "BTC"
            }).balance) > ((amount / numcoin * Tradedata.findOne({
                key: "priceBTC"
            }).price / numcoin) + Number(0.00010000 * numcoin)) && amount > 0) {
            //start unspent
            if (Meteor.isDesktop) {
                Session.set('buyInProgress', 'yes');
                Desktop.fetch('marketmaker', 'listUnspent', 60000, 'BTC')
                    .then(result => {
                        if (result[0]) {
                            handleResult('BTC', result[1]);
                        } else {
                            console.log(result[1]);
                            swal("Oops!", result[1], "error");
                            Session.set('buyInProgress', 'no');
                        }
                    })
                    .catch(e => {
                        console.log(e);
                        swal("Oops!", e.toString(), "error");
                        Session.set('buyInProgress', 'no');
                    });
            } else {
                Meteor.call("listunspent", "BTC", function (error, result) {
                    if (error) {
                        // console.log(error);
                        console.log(error.error);
                        swal("Oops!", error.error, "error");
                    } else {
                        handleResult('BTC' , result);
                    }
                });

            }
        } else if (Number(Userdata.findOne({
                coin: "LTC"
            }).balance) > ((amount / numcoin * Tradedata.findOne({
                key: "priceLTC"
            }).price / numcoin) + Number(0.00010000 * numcoin)) && amount > 0) {
            //start unspent
            if (Meteor.isDesktop) {
                Session.set('buyInProgress', 'yes');
                Desktop.fetch('marketmaker', 'listUnspent', 60000, 'LTC')
                    .then(result => {
                        if (result[0]) {
                            handleResult('LTC', result[1]);
                        } else {
                            console.log(result[1]);
                            swal("Oops!", result[1], "error");
                            Session.set('buyInProgress', 'no');
                        }
                    })
                    .catch(e => {
                        console.log(e);
                        swal("Oops!", e.toString(), "error");
                        Session.set('buyInProgress', 'no');
                    });
            } else {
                Meteor.call("listunspent", "LTC", function (error, result) {
                    if (error) {
                        // console.log(error);
                        console.log(error.error);
                        swal("Oops!", error.error, "error");
                    } else {
                        handleResult('LTC', result);
                    }
                });
            }
        } else {
            console.log("error");
            swal("Oops!", "Not enough balance or wrong buy amount!", "error");
        }
    }
});
