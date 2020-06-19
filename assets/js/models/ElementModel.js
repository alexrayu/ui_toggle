/**
 * @file
 * A Backbone Model for the state of ui_toggle element toggle.
 */

(function (Drupal, drupalSettings, Backbone) {
  'use strict';

  Drupal.ui_toggle.CustomizeElementsModel = Backbone.Model.extend({
    defaults: {
      checked: null,
      status: 'initial',
      value: null,
    },

    initialize: function () {
      if (this.get('value') === true) {
        this.set('checked', 'checked');
      }
    },
  });

  Drupal.ui_toggle.CustomizeElementsCollection = Backbone.Collection.extend({
    model: Drupal.ui_toggle.CustomizeElementsModel,
  });

})(Drupal, drupalSettings, Backbone);
