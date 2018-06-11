import './login.html';
import '../animations/loader.html';
import { Userdata } from '/imports/api/userdata/userdata.js';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import sweetalert from 'sweetalert';

Template.login.onCreated(function () {
  Meteor.subscribe('userdata.all');
});

Template.registerHelper('loading', function() {
  return Session.get("loading");
});

Template.login.helpers({
  userdata() {
    return Userdata.find({});
  },
});

Template.login.events({
  'submit .login'(event, instance){
    var pass = event.target.passphrase.value;

    if(pass =="" || pass.length < 4){
      swal("Oops!", "The passphrase you entered is either empty or too short.", "error");
     }else{
       Session.set("loading", true);

       if (Meteor.isDesktop) {
           Desktop.fetch('marketmaker', 'startWallet', 60000, pass)
               .then(([result, error]) => {
                   if (result) {
                       swal("Success", "Welcome in the dICO Wallet!", "success");
                       FlowRouter.go('App.wallet');
                       Session.set("loading", false);
                   } else {
                       throw new Error(error);
                   }
               })
               .catch(e => {
                   swal("Something went wrong:", e.toString(), "error");
                   Session.set("loading", false);
               });
       } else {
           Meteor.call('startWallet', pass, function (error, result) {
               if (error) {
                   swal("Something went wrong:", error.error, "error");
                   Session.set("loading", false);
               }
               else {
                   swal("Success", "Welcome in the dICO Wallet!", "success");
                   FlowRouter.go('App.wallet');
                   Session.set("loading", false);
               }
           });
       }
    }

    event.target.passphrase.value = "";
    return false;
  },
  'click #exit': function () {
    Desktop.send('desktop', 'closeApp');
  },
  'click .togglepw': function (event, template) {
    var x = template.find("#passphrase").type;
    if(x === "password") template.find("#passphrase").type="text";
    else template.find("#passphrase").type="password"
    console.log("clicked");
  }
});
