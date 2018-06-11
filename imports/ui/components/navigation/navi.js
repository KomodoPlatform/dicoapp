import './navi.html';


Template.navigation.helpers({
  activewallet() {
    return FlowRouter.getRouteName() === "App.wallet" ? "active" : "";
  },
  activebuy() {
    return FlowRouter.getRouteName() === "App.buy" ? "active" : "";
  },
  activehelp() {
    return FlowRouter.getRouteName() === "App.help" ? "active" : "";
  }
});

Template.navigation.events({
  "click .stop": function (){
    //console.log(FlowRouter.getRouteName());
    Session.set("loading",true);
    if (Meteor.isDesktop) {
        Desktop.fetch('marketmaker', 'stopWallet', 60000)
            .then(([result, error]) => {
                if (result) {
                    swal("Thank you for using dICOApp", "Back to loginpage", "success");
                    FlowRouter.go('App.home');
                    Session.set("loading", false);
                } else {
                    throw new Error(error);
                }

            })
            .catch(e => {
                swal("Oops!", e.toString(), "error");
                Session.set("loading", false);
            });
    } else {
        Meteor.call('stopwallet', function (error, result) {
            if (error) {
                swal("Oops!", error, "error");
                Session.set("loading", false);
            }
            else {
                swal("Thank you for using dICOApp", "Back to loginpage", "success");
                FlowRouter.go('App.home');
                Session.set("loading", false);
            }
        });
    }
}
});
