

var koratDragonDen = koratDragonDen || {};
koratDragonDen.debtCalculatorSample = koratDragonDen.debtCalculatorSample || {};

koratDragonDen.debtCalculatorSample.presenter = (function presenter(){
  'use strict';

  // No operation function
  var noop = function noop() {};
  var view = {
    'firstTimeSetup' : noop,
    'registerPresenter' : noop,
    'onSystemUpdatePayoffTime' : noop
  };
  var model = {};

  return {
    'firstTimeSetup' : function firstTimeSetup(newView, newModel) {

      view = newView;
      model = newModel;

      // TODO - Fix this, obviously
      view.firstTimeSetup(this);
    },

    'onViewUpdateDebtInfo' : function onViewUpdateDebtInfo() {

    },

    'onViewDeleteDebtEntry' : function onViewDeleteDebtEntry() {

    },

    'onViewUpdatePriorityMethod' : function onViewUpdatePriorityMethod() {

    },

    'onViewUpdateAllocationMethod' : function onViewUpdateAllocationMethod() {

    },

    'onViewGracefulDisconnect' : function onViewGracefulDisconnect() {

    }

  };

}());
