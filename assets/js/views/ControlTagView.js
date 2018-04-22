/**
 * @file
 * A Backbone view for the ui_toggle control toggle.
 */

(function ($, Drupal, drupalSettings, Backbone) {
  'use strict';

  Drupal.ui_toggle.ControlTagView = Backbone.View.extend({
    template: _.template(drupalSettings.ui_toggle.conf.controlTemplate),

    events: function () {
      var map = {};
      var eventName = 'change input.ui_toggle-toggle-tag';
      map[eventName] = 'changed';

      return map;
    },

    initialize: function () {
      this.$el = $(this.el);
      this.$container = this.$el.find('#ui_toggle-container-' + this.model.get('hid'));
      this.listenTo(this.model, 'change', this.setStatus);
      this.render();
    },

    render: function () {
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
      this.$wrapper.removeClass('error saving initial out');
      this.$wrapper.addClass(status);
      var $label = this.$wrapper.find('label');
      if (status === 'saving' || status === 'hidden') {
        $label.html(Drupal.t('Saving, please wait.'));
        this.$control.prop('disabled', true);
      }
      else {
        $label.html(this.model.get('title'));
        this.$control.prop('disabled', false);
      }
    },

    /**
     * Reacts to the value change.
     */
    changed: function () {
      var value = this.$control.is(':checked');
      var checked = value ? 'checked' : null;
      var values = {value: value, checked: checked, status: 'saving'};
      this.model.save(values, {
        type: 'POST',
        success: function (model, response) {
          if (typeof(response.success) !== 'undefined') {
            model.set('status', 'saved');
            if (model.get('type') === 'elements') {
              Drupal.ui_toggle.applyElementsLayout(model.get('hid'), 'preset');
            }
            else {
              Drupal.ui_toggle.applyTableLayout(model.get('hid'), 'preset');
            }
          }
          else {
            model.set('status', 'error');
          }
        },
        error: function (model) {
          model.set('status', 'error');
        }
      });

      // Make customize react.
      let customize_model = Drupal.ui_toggle.Controls.get('ui_toggle-toggle-customize-' + this.model.get('hid'));
      if (checked) {
        if (typeof(customize_model) !== 'undefined') {
          customize_model.trigger('ui_toggleShow');
        }
        else {
          customize_model = Drupal.ui_toggle.initCustomizationControls(this.model.get('hid'), true);
          if (typeof(customize_model) !== 'undefined') {
            customize_model.trigger('ui_toggleRender');
          }
        }
      }
      else {
        if (typeof(customize_model) !== 'undefined') {
          customize_model.trigger('ui_toggleHide');
        }
      }
    },
  });

})(jQuery, Drupal, drupalSettings, Backbone);
