/**
 * @file
 * A Backbone Model for the state of ui_toggle control toggle.
 */

(function (Drupal, drupalSettings, Backbone) {
  'use strict';

  Drupal.ui_toggle.ControlModel = Backbone.Model.extend({
    defaults: {
      checked: null,
      status: 'initial',
      value: null,
    },
    url: function() {
      if (this.get('type') === 'tag') {
        return drupalSettings.ui_toggle.conf.waypoints.tag;
      }
    },
    initialize: function() {
      if (this.get('value') === 1) {
        this.set('checked', 'checked');
      }
    },
  });

  Drupal.ui_toggle.ControlsCollection = Backbone.Collection.extend({
    model: Drupal.ui_toggle.ControlModel,
  });

})(Drupal, drupalSettings, Backbone);
