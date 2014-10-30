
// JSHint directives
/* exported firstTimeSetup, onSystemUpdatePayoffTime, registerPresenter */

var koratDragonDen = {};
koratDragonDen.debtCalculatorSample = {};
koratDragonDen.debtCalculatorSample.view = (function view(){
  'use strict';

  var startingDebtLines = 3;

  // No operation function
  var noop = function noop() {};
  var presenter = {
    'onViewUpdateDebtInfo' : noop,
    'onViewDeleteDebtEntry' : noop,
    'onViewUpdatePriorityMethod' : noop,
    'onViewUpdateAllocationMethod' : noop,
    'onViewGracefulDisconnect' : noop
  };

  var onUserUpdateDebtInfo = function onUserUpdateDebtInfo(event) {

    var changedElement = event.target;

    var uid = changedElement.dataset.uid;
    var property = changedElement.dataset.property;
    var amount = changedElement.value;

    presenter.onViewUpdateDebtInfo(uid, property, amount);

    // TODO - If needed, check to see if the debt entry is empty?
  };

  var onUserDeleteDebtEntry = function onUserDeleteDebtEntry(event) {

    var changedElement = event.target;

    var uid = changedElement.dataset.uid;

    presenter.onViewDeleteDebtEntry(uid);

    // TODO - Handle deleting the line here
  };

  var onUserDragDebtEntry = function onUserDragDebtEntry() {
    // TODO - Decide if this should be a feature or not

  };

  var onUserUpdateMonthlyPayment = function onUserUpdateMonthlyPayment() {
    // Get new amount
  };

  var onUserUpdatePriorityMethod = function onUserUpdatePriorityMethod(event) {

    var changedElement = event.target;

    var method = changedElement.selectedIndex;

    presenter.onViewUpdatePriorityMethod(method);
  };

  var onUserUpdateAllocationMethod = function onUserUpdateAllocationMethod(event) {

    var changedElement = event.target;

    var method = changedElement.selectedIndex;

    presenter.onViewUpdateAllocationMethod(method);
  };

  var newDebtInput = function newDebtInput() {

    var uniqueDebtId = generateUid();

    var tr = document.createElement('tr');

    var tdDelete = document.createElement('td');
    var buttonDelete = document.createElement('button');
    buttonDelete.innerHTML = 'Delete';
    buttonDelete.addEventListener('click', onUserDeleteDebtEntry);
    tdDelete.appendChild(buttonDelete);

    var tdAPR = document.createElement('td');
    var inputAPR = document.createElement('input');
    // inputAPR.id = 'UID_'+uniqueDebtId+'_APR';
    inputAPR.type = 'number';
    inputAPR.placeholder = 'APR';
    inputAPR.min = '0';
    inputAPR.dataset.uid = uniqueDebtId;
    inputAPR.dataset.property = 'apr';
    inputAPR.addEventListener('input', onUserUpdateDebtInfo);
    tdAPR.appendChild(inputAPR);

    var tdAmountOwed = document.createElement('td');
    var inputAmountOwed = document.createElement('input');
    // inputAmountOwed.id = 'UID_'+uniqueDebtId+'_AmountOwed';
    inputAmountOwed.type = 'number';
    inputAmountOwed.placeholder = 'Amount Owed';
    inputAmountOwed.min = '0';
    inputAmountOwed.dataset.uid = uniqueDebtId;
    inputAmountOwed.dataset.property = 'amountOwed';
    inputAmountOwed.addEventListener('input', onUserUpdateDebtInfo);
    tdAmountOwed.appendChild(inputAmountOwed);

    var tdMinimumMonthly = document.createElement('td');
    var inputMinimumMonthly = document.createElement('input');
    // inputMinimumMonthly.id = 'UID_'+uniqueDebtId+'_MinimumMonthly';
    inputMinimumMonthly.type = 'number';
    inputMinimumMonthly.placeholder = 'Minimum Monthly Payment';
    inputMinimumMonthly.min = '0';
    inputMinimumMonthly.dataset.uid = uniqueDebtId;
    inputMinimumMonthly.dataset.property = 'minimumMonthly';
    inputMinimumMonthly.addEventListener('input', onUserUpdateDebtInfo);
    tdMinimumMonthly.appendChild(inputMinimumMonthly);

    tr.appendChild(tdDelete);
    tr.appendChild(tdAPR);
    tr.appendChild(tdAmountOwed);
    tr.appendChild(tdMinimumMonthly);

    document.getElementById('debtTable').appendChild(tr);
  };

  var generateUid = function generateUid() {

    return Math.random().toString(36).substr(2,9);
  };

  return {
    'firstTimeSetup' : function firstTimeSetup(newPresenter) {

      this.registerPresenter(newPresenter);

      // TODO - Add some sort of "Sorry, you need JavaScript enabled" to remove

      document.getElementById('debtAllocationSelect').addEventListener('change', onUserUpdateAllocationMethod);
      document.getElementById('debtPrioritizationSelect').addEventListener('change', onUserUpdatePriorityMethod);

      // TODO - Add hook for range input

      for (var i = 0; i < startingDebtLines; i++)
        newDebtInput();
    },

    // TODO - Is this how we want to handle this?
    'registerPresenter' : function registerPresenter(newPresenter) {

      presenter.onViewGracefulDisconnect();
      presenter = newPresenter;
    },

    'onSystemUpdatePayoffTime' : function onSystemUpdatePayoffTime() {

    }
  };
}());








