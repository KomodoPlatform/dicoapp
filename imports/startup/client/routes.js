import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';

// get layout template and UI views
import '../../ui/layouts/body/body.js';
import '../../ui/pages/home/home.js';
import '../../ui/pages/seed/seed.js';
import '../../ui/pages/buy/buy.js';
import '../../ui/pages/wallet/wallet.js';
import '../../ui/pages/help/help.js';
import '../../ui/pages/not-found/not-found.js';

// log in route
FlowRouter.route('/', {
  name: 'App.home',
  action() {
    BlazeLayout.render('App_body', { main: 'App_home' });
  },
});

FlowRouter.route('/seed', {
  name: 'App.seed',
  action() {
    BlazeLayout.render('App_body', { main: 'App_seed' });
  },
});

// wallet
FlowRouter.route('/wallet', {
  name: 'App.wallet',
  action() {
    BlazeLayout.render('App_body', { main: 'App_wallet' });
  },
});

// buy
FlowRouter.route('/buy', {
  name: 'App.buy',
  action() {
    BlazeLayout.render('App_body', { main: 'App_buy' });
  },
});

// help
FlowRouter.route('/help', {
  name: 'App.help',
  action() {
    BlazeLayout.render('App_body', { main: 'App_help' });
  },
});

FlowRouter.notFound = {
  action() {
    BlazeLayout.render('App_body', { main: 'App_notFound' });
  },
};
