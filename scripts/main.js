
// JSHint directive
/* global require */

// Load files using require.js to ensure everything loads at the right time
require(['model', 'view', 'presenter'], function (model, view, presenter) {
  'use strict';

  presenter.connectToModel(model);
  presenter.connectToView(view);
});
