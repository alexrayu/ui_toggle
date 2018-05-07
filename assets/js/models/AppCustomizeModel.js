/**
 * @file
 * A Backbone Model for the state of ui_toggle control toggle.
 */

(function (Drupal, drupalSettings, Backbone) {
  'use strict';

  Drupal.ui_toggle.AppCustomizeModel = Backbone.Model.extend({
    defaults: {
      status: 'initial',
      command: null,
      save_title: Drupal.t('Save'),
      adm_save_title: Drupal.t('Save as defaults.'),
      type: 'elements',
      hidden: null,
      reset_title: Drupal.t('Reset'),
      changed: false,
      elements: {},
    },
    url: function() {
      return drupalSettings.ui_toggle.conf.waypoints.customize;
    },
  });

})(Drupal, drupalSettings, Backbone);
