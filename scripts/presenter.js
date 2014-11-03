
// JSHint directive
/* global define */

define((function presenter(undefined){
  'use strict';

  // No operation function
  var noop = function noop() {};

  var dummyModel = {
    'subscribeToDataUpdates' : noop,
    'unsubscribeFromDataUpdates' : noop,
    'getAllDebtIds' : noop,
    'getDebtInfo' : noop,
    'setDebtInfo' : noop,
    'deleteDebt' : noop,
    'getAllocationMethod' : noop,
    'setAllocationMethod' : noop,
    'getPrioritizationMethod' : noop,
    'setPrioritizationMethod' : noop,
    'getMonthlyPayments' : noop,
    'setMonthlyPayments' : noop,
    'getCustomDebtOrder' : noop,
    'setCustomDebtOrder' : noop,
    'getTotalAmountOwed' : noop,
    'getTotalMinimumMonthlyPayment' : noop,
    'getPayoffTime' : noop
  };

  var modelPublishTypes = {
    'ADD_DEBT' : 'ADD_DEBT',
    'UPDATE_DEBT' : 'UPDATE_DEBT',
    'DELETE_DEBT' : 'DELETE_DEBT',
    'ALLOCATION_METHOD' : 'ALLOCATION_METHOD',
    'PRIORITIZATION_METHOD' : 'PRIORITIZATION_METHOD',
    'MONTHLY_PAYMENTS' : 'MONTHLY_PAYMENTS',
    'TOTAL_AMOUNT_OWED' : 'TOTAL_AMOUNT_OWED',
    'TOTAL_MINIMUM_MONTHLY_PAYMENT' : 'TOTAL_MINIMUM_MONTHLY_PAYMENT',
    'PAYOFF_TIME' : 'PAYOFF_TIME'
  };

  var model = dummyModel;

  var dummyView = {
    'subscribeToDataUpdates' : noop,
    'unsubscribeFromDataUpdates' : noop,
    'addDebt' : noop,
    'updateDebt' : noop,
    'deleteDebt' : noop,
    'getAllDebts' : noop,
    'setAllocationMethod' : noop,
    'setPriotitizationMethod' : noop,
    'setMonthlyPayments' : noop,
    'setTotalAmountOwed' : noop,
    'setTotalMinimumMonthlyPayment' : noop,
    'setPayoffTime' : noop
  };

  var viewPublishTypes = {
    'REQUEST_UPDATE_DEBT' : 'REQUEST_UPDATE_DEBT',
    'REQUEST_DELETE_DEBT' : 'REQUEST_DELETE_DEBT',
    'REQUEST_MONTHLY_PAYMENT' : 'REQUEST_MONTHLY_PAYMENT',
    'REQUEST_PRIORITY_METHOD' : 'REQUEST_PRIORITY_METHOD',
    'REQUEST_ALLOCATION_METHOD' : 'REQUEST_ALLOCATION_METHOD'
  };

  var view = dummyView;

  var subscribeToModel = function subscribeToModel() {
    if (model.subscribeToDataUpdates) {
      model.subscribeToDataUpdates(modelUpdateCallback);
    }
  };

  var unsubscribeFromModel = function unsubscribeFromModel() {
    if (model.unsubscribeFromDataUpdates) {
      model.unsubscribeFromDataUpdates(modelUpdateCallback);
    }
  };

  var modelUpdateCallback = function modelUpdateCallback(jsonData) {

    var publishInfo = JSON.parse(jsonData);
    var type = publishInfo.type;
    var data = publishInfo.data;

    var uid, amount, property, method;

    switch(type) {

      case modelPublishTypes.ADD_DEBT:
        view.addDebt(data.uid);
        break;

      case modelPublishTypes.UPDATE_DEBT:

        uid = data.uid;
        amount = Number(data.amount);

        switch (data.property) {
          case 'apr':
            property = 'apr';
            break;

          case 'amountOwed':
            property = 'owed';
            break;

          case 'minimumMonthlyPayment':
            property = 'monthly';
            break;

          default:
            throw new Error('modelUpdateCallback(): ' +
                'Unexpected data.property: ' + data.property);
        }

        view.updateDebt(uid, property, amount);
        break;

      case modelPublishTypes.DELETE_DEBT:
        view.deleteDebt(data.uid);
        break;

      case modelPublishTypes.ALLOCATION_METHOD:

        switch (data.method) {
          case 'EVEN_SPLIT':
            method = 'even';
            break;

          case 'PRIORITY_FIRST':
            method = 'priority';
            break;

          case 'PROPORTIONAL_SPLIT':
            method = 'proportional';
            break;

          default:
            throw new Error('modelUpdateCallback(): ' +
                'Unexpected data.method: ' + data.method);
        }

        view.setAllocationMethod(method);
        break;

      case modelPublishTypes.PRIORITIZATION_METHOD:

        switch (data.method) {
          case 'HIGHEST_APR':
            method = 'apr';
            break;

          case 'LOWEST_OWED':
            method = 'owed';
            break;

          case 'CUSTOM':
            method = 'custom';
            break;

          default:
            throw new Error('modelUpdateCallback(): ' +
                'Unexpected data.method: ' + data.method);
        }

        view.setPriotitizationMethod(method);
        break;

      case modelPublishTypes.MONTHLY_PAYMENTS:
        view.setMonthlyPayments(Number(data.payments));
        break;

      case modelPublishTypes.TOTAL_AMOUNT_OWED:
        view.setTotalAmountOwed(Number(data.total));
        break;

      case modelPublishTypes.TOTAL_MINIMUM_MONTHLY_PAYMENT:
        view.setTotalMinimumMonthlyPayment(Number(data.total));
        break;

      case modelPublishTypes.PAYOFF_TIME:
        view.setPayoffTime(Number(data.months));
        break;

      default:
        throw new Error('modelUpdateCallback(): ' +
            'Invalid publishInfo.type: ' + publishInfo.type);
    }
  };

  var synchronizeView = function synchronizeView() {

    if (view === dummyView) {
      // No need to do anything if we're using our featureless dummy view
      return;
    }

    var allDebts, i, method;

    // Return view to clean state

    // Get all current debts from the view
    allDebts = view.getAllDebts();

    // Tell the view to delete all of them
    for (i = 0; i < allDebts.length; i++) {
      view.deleteDebt(allDebts[i]);
    }

    // Reset the view's default allocation and prioritization methods
    view.setAllocationMethod('priority');
    view.setPriotitizationMethod('apr');

    // Reset the totals for amount owed, minimum payment, and monthly payment
    view.setTotalAmountOwed(0.0);
    view.setTotalMinimumMonthlyPayment(0.0);
    view.setMonthlyPayments(0.0);

    // Reset the time it would take to payoff all debts
    view.setPayoffTime(0);

    // Nothing left to do if we're using a placeholder model
    if (model === dummyModel) {
      return;
    }

    // Get all debts from the model
    allDebts = model.getAllDebtIds();

    for (i = 0; i < allDebts.length; i++) {

      var uid = allDebts[i];

      // Tell the view to make room for the debt
      view.addDebt(uid);

      // Query the model for its properties, and pass along to the view
      var apr = model.getDebtInfo(uid, 'apr');
      var owed = model.getDebtInfo(uid, 'amountOwed');
      var monthly = model.getDebtInfo(uid, 'minimumMonthlyPayment');

      if (apr !== undefined && apr !== null){
        view.updateDebt(uid, 'apr', apr);
      }
      if (owed !== undefined && owed !== null){
        view.updateDebt(uid, 'owed', owed);
      }
      if (monthly !== undefined && monthly !== null){
        view.updateDebt(uid, 'monthly', monthly);
      }
    }

    // Translate and pass along the allocation method from the model
    switch(model.getAllocationMethod()) {
      case 'EVEN_SPLIT':
        method = 'even';
        break;

      case 'PRIORITY_FIRST':
        method = 'priority';
        break;

      case 'PROPORTIONAL_SPLIT':
        method = 'proportional';
        break;
    }

    view.setAllocationMethod(method);

    // Translate and pass along the prioritization method from the model
    switch (model.getPrioritizationMethod()) {
      case 'HIGHEST_APR':
        method = 'apr';
        break;

      case 'LOWEST_OWED':
        method = 'owed';
        break;

      case 'CUSTOM':
        method = 'custom';
        break;
    }

    view.setPriotitizationMethod(method);

    // Pass along the amount owed, monthly minimum, and payments from the model
    view.setTotalAmountOwed(model.getMonthlyPayments());
    view.setTotalMinimumMonthlyPayment(model.getTotalAmountOwed());
    view.setMonthlyPayments(model.getTotalMinimumMonthlyPayment());

    // Pass along the payoff time from the model
    view.setPayoffTime(model.getPayoffTime());
  };

  var subscribeToView = function subscribeToView() {
    if (view.subscribeToDataUpdates) {
      view.subscribeToDataUpdates(viewUpdateCallback);
    }
  };

  var unsubscribeFromView = function unsubscribeFromView() {
    if (view.unsubscribeFromDataUpdates) {
      view.unsubscribeFromDataUpdates(viewUpdateCallback);
    }
  };

  var viewUpdateCallback = function viewUpdateCallback(jsonData) {

    var publishInfo = JSON.parse(jsonData);
    var type = publishInfo.type;
    var data = publishInfo.data;

    var property, method;

    switch(type) {
      case viewPublishTypes.REQUEST_UPDATE_DEBT:

        var uid = data.uid;
        var amount = Number(data.amount);

        switch(data.property) {
          case 'apr':
            property = 'apr';
            break;

          case 'amountOwed':
            property = 'amountOwed';
            break;

          case 'minimumMonthly':
            property = 'minimumMonthlyPayment';
            break;

          default:
        }

        model.setDebtInfo(uid, property, amount);
        break;

      case viewPublishTypes.REQUEST_DELETE_DEBT:
        model.deleteDebt(data.uid);
        break;

      case viewPublishTypes.REQUEST_MONTHLY_PAYMENT:
        model.setMonthlyPayments(Number(data.amount));
        break;

      case viewPublishTypes.REQUEST_PRIORITY_METHOD:

        switch (data.method) {
          case 'apr':
            method = 'HIGHEST_APR';
            break;

          case 'owed':
            method = 'LOWEST_OWED';
            break;

          case 'custom':
            method = 'CUSTOM';
            break;

          default:
            throw new Error('viewUpdateCallback(): ' +
                'Unexpected data.method: ' + data.method);
        }

        model.setPrioritizationMethod(method);
        break;

      case viewPublishTypes.REQUEST_ALLOCATION_METHOD:

        switch (data.method) {
          case 'even':
            method = 'EVEN_SPLIT';
            break;

          case 'priority':
            method = 'PRIORITY_FIRST';
            break;

          case 'proportional':
            method = 'PROPORTIONAL_SPLIT';
            break;

          default:
            throw new Error('viewUpdateCallback(): ' +
                'Unexpected data.method: ' + data.method);
        }

        model.setAllocationMethod(method);
        break;

      default:
        throw new Error('modelUpdateCallback(): ' +
            'Invalid publishInfo.type: ' + publishInfo.type);
    }
  };

  return {
    'connectToModel' : function connectToModel(newModel) {
      // Gracefully unsubscribe from the old model, if any
      unsubscribeFromModel();

      // Establish connection with our new model
      model = newModel;
      subscribeToModel();

      // Sync our current view with the new model
      synchronizeView();
    },

    'getModel' : function getModel() {
      if (model === dummyModel) {
        return undefined;
      } else{
        return model;
      }
    },

    'disconnectFromModel' : function disconnectFromModel() {
      // Gracefully unsubscribe from the old model, if any
      unsubscribeFromModel();

      // Replace the model with our no-features dummy
      model = dummyModel;
    },

    'connectToView' : function connectToView(newView) {
      // Gracefully unsubscribe from the old view, if any
      unsubscribeFromView();

      // Establish connection with our new view
      view = newView;
      subscribeToView();

      // Sync our new view with the current model
      synchronizeView();
    },

    'getView' : function getView() {
      if (view === dummyView) {
        return undefined;
      } else{
        return view;
      }
    },

    'disconnectFromView' : function disconnectFromView() {
      // Gracefully unsubscribe from the old view, if any
      unsubscribeFromView();

      // Replace the view with our no-features dummy
      view = dummyView;
    }
  };

}()));
