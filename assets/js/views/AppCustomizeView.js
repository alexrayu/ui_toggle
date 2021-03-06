/**
 * @file
 * A Backbone view for the save/reset subform controls.
 */

(function ($, Drupal, drupalSettings, Backbone) {
  'use strict';

  Drupal.ui_toggle.AppCustomizeView = Backbone.View.extend({
    template: _.template(drupalSettings.ui_toggle.conf.panelTemplate),

    events: {
      'click a.save': 'save',
      'click a.adm-save': 'admSave',
      'click a.reset': 'hreset',
      'click a.ui_toggle-app-control' : 'clickControl',
    },

    initialize: function () {
      this.el = '#ui_toggle-app-panel-' + this.model.get('hid');
      this.$el = $(this.el);
      this.$container = $('#ui_toggle-content-' + this.model.get('hid'));
      this.$form = $('form[id^="' + this.model.get('hid') + '"]');
      this.$details = this.$form.find('.ui_toggle-details');
      this.customizeModel = Drupal.ui_toggle.Controls.get('ui_toggle-toggle-customize-' + this.model.get('hid'));
      this.listenTo(this.model, 'change', this.setStatus);
      this.render();
    },

    render: function () {
      var html = this.template(this.model.toJSON());
      this.$el.detach();
      this.$container.append(html);
      this.$el = $(this.el);
      this.delegateEvents();

      return this;
    },

    setStatus: function () {
      this.$el.removeClass('on off saved initial changed error').addClass(this.model.get('status'));
      switch (this.model.get('status')) {
        case 'on':
          this.show();
          this.setMessage(Drupal.t('Please configure now.'));

          // Set changed status if has changes but no changed status.
          if (this.model.get('changed') === true) {
            this.model.set('status', 'changed');
            this.setStatus();
          }
          break;

        case 'off':
          this.hide();
          break;

        case 'saving':
          this.setMessage(Drupal.t('Saving ...'));
          break;

        case 'changed':
          this.model.set('changed', true);
          this.setMessage(Drupal.t('You have unsaved settings.'));
          break;

        case 'saved':
          this.model.set('changed', false);
          this.setMessage(Drupal.t('Saved successfully.'));
          var view = this;
          setTimeout(function () {
            view.hide();
            view.customizeModel.trigger('ui_toggleOut');
          }, 500);
          break;

        case 'resetting':
          this.setMessage(Drupal.t('Reverting to defaults ...'));
          break;

        case 'error':
          this.setMessage(Drupal.t('<p>Could not save :(</p><p>Please try again in a minute. If the error persists, please contact the admins.</p>'));
          break;
      }
    },

    save: function () {
      this.model.set('status', 'saving');
      this.model.set('command', 'saveUser');
      this.saveState();
    },

    admSave: function () {
      this.model.set('status', 'saving');
      this.model.set('command', 'savePreset');
      this.saveState();
    },

    hreset: function () {
      this.model.set('status', 'reset');
      if (this.model.get('type') === 'elements') {
        Drupal.ui_toggle.applyElementsLayout(this.model.get('hid'), 'preset');
      }
      else {
        Drupal.ui_toggle.applyTableLayout(this.model.get('hid'), 'preset');
      }
      this.model.set('status', 'changed');
      this.model.set('changed', true);
    },

    clickControl: function (e) {
      e.preventDefault();
    },

    setMessage: function (message) {
      this.$el.find('.response').html(message);
    },

    saveState: function () {
      var button = $('a.save', this.el);
      var values = {
        hid: this.model.get('hid'),
        elements: this.model.get('elements'),
        command: this.model.get('command'),
      };
      button.addClass('saving');
      this.model.save(values, {
        type: 'POST',
        success: function (model, response) {
          model.set('command', null);
          button.removeClass('saving');
          if (typeof(response.success) !== 'undefined') {
            model.set('status', 'saved');
          }
          else {
            model.set('status', 'error');
          }
        },
        error: function (model) {
          model.set('command', null);
          model.set('status', 'error');
          button.removeClass('saving');
        }
      });
    },

    hide: function () {
      this.$el.slideUp(150);
      if (this.$form.hasClass('views-exposed-form')) {
        this.$form.find('.js-form-item').removeClass('ui_toggle-element-container');
        this.$details.removeClass('highlighted').prop('open', null);
        if (this.$details.find('.details-wrapper').html().length < 10) {
          this.$details.find('.details-wrapper').html(null);
          this.$details.removeClass('visible');
        }
      }
      else {
        this.$form.find('.ui_toggle-element-container').removeClass('ui_toggle-element-container');
        this.$form.find('.ui_toggle-force-visible').removeClass('ui_toggle-force-visible');
      }
    },

    show: function () {
      this.$el.slideDown(150);
      if (this.$form.hasClass('views-exposed-form')) {
        this.$form.find('.js-form-item').addClass('ui_toggle-element-container');
      }
      else {
        this.$form.find('.views-field').addClass('ui_toggle-element-container ui_toggle-force-visible');
      }
      this.$details.addClass('visible highlighted').prop('open', 'open');
    },

  });

})(jQuery, Drupal, drupalSettings, Backbone);
