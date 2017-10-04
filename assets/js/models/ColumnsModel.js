/**
 * @file
 * A Backbone Model for the state of ui_toggle columns toggle.
 */

(function (Drupal, drupalSettings, Backbone) {
  'use strict';

  Drupal.ui_toggle.CustomizeColumnsModel = Backbone.Model.extend({
    defaults: {
      checked: null,
      status: 'initial',
      value: null,
    },

    initialize: function() {
      if (this.get('value') == true) {
        this.set('checked', 'checked');
      }
    },
  });

  Drupal.ui_toggle.CustomizeColumnsCollection = Backbone.Collection.extend({
    model: Drupal.ui_toggle.CustomizeColumnsModel,
  });

})(Drupal, drupalSettings, Backbone);
