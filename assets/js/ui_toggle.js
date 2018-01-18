/**
 * @file
 * Contains the definition of the behaviour ui_toggle.
 */

(function ($, Drupal, drupalSettings, _, Backbone) {
  'use strict';

  /**
   * Initialize the form controls.
   *
   * @param context
   *   Drupal context.
   */
  function initui_toggleControls(context) {
    const ui_toggle = Drupal.ui_toggle;
    ui_toggle.Controls = new ui_toggle.ControlsCollection;
    $.each(drupalSettings.ui_toggle.controls, function(index, value) {
      const $form = $('#ui_toggle-container-' + value.tag.hid).parents('form');
      if ($(context).find($form).length) {
        if (typeof(value.tag.show) !== 'undefined' && value.tag.show === true) {
          const item = new ui_toggle.ControlModel(value.tag);
          ui_toggle.Controls.add(item);
          const viewData = {
            model: item,
            el: '#' + $form.attr('id'),
          };
          new ui_toggle.ControlTagView(viewData);
        }
        initCustomizationControls(value.tag.hid);
      }
    });
  }

  /**
   * Initialize the form customization controls.
   *
   * @param hid
   *  Form hid.
   * @param force
   *  Force UI.
   */
  function initCustomizationControls(hid, force) {
    const ui_toggle = Drupal.ui_toggle;
    if (typeof(force) === 'undefined') {
      force = false;
    }
    if (!force) {
      $.ajax({
        method: 'GET',
        url: drupalSettings.ui_toggle.conf.waypoints.customize,
        data: {
          command: 'checkIsCustomizable',
          hid: hid,
        },
      }).done(function(data) {
        if (data.result === 1) {
          const $form = $('#ui_toggle-container-' + hid).parents('form');
          const item = new ui_toggle.ControlModel({
            type: 'customize',
            hid: hid,
            id: 'ui_toggle-toggle-customize-' + hid,
            title: Drupal.t('Customize'),
          });
          ui_toggle.Controls.add(item);
          new ui_toggle.ControlCustomizeView({model: item, el: '#' + $form.attr('id')});
          return item;
        }
      });
    }
    else {
      const $form = $('#ui_toggle-container-' + hid).parents('form');
      const item = new ui_toggle.ControlModel({
        type: 'customize',
        hid: hid,
        id: 'ui_toggle-toggle-customize-' + hid,
        title: Drupal.t('Customize'),
      });
      ui_toggle.Controls.add(item);
      new ui_toggle.ControlCustomizeView({model: item, el: '#' + $form.attr('id')});
      return item;
    }
  }

  Drupal.behaviors.ui_toggleControls = {
    attach: function (context) {

      // Init controls.
      initui_toggleControls(context);

      // Init layout.
      if(typeof(drupalSettings.ui_toggle.layout) !== 'undefined' &&
        typeof(drupalSettings.ui_toggle.layout.hids !== 'undefined')) {
        for (let hid in drupalSettings.ui_toggle.layout.hids) {
          const $form = $('#ui_toggle-container-' + hid).parents('form');
          if ($(context).find($form).length) {
            if (drupalSettings.ui_toggle[hid].type === 'elements') {
              Drupal.ui_toggle.applyElementsLayout(hid, 'user');
            }
            else {
              Drupal.ui_toggle.applyTableLayout(hid, 'user');
            }
          }
        }
      }
    }
  };

  // Main ui_toggle app and data/functionality collection.
  Drupal.ui_toggle = {
    initCustomizationControls: initCustomizationControls,

    // Initialize a customization app by hid.
    initCustomizeApp: function(hid, force) {
      this.apps = this.apps || {};
      if (typeof(force) === 'undefined') {
        force = false;
      }

      // Elements app or table app.
      if (typeof(drupalSettings.ui_toggle[hid]) !== 'undefined' &&
      drupalSettings.ui_toggle[hid].type === 'elements') {
        Drupal.ui_toggle.initElementsApp(hid, force);
      }
      else {
        Drupal.ui_toggle.initTableApp(hid, force);
      }
    }
  };

  /**
   * Get columns ids for a given form table.
   * @param hid
   */
  Drupal.ui_toggle.getColumns = function(hid) {
    const $ths = $('form[id^="' + hid + '"] .views-table thead th');
    const items = [];
    $ths.each(function(index, value) {
      let thClass = $(value).attr('class').match(/views-field-([^\s]+)/)[0];
      if (thClass !== 'views-field-node-bulk-form') {
        items.push(thClass);
      }
    });

    return items;
  };

  /**
   * Initialize specifically the elements app.
   * @param hid
   * @param force
   */
  Drupal.ui_toggle.initElementsApp = function(hid, force) {
    const ui_toggle = Drupal.ui_toggle;
    ui_toggle.apps[hid] = {};
    ui_toggle.apps[hid].elements = {};
    ui_toggle.apps[hid].elements.views = [];
    const hidden = typeof(drupalSettings.ui_toggle.conf.is_admin) !== 'undefined' &&
    drupalSettings.ui_toggle.conf.is_admin === true ? null : 'hidden';
    ui_toggle.apps[hid].model = new ui_toggle.AppCustomizeModel({hid: hid, hidden: hidden, type: 'elements'});
    ui_toggle.apps[hid].view = new ui_toggle.AppCustomizeView({model: ui_toggle.apps[hid].model});
    const collection = new ui_toggle.CustomizeElementsCollection();
    const layout = Drupal.ui_toggle.getLayout(hid, 'user', force);
    drupalSettings.ui_toggle[hid].elements.forEach(function(id) {
      const value = (typeof(layout[id]) !== 'undefined') ? true : null;
      const checked = value ? 'checked' : null;
      const itemData = {
        id: id,
        hid: hid,
        value: value,
        checked: checked,
      };
      const model = new Drupal.ui_toggle.CustomizeElementsModel(itemData);
      const el = $('[id^="edit-' + id + '"]').parents('.form-item-' + id);
      collection.add(model);
      Drupal.ui_toggle.apps[hid].elements.views.push(new Drupal.ui_toggle.AppElementView({model: model, el: el,}));
    });
    ui_toggle.apps[hid].model.set('elements', collection);
  };

  /**
   * Applies an elements layout.
   * @param hid
   *  Form hid.
   * @param type
   *  Layout type. User or preset. Defaults to preset.
   * @param force
   *  Whether layout can be forced (if a new layout called in ui).
   */
  Drupal.ui_toggle.applyElementsLayout = function(hid, type, force) {
    if (typeof(force) === 'undefined') {
      force = false;
    }
    const layout = Drupal.ui_toggle.getLayout(hid, type, force);
    if (layout.length === 0) {
      return;
    }

    // Apply layout.
    const ui_toggle = Drupal.ui_toggle;
    const actives = drupalSettings.ui_toggle[hid].active_elements;
    const $form = $('form[id^="' + hid + '"]');
    const $details = $form.find('.ui_toggle-details');
    const exists = typeof(ui_toggle.apps) !== 'undefined' && typeof(ui_toggle.apps[hid]) !== 'undefined';
    let count = 0;
    let should_open = false;

    if (exists) {
      let collection = ui_toggle.apps[hid].model.get('elements');
    }

    for (let id in layout) {
      if (typeof(actives[id]) !== 'undefined') {
        should_open = true;
      }
      let $el = $form.find('[id^="edit-' + id + '"]').parents('.form-item').detach();
      count++;
      $details.find('.details-wrapper').append($el);
      if (exists) {
        let model = collection.get(id);
        model.set('value', true);
        model.set('checked', 'checked');
      }
    }
    if (count > 0) {
      $details.addClass('visible');
    }
    if (should_open) {
      $details.prop('open', 'open');
    }
  };

  /**
   * Initialize specifically the table app.
   *
   * @param hid
   *   Handle id.
   * @param force
   *   Force UI.
   */
  Drupal.ui_toggle.initTableApp = function(hid, force) {
    const ui_toggle = Drupal.ui_toggle;
    ui_toggle.apps[hid] = {};

    const hidden = typeof(drupalSettings.ui_toggle.conf.is_admin) !== 'undefined' &&
    drupalSettings.ui_toggle.conf.is_admin === true ? null : 'hidden';
    ui_toggle.apps[hid].model = new ui_toggle.AppCustomizeModel({hid: hid, hidden: hidden, type: 'table'});
    ui_toggle.apps[hid].view = new ui_toggle.AppCustomizeView({model: ui_toggle.apps[hid].model});
    ui_toggle.apps[hid].elements = {};
    ui_toggle.apps[hid].elements.views = [];

    const collection = new ui_toggle.CustomizeColumnsCollection();
    const layout = Drupal.ui_toggle.getLayout(hid, 'user', force);
    const cols = ui_toggle.getColumns(hid);
    cols.forEach(function(id) {
      let value = (typeof(layout[id]) !== 'undefined') ? true : null;
      let checked = value ? 'checked' : null;
      let itemData = {
        id: id,
        hid: hid,
        value: value,
        checked: checked,
      };
      let model = new Drupal.ui_toggle.CustomizeColumnsModel(itemData);
      let el = $('form[id^="' + hid + '"] .views-table .' + id);
      collection.add(model);
      ui_toggle.apps[hid].elements.views.push(new Drupal.ui_toggle.AppColumnsView({model: model, el: el,}));
    });
    ui_toggle.apps[hid].model.set('elements', collection);
  };

  /**
   * Applies a table layout.
   * @param hid
   *  Form hid.
   * @param type
   *  Layout type. User or preset. Defaults to preset.
   * @param force
   *  Whether layout can be forced (if a new layout called in ui).
   */
  Drupal.ui_toggle.applyTableLayout = function(hid, type, force) {
    if (typeof(force) === 'undefined') {
      force = false;
    }
    const layout = Drupal.ui_toggle.getLayout(hid, type, force);
    if (layout.length === 0) {
      return;
    }

    // Apply layout.
    const ui_toggle = Drupal.ui_toggle;
    const $form = $('form[id^="' + hid + '"]');
    const exists = typeof(ui_toggle.apps) !== 'undefined' && typeof(ui_toggle.apps[hid]) !== 'undefined';
    if (exists) {
      const collection = ui_toggle.apps[hid].model.get('elements');
      collection.forEach(function(model) {
        if (typeof(layout[model.get('id')]) !== 'undefined') {
          model.set('value', true);
          model.set('checked', 'checked');
          let $el = $form.find('.' + model.get('id'));
          $el.addClass('ui_toggle-hidden');
        }
      });
    }
    else {
      for (let id in layout) {
        let $el = $form.find('.' + id);
        $el.addClass('ui_toggle-hidden');
      }
    }
  };

  /**
   * Gets layout values.
   *
   * @param hid
   *  Form hid.
   * @param type
   *  Layout type. User or preset. Defaults to preset.
   * @param force
   *  Force UI.
   *
   * @return layout object.
   */
  Drupal.ui_toggle.getLayout = function(hid, type, force) {
    if (typeof(force) === 'undefined') {
      force = false;
    }
    if (typeof(drupalSettings.ui_toggle) === 'undefined' ||
      typeof(drupalSettings.ui_toggle.layout) === 'undefined' ||
      typeof(drupalSettings.ui_toggle.layout[hid]) === 'undefined' ||
      typeof(drupalSettings.ui_toggle.layout[hid].isCustomizable) === 'undefined') {
      return {};
    }
    if (drupalSettings.ui_toggle.layout[hid].isCustomizable === 0 && force === false) {
      return {};
    }
    if (typeof(type) === 'undefined' || typeof(drupalSettings.ui_toggle.layout[hid][type]) === 'undefined') {
      type = 'preset';
    }
    if (typeof(drupalSettings.ui_toggle.layout[hid][type]) === 'undefined') {
      return {};
    }

    return drupalSettings.ui_toggle.layout[hid][type];
  };

  Backbone.View.prototype.close = function(){
    this.remove();
    this.unbind();
  };

})(jQuery, Drupal, drupalSettings, _, Backbone);
