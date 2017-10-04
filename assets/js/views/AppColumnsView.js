/**
 * @file
 * A Backbone view for the ui_toggle control toggle.
 */

(function ($, Drupal, drupalSettings, Backbone) {
  'use strict';

  Drupal.ui_toggle.AppColumnsView = Backbone.View.extend({
    template: _.template(drupalSettings.ui_toggle.conf.elementTemplate),

    events: {
      'change .ui_toggle-app-element': 'evtChanged',
    },

    initialize: function() {
      this.$el = $(this.el);
      this.$el.addClass('ui_toggle-element-container');
      this.$form = $('form[id^="' + this.model.get('hid') + '"]');
      this.$container = this.$form.find('.views-table #wrap-edit-' + this.model.get('id'));
      this.$control = this.$container.find('input.ui_toggle-app-element');
      this.listenTo(this.model, 'change', this.mdlChanged);
      this.render();
      this.mdlChanged();
    },

    render: function() {
      var html = this.template(this.model.toJSON());
      this.$container.detach();
      this.$el.append(html);
      this.$container = this.$form.find('.views-table #wrap-edit-' + this.model.get('id'));
      this.$control = this.$container.find('input.ui_toggle-app-element');
      this.delegateEvents();

      return this;
    },

    // Element to model change event.
    evtChanged: function() {
      var value = this.$control.is(':checked');
      var checked = value ? 'checked' : null;
      Drupal.ui_toggle.apps[this.model.get('hid')].model.set('status', 'changed');
      this.model.set({value: value, checked: checked});
      if (value) {
        this.$form.find('.' + this.model.get('id')).addClass('ui_toggle-hidden');
      }
      else {
        this.$form.find('.' + this.model.get('id')).removeClass('ui_toggle-hidden');
      }
    },

    // Model to element change event.
    mdlChanged: function() {
      var value = this.model.get('value');
      this.$control.prop('checked', this.model.get('checked'));
      if (value) {
        this.$form.find('.' + this.model.get('id')).addClass('ui_toggle-hidden');
      }
      else {
        this.$form.find('.' + this.model.get('id')).removeClass('ui_toggle-hidden');
      }
    }

  });

})(jQuery, Drupal, drupalSettings, Backbone);
