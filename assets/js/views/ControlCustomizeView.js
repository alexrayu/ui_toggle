/**
 * @file
 * A Backbone view for the ui_toggle control toggle.
 */

(function ($, Drupal, drupalSettings, Backbone) {
  'use strict';

  Drupal.ui_toggle.ControlCustomizeView = Backbone.View.extend({
    template: _.template(drupalSettings.ui_toggle.conf.controlTemplate),

    events: function() {
      var map = {};
      var eventName = 'change input.ui_toggle-toggle-customize';
      map[eventName] = 'changed';

      return map;
    },

    initialize: function() {
      this.$el = $(this.el);
      this.$container = this.$el.find('#ui_toggle-container-' + this.model.get('hid'));
      this.listenTo(this.model, 'change', this.setStatus);
      this.model.on('ui_toggleHide', this.hide, this);
      this.model.on('ui_toggleShow', this.show, this);
      this.model.on('ui_toggleRender', this.render, this);
      this.render();
    },

    render: function() {
      var html = this.template(this.model.toJSON());
      this.$container.find('#wrap-' + this.model.get('id')).detach();
      this.$container.append(html);
      this.delegateEvents();
      this.$wrapper = this.$container.find('#wrap-' + this.model.get('id'));
      this.$control = this.$wrapper.find('#' + this.model.get('id'));

      return this;
    },

    /**
     * Provides visual indication of the current process.
     */
    setStatus: function () {
      var status = this.model.get('status');
      this.$wrapper.removeClass('out');
      this.$wrapper.addClass(status);
    },

    /**
     * Reacts to the value change.
     */
    changed: function(e) {
      var value = this.$control.is(':checked');
      var checked = value ? 'checked' : null;

      Drupal.ui_toggle.apps = Drupal.ui_toggle.apps || {};
      if (value) {
        Drupal.ui_toggle.initCustomizeApp(this.model.get('hid'), true);
        Drupal.ui_toggle.apps[this.model.get('hid')].model.set('status', 'on');
      }
      else {
        Drupal.ui_toggle.apps[this.model.get('hid')].model.set('status', 'off');
      }
    },

    hide: function() {
      this.model.set('status', 'out');
      if (typeof(Drupal.ui_toggle.apps) != 'undefined' && typeof(Drupal.ui_toggle.apps[this.model.get('hid')]) != 'undefined') {
        Drupal.ui_toggle.apps[this.model.get('hid')].model.set('status', 'off');
      }
    },

    show: function() {
      this.$control.prop('checked', false);
      this.model.set('status', 'initial');
    },

  });

})(jQuery, Drupal, drupalSettings, Backbone);
