define(['dojo/_base/declare', 'jimu/BaseWidget', 'dijit/_WidgetsInTemplateMixin', "jimu/WidgetManager", "esri/tasks/QueryTask", "esri/tasks/query", "dojo/Deferred", "dojo/promise/all", 'esri/dijit/util/busyIndicator', 'https://ajax.googleapis.com/ajax/libs/jquery/2.1.1/jquery.min.js', 'https://cdnjs.cloudflare.com/ajax/libs/select2/4.0.6-rc.0/js/select2.min.js'], function (declare, BaseWidget, _WidgetsInTemplateMixin, WidgetManager, QueryTask, Query, Deferred, all, BusyIndicator, jquery, select2) {
  // import StatisticDefinition from "esri/tasks/StatisticDefinition"

  var fontAwesome = document.createElement('script');
  fontAwesome.src = 'https://use.fontawesome.com/releases/v5.3.1/js/all.js';
  document.head.appendChild(fontAwesome);

  // add link an script
  // <link href="https://cdnjs.cloudflare.com/ajax/libs/select2/4.0.6-rc.0/css/select2.min.css" rel="stylesheet"/>
  // <script src="https://cdnjs.cloudflare.com/ajax/libs/select2/4.0.6-rc.0/js/select2.min.js"></script>

  var select2Css = document.createElement('link');
  select2Css.rel = 'stylesheet';
  select2Css.href = 'https://cdnjs.cloudflare.com/ajax/libs/select2/4.0.6-rc.0/css/select2.min.css';
  document.head.appendChild(select2Css);

  // const select2Js = document.createElement('script');
  // select2Js.src = 'https://cdnjs.cloudflare.com/ajax/libs/select2/4.0.6-rc.0/js/select2.min.js';
  // document.head.appendChild(select2Js);

  var isFirstLoad = false;

  // To create a widget, you need to derive from BaseWidget.
  return declare([BaseWidget], {

    // Custom widget code goes here

    baseClass: 'dynamic-search-widget-cuna-mas',
    groupSelected: null,
    urlLayerSelected: null,
    whereDefault: '1=1',

    postCreate: function postCreate() {
      this.inherited(arguments);
      this.map.on("update-end", this.executeZoomExtentInitial.bind(this));
    },
    onClickGroup: function onClickGroup(evt) {
      var indexGroupSelected = Array.from(evt.target.parentNode.children).indexOf(evt.target);
      this.groupSelected = this.config.groups.find(function (group) {
        return group.index === indexGroupSelected;
      });
      this.buildFormRadioCs();
      this.buildFormSearchCs();
      this.buildHeaderSearchCs();
      this.containerGroupsApCs.classList.toggle('active');
      this.containerFiltersApCs.classList.toggle('active');
    },
    onClickBack: function onClickBack(evt) {
      this.containerGroupsApCs.classList.toggle('active');
      this.containerFiltersApCs.classList.toggle('active');
      this.destroyFormSearchCs();
      this.urlLayerSelected = null;
    },
    startup: function startup() {
      this.inherited(arguments);
      this.busyIndicator = BusyIndicator.create({
        target: this.domNode.parentNode.parentNode,
        backgroundOpacity: 0
      });
    },
    onOpen: function onOpen() {
      this.buildMainMenuCs();
      dojo.query(".groupFilterClsCs").on('click', this.onClickGroup.bind(this));
      dojo.query(".backButtonClsCs").on('click', this.onClickBack.bind(this));
    },
    executeZoomExtentInitial: function executeZoomExtentInitial() {
      if (isFirstLoad) {
        return;
      }
      var homeWidget = WidgetManager.getInstance().getWidgetsByName("HomeButton");
      this.map.setExtent(homeWidget[0].homeDijit.extent);
      isFirstLoad = true;
    },
    buildMainMenuCs: function buildMainMenuCs() {
      var _this = this;

      this.config.groups.sort(function (a, b) {
        return a.index - b.index;
      });
      this.containerGridApCs.innerHTML = '';
      if (this.config.groups.length == 1) {
        this.groupSelected = this.config.groups[0];
        this.containerBackApCs.classList.remove('active');
        this.buildFormRadioCs();
        this.buildFormSearchCs();
        this.buildHeaderSearchCs();
        this.containerGroupsApCs.classList.toggle('active');
        this.containerFiltersApCs.classList.toggle('active');
        return;
      }
      this.config.groups.forEach(function (group) {
        var img = document.createElement('img');
        img.src = group.logo;
        img.alt = group.name;
        img.classList.add('groupFilterClsCs', 'groupCs');
        img.setAttribute('data-dojo-attach-point', 'scdApCs');
        _this.containerGridApCs.appendChild(img);
      });
    },
    buildHeaderSearchCs: function buildHeaderSearchCs() {
      dojo.query('#nameSelectedCs')[0].innerHTML = this.groupSelected.label;
      dojo.query('#nameSelectedCs')[0].style.color = this.groupSelected.color;
      dojo.query('#descSelectedCs')[0].innerHTML = this.groupSelected.description;
      dojo.query('#descSelectedCs')[0].style.color = this.groupSelected.color;
      var img = document.createElement('img');
      img.src = this.groupSelected.logo;
      img.alt = this.groupSelected.name;
      img.classList.add('groupFilterClsCs', 'groupCs');
      img.setAttribute('data-dojo-attach-point', 'scdApCs');
      this.containerImgSelectedApCs.innerHTML = '';
      this.containerImgSelectedApCs.appendChild(img);
    },
    buildFormRadioCs: function buildFormRadioCs() {
      if (this.groupSelected.layersForm) {
        this.makeSelectorLayers(this.groupSelected.layersForm.layers);
        if (this.groupSelected.layersForm.visible) {
          this.radioContainerApCs.classList.add('active');
        } else {
          this.radioContainerApCs.classList.remove('active');
        }
      } else {
        this.radioContainerApCs.classList.remove('active');
      }
    },
    buildFormSearchCs: function buildFormSearchCs() {
      var _this2 = this;

      var filters = this.groupSelected.filters;
      filters.sort(function (a, b) {
        return a.index - b.index;
      });
      this.containerBodyApCs.innerHTML = '';
      filters.forEach(function (filter, index) {
        var label = document.createElement('p');
        label.classList.add('labelComboBoxClsCs');
        label.innerHTML = filter.label;
        _this2.containerBodyApCs.appendChild(label);

        var select = document.createElement('select');
        select.classList.add('comboBoxClsCs');
        select.classList.add('form-control');
        select.classList.add('js-example-tags');
        // select.classList.add('select2');
        select.id = filter.codeField;
        if (filter.startupData) {
          var urlFilter = _this2.urlLayerSelected || filter.url;
          var fieldsFilter = [filter.codeField, filter.nameField];
          _this2.getDataByFilter(urlFilter, fieldsFilter).then(function (response) {
            _this2.makeOptionCs(response.features, select, filter.codeField, filter.nameField, filter.firstOption);
          }).catch(function (err) {
            console.error('err', err);
          });
        };
        // select.select2({
        //   tags: true,
        //   onchange: this.onChangeFilterCs.bind(this)
        // })
        // select.addEventListener('change.select2', (event) => this.onChangeFilterCs(event, index));
        // the same code as js vanilla with jquery
        _this2.containerBodyApCs.appendChild(select);
        $('#' + filter.codeField).on('select2:select', function (event) {
          return _this2.onChangeFilterCs(event, index);
        });
        $('#' + filter.codeField).select2({
          tags: true,
          placeholder: filter.firstOption
          // allowClear: true
        });
      });
    },
    getDataByFilter: function getDataByFilter(url, fields) {
      var where = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : this.whereDefault;
      var distinctValues = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : true;

      var deferred = new Deferred();
      var queryTask = new QueryTask(url);
      var query = new Query();
      query.outFields = fields;
      query.where = where;

      query.returnGeometry = distinctValues ? false : true;
      query.returnDistinctValues = distinctValues;

      queryTask.execute(query).then(function (response) {
        deferred.resolve(response);
      }).catch(function (err) {
        deferred.reject(err);
      });
      return deferred.promise;
    },
    setExtentByFilter: function setExtentByFilter(url, where) {
      var self = this;
      var deferred = new Deferred();
      var queryTask = new QueryTask(url);
      var query = new Query();
      query.where = where;
      query.returnGeometry = true;

      queryTask.executeForExtent(query).then(function (response) {
        self.map.setExtent(response.extent.expand(1.1), true);
        deferred.resolve(response);
      }).catch(function (err) {
        console.error('err', err);
        deferred.reject(err);
      });
      return deferred.promise;
    },
    destroyFormSearchCs: function destroyFormSearchCs() {
      this.containerBodyApCs.innerHTML = '';
    },
    destroyFormRadioCs: function destroyFormRadioCs() {
      this.radioContainerApCs.innerHTML = '';
    },
    makeOptionCs: function makeOptionCs(options, selectControl, valueField, labelField, firstOption) {
      var fixOptionSelected = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : true;

      var selectedValue = null;
      if (fixOptionSelected) {
        var selectedIndex = selectControl.selectedIndex;
        if (selectedIndex > 1) {
          selectedValue = selectControl.options[selectedIndex].value;
        }
      }
      selectControl.innerHTML = '';
      var phOption = document.createElement('option');
      phOption.text = firstOption;
      phOption.value = '';
      selectControl.appendChild(phOption);

      var restoreOption = document.createElement('option');
      // restoreOption.text = firstOption;
      restoreOption.text = 'Vacío';
      restoreOption.value = '0';
      restoreOption.selected = false;
      // restoreOption.disabled = true;
      selectControl.appendChild(restoreOption);

      options.forEach(function (option) {
        var optionElement = document.createElement('option');
        optionElement.value = option.attributes[valueField];
        optionElement.innerHTML = option.attributes[labelField];
        if (selectedValue && selectedValue.toString() === option.attributes[valueField].toString()) {
          optionElement.selected = true;
        }
        selectControl.appendChild(optionElement);
      });
    },
    onChangeFilterCs: function onChangeFilterCs(evt, currentFilterIndex) {
      var _this3 = this;

      this.busyIndicator.show();
      var where = this.manageWhere();
      if (where === '') {
        where = this.whereDefault;
      }
      var selectedIndex = evt.target.selectedIndex;
      var selectedValue = evt.target.options[selectedIndex].value;
      var currentFilter = this.groupSelected.filters[currentFilterIndex];

      if (selectedValue === '0') {
        // si se selecionar "vacio" con un value igual a 0; el select no debe tener ningun valor seleccionado
        evt.currentTarget.value = '';
        // evt.currentTarget.options[0].selected = true;
        evt.currentTarget.dispatchEvent(new Event('change'));
      };

      var fields = [currentFilter.codeField, currentFilter.nameField];
      // const where = `${currentFilter.codeField} = '${selectedValue}'`;

      var responseFilter = void 0;

      var url = this.urlLayerSelected || currentFilter.url;
      return this.getDataByFilter(url, fields, where, false).then(function (response) {
        responseFilter = response;
        if (!currentFilter.isZoom) {
          return null;
        }
        if (responseFilter.features.length === 1 && responseFilter.features[0].geometry.type === 'point') {
          return _this3.map.centerAndZoom(responseFilter.features[0].geometry, 17);
        }
        return _this3.setExtentByFilter(url, where);
      }).then(function () {
        var promises = _this3.groupSelected.filters.map(function (filter, index) {
          if (selectedValue === '0') {
            var urlFilter = _this3.urlLayerSelected || filter.url;
            var fieldsFilter = [filter.codeField, filter.nameField];
            return _this3.getDataByFilter(urlFilter, fieldsFilter, where).then(function (data) {
              _this3.makeOptionCs(data.features, document.getElementById(filter.codeField), filter.codeField, filter.nameField, filter.firstOption);
            });
          } else if (evt.target.id !== filter.codeField) {
            var _urlFilter = _this3.urlLayerSelected || filter.url;
            var _fieldsFilter = [filter.codeField, filter.nameField];
            return _this3.getDataByFilter(_urlFilter, _fieldsFilter, where).then(function (data) {
              _this3.makeOptionCs(data.features, document.getElementById(filter.codeField), filter.codeField, filter.nameField, filter.firstOption);
            });
          }
        });
        return all(promises);
        // this.groupSelected.filters.forEach(filter => {
        // makeOption by each filter

        // });
        //   if (!currentFilter.filterAffected) {
        //     return;
        //   }
        //   currentFilter.filterAffected.forEach(affectedIndex => {
        //     const affectedFilter = this.groupSelected.filters[affectedIndex];
        //     const affectedSelect = document.getElementById(affectedFilter.codeField);
        //     const urlFilter = this.urlLayerSelected || affectedFilter.url;
        //     const fieldsFilter = [affectedFilter.codeField, affectedFilter.nameField];
        //     const whereFilter = `${currentFilter.codeField} = '${selectedValue}'`;
        //     this.getDataByFilter(urlFilter, fieldsFilter, whereFilter)
        //       .then(data => {
        //         this.makeOptionCs(data.features, affectedSelect, affectedFilter.codeField, affectedFilter.nameField, affectedFilter.firstOption);
        //       })
        //       .then(() => {
        //         let filterAffectedReset = affectedFilter.filterAffected;
        //         while (filterAffectedReset.length > 0) {
        //           filterAffectedReset = this.resetSelectIndexArray(filterAffectedReset);
        //         }
        //       })
        //       .catch(err => {
        //         console.error(`Error al actualizar el filtro ${affectedFilter.label}:`, err);
        //       });
        //   });
      }).then(function () {
        _this3.busyIndicator.hide();
      }).catch(function (err) {
        console.error('err', err);
        _this3.busyIndicator.hide();
      });
    },
    makeSelectorLayers: function makeSelectorLayers(layers) {
      var _this4 = this;

      layers.sort(function (a, b) {
        return a.index - b.index;
      });
      this.formRadioContainersApCs.innerHTML = '';

      var idSelected = void 0;

      layers.forEach(function (layer) {

        var radioItemContainer = document.createElement('div');
        radioItemContainer.classList.add('radioItemContainerCs');
        var input = document.createElement('input');
        input.type = 'radio';
        input.name = 'searchType';
        input.id = layer.id;
        if (layer.selected) {
          idSelected = layer.id;
        };
        radioItemContainer.appendChild(input);
        var label = document.createElement('label');
        label.for = layer.id;
        label.innerHTML = layer.label;
        radioItemContainer.appendChild(label);
        if (!layer.visible) {
          // display none
          radioItemContainer.style.display = 'none';
        }
        _this4.formRadioContainersApCs.appendChild(radioItemContainer);
      });
      dojo.query('.radioItemContainerCs input').on('click', this.handleRadioButtonClick.bind(this));
      // execute event ckecked the radio button selected by id programmatically in dom
      if (idSelected) {
        document.getElementById(idSelected).checked = true;
        document.getElementById(idSelected).click();
      };
    },
    handleRadioButtonClick: function handleRadioButtonClick(event) {
      var _this5 = this;

      var layerSelected = this.groupSelected.layersForm.layers.find(function (layer) {
        return layer.id === event.target.id;
      });
      if (layerSelected) {
        this.groupSelected.layersForm.layers.forEach(function (layer) {
          if (layer.id === event.target.id) {} else {
            layer.layersId.forEach(function (layerId) {
              if (_this5.map.getLayer(layerId).visible & layerSelected.layersId[0] != layerId) {
                _this5.map.getLayer(layerId).setVisibility(false);
              };
            });
          }
        });
        layerSelected.layersId.forEach(function (layerId) {
          if (!_this5.map.getLayer(layerId).visible) {
            _this5.map.getLayer(layerId).setVisibility(true);
          };
        });
        this.urlLayerSelected = this.map.getLayer(layerSelected.layersId[0]).url;
      }
    },
    manageWhere: function manageWhere() {
      var where = [];
      this.groupSelected.filters.forEach(function (filter) {
        var select = document.getElementById(filter.codeField);
        // get value selected
        var selectedIndex = select.selectedIndex;
        if (selectedIndex > 1) {
          // create where
          var selectedValue = select.options[selectedIndex].value;
          where.push('(' + filter.codeField + ' = \'' + selectedValue + '\')');
        };
      });
      // console.log('where', where.join(' AND '));
      return where.join(' AND ');
    }
  }

  // onClose(){
  //   console.log('DynamicSearchWidgetCunaMas::onClose');
  // },
  // onMinimize(){
  //   console.log('DynamicSearchWidgetCunaMas::onMinimize');
  // },
  // onMaximize(){
  //   console.log('DynamicSearchWidgetCunaMas::onMaximize');
  // },
  // onSignIn(credential){
  //   console.log('DynamicSearchWidgetCunaMas::onSignIn', credential);
  // },
  // onSignOut(){
  //   console.log('DynamicSearchWidgetCunaMas::onSignOut');
  // }
  // onPositionChange(){
  //   console.log('DynamicSearchWidgetCunaMas::onPositionChange');
  // },
  // resize(){
  //   console.log('DynamicSearchWidgetCunaMas::resize');
  // }
  );
});
//# sourceMappingURL=Widget.js.map
