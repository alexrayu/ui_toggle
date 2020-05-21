/**
 * @file
 * A Backbone view for the ui_toggle control toggle.
 */

(function ($, Drupal, drupalSettings, Backbone) {
  'use strict';

  Drupal.ui_toggle.AppElementView = Backbone.View.extend({
    template: _.template(drupalSettings.ui_toggle.conf.elementTemplate),

    events: {
      'change .ui_toggle-app-element': 'evtChanged',
    },

    initialize: function () {
      this.$el = $(this.el);
      this.$container = $('#wrap-edit-' + this.model.get('id'));
      this.$control = this.$container.find('input.ui_toggle-app-element');
      this.$form = $('form[id^="' + this.model.get('hid') + '"]');
      this.$details = this.$form.find('.ui_toggle-details');
      this.listenTo(this.model, 'change', this.mdlChanged);
      this.render();
    },

    render: function () {
      var html = this.template(this.model.toJSON());
      this.$container.detach();
      this.$el.addClass('ui_toggle-element-content').append(html);
      this.$control = this.$el.find('input.ui_toggle-app-element');
      this.delegateEvents();

      return this;
    },

    // Element to model change event.
    evtChanged: function () {
      var value = this.$control.is(':checked');
      Drupal.ui_toggle.apps[this.model.get('hid')].model.set('status', 'changed');
      this.model.set({value: value});
      if (!value) {
        this.$el.detach();
        this.$form.find('.ui_toggle').after(this.$el);
      }
      else {
        this.$el.detach();
        this.$details.find('.details-wrapper').append(this.$el);
      }
    },

    // Model to element change event.
    mdlChanged: function () {
      var value = this.model.get('value');
      this.$control.prop('checked', this.model.get('checked'));
      if (!value) {
        this.$el.detach();
        this.$form.find('.ui_toggle').after(this.$el);
      }
      else {
        this.$el.detach();
        this.$details.find('.details-wrapper').append(this.$el);
      }
    }

  });

})(jQuery, Drupal, drupalSettings, Backbone);
