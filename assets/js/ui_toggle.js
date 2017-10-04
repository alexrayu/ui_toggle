/**
 * @file
 * Contains the definition of the behaviour ui_toggle.
 */

(function ($, Drupal, drupalSettings, _, Backbone, JSON, storage) {
  'use strict';

  /**
   * Initialize the form controls.
   * @param context
   */
  function initui_toggleControls(context) {
    var ui_toggle = Drupal.ui_toggle;
    ui_toggle.Controls = new ui_toggle.ControlsCollection;
    $.each(drupalSettings.ui_toggle.controls, function(index, value) {
      var $form = $('#ui_toggle-container-' + value.tag.hid).parents('form');
      if ($(context).find($form).length) {
        if (typeof(value.tag.show) != 'undefined' && value.tag.show == true) {
          var item = new ui_toggle.ControlModel(value.tag);
          ui_toggle.Controls.add(item);
          var $form = $('#ui_toggle-container-' + value.tag.hid).parents('form');
          var viewData = {
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
   * @param hid
   *  Form hid.
   */
  function initCustomizationControls(hid, force) {
    var ui_toggle = Drupal.ui_toggle;
    if (typeof(force) == 'undefined') {
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
        if (data.result == 1) {
          var $form = $('#ui_toggle-container-' + hid).parents('form');
          var item = new ui_toggle.ControlModel({
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
      var $form = $('#ui_toggle-container-' + hid).parents('form');
      var item = new ui_toggle.ControlModel({
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
    attach: function (context, settings) {

      // Init controls.
      initui_toggleControls(context);

      // Init layout.
      if(typeof(drupalSettings.ui_toggle.layout) != 'undefined' &&
        typeof(drupalSettings.ui_toggle.layout.hids != 'undefined')) {
        for (var hid in drupalSettings.ui_toggle.layout.hids) {
          var $form = $('#ui_toggle-container-' + hid).parents('form');
          if ($(context).find($form).length) {
            if (drupalSettings.ui_toggle[hid].type == 'elements') {
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
      if (typeof(force) == 'undefined') {
        force = false;
      }

      // Elements app or table app.
      if (typeof(drupalSettings.ui_toggle[hid]) != 'undefined' &&
      drupalSettings.ui_toggle[hid].type == 'elements') {
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
    var $ths = $('form[id^="' + hid + '"] .views-table thead th');
    var items = [];
    $ths.each(function(index, value) {
      var thClass = $(value).attr('class').match(/views-field-([^\s]+)/)[0];
      if (thClass != 'views-field-node-bulk-form') {
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
    var ui_toggle = Drupal.ui_toggle;
    ui_toggle.apps[hid] = {};
    ui_toggle.apps[hid].elements = {};
    ui_toggle.apps[hid].elements.views = [];
    var hidden = typeof(drupalSettings.ui_toggle.conf.is_admin) != 'undefined' &&
    drupalSettings.ui_toggle.conf.is_admin == true ? null : 'hidden';
    ui_toggle.apps[hid].model = new ui_toggle.AppCustomizeModel({hid: hid, hidden: hidden, type: 'elements'});
    ui_toggle.apps[hid].view = new ui_toggle.AppCustomizeView({model: ui_toggle.apps[hid].model});
    var collection = new ui_toggle.CustomizeElementsCollection();
    var layout = Drupal.ui_toggle.getLayout(hid, 'user', force);
    drupalSettings.ui_toggle[hid].elements.forEach(function(id) {
      var value = (typeof(layout[id]) != 'undefined') ? true : null;
      var checked = value ? 'checked' : null;
      var itemData = {
        id: id,
        hid: hid,
        value: value,
        checked: checked,
      };
      var model = new Drupal.ui_toggle.CustomizeElementsModel(itemData);
      var el = $('[id^="edit-' + id + '"]').parents('.form-item-' + id);
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
    if (typeof(force) == 'undefined') {
      force = false;
    }
    var layout = Drupal.ui_toggle.getLayout(hid, type, force);
    if (layout.length == 0) {
      return;
    }

    // Apply layout.
    var ui_toggle = Drupal.ui_toggle;
    var actives = drupalSettings.ui_toggle[hid].active_elements;
    var $form = $('form[id^="' + hid + '"]');
    var $details = $form.find('.ui_toggle-details');
    var exists = typeof(ui_toggle.apps) != 'undefined' && typeof(ui_toggle.apps[hid]) != 'undefined';
    var count = 0;
    var should_open = false;

    if (exists) {
      var collection = ui_toggle.apps[hid].model.get('elements');
    }

    for (var id in layout) {
      if (typeof(actives[id]) != 'undefined') {
        should_open = true;
      }
      var $el = $form.find('[id^="edit-' + id + '"]').parents('.form-item').detach();
      count++;
      $details.find('.details-wrapper').append($el);
      if (exists) {
        var model = collection.get(id);
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
   * @param hid
   * @param force
   */
  Drupal.ui_toggle.initTableApp = function(hid, force) {
    var ui_toggle = Drupal.ui_toggle;
    ui_toggle.apps[hid] = {};

    var hidden = typeof(drupalSettings.ui_toggle.conf.is_admin) != 'undefined' &&
    drupalSettings.ui_toggle.conf.is_admin == true ? null : 'hidden';
    ui_toggle.apps[hid].model = new ui_toggle.AppCustomizeModel({hid: hid, hidden: hidden, type: 'table'});
    ui_toggle.apps[hid].view = new ui_toggle.AppCustomizeView({model: ui_toggle.apps[hid].model});
    ui_toggle.apps[hid].elements = {};
    ui_toggle.apps[hid].elements.views = [];

    var collection = new ui_toggle.CustomizeColumnsCollection();
    var layout = Drupal.ui_toggle.getLayout(hid, 'user', force);
    var cols = ui_toggle.getColumns(hid);
    cols.forEach(function(id) {
      var value = (typeof(layout[id]) != 'undefined') ? true : null;
      var checked = value ? 'checked' : null;
      var itemData = {
        id: id,
        hid: hid,
        value: value,
        checked: checked,
      };
      var model = new Drupal.ui_toggle.CustomizeColumnsModel(itemData);
      var el = $('form[id^="' + hid + '"] .views-table .' + id);
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
    if (typeof(force) == 'undefined') {
      force = false;
    }
    var layout = Drupal.ui_toggle.getLayout(hid, type, force);
    if (layout.length == 0) {
      return;
    }

    // Apply layout.
    var ui_toggle = Drupal.ui_toggle;
    var $form = $('form[id^="' + hid + '"]');
    var exists = typeof(ui_toggle.apps) != 'undefined' && typeof(ui_toggle.apps[hid]) != 'undefined';
    if (exists) {
      var collection = ui_toggle.apps[hid].model.get('elements');
    }
    if (exists) {
      collection.forEach(function(model) {
        if (typeof(layout[model.get('id')]) != 'undefined') {
          model.set('value', true);
          model.set('checked', 'checked');
          var $el = $form.find('.' + model.get('id'));
          $el.addClass('ui_toggle-hidden');
        }
      });
    }
    else {
      for (var id in layout) {
        var $el = $form.find('.' + id);
        $el.addClass('ui_toggle-hidden');
      }
    }
  };

  /**
   * Gets layout values.
   * @param hid
   *  Form hid.
   * @param type
   *  Layout type. User or preset. Defaults to preset.
   * @return layout object.
   */
  Drupal.ui_toggle.getLayout = function(hid, type, force) {
    if (typeof(force) == 'undefined') {
      force = false;
    }
    if (typeof(drupalSettings.ui_toggle) == 'undefined' ||
      typeof(drupalSettings.ui_toggle.layout) == 'undefined' ||
      typeof(drupalSettings.ui_toggle.layout[hid]) == 'undefined' ||
      typeof(drupalSettings.ui_toggle.layout[hid].isCustomizable) == 'undefined') {
      return {};
    }
    if (drupalSettings.ui_toggle.layout[hid].isCustomizable == 0 && force == false) {
      return {};
    }
    if (typeof(type) == 'undefined' || typeof(drupalSettings.ui_toggle.layout[hid][type]) == 'undefined') {
      type = 'preset';
    }
    if (typeof(drupalSettings.ui_toggle.layout[hid][type]) == 'undefined') {
      return {};
    }

    return drupalSettings.ui_toggle.layout[hid][type];
  };

  Backbone.View.prototype.close = function(){
    this.remove();
    this.unbind();
  };

})(jQuery, Drupal, drupalSettings, _, Backbone, window.JSON, window.sessionStorage);
