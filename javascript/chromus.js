(function() {
  var Chromus;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  Chromus = (function() {
    Chromus.prototype.audio_players = {};
    Chromus.prototype.audio_sources = {};
    Chromus.prototype.plugins = {};
    Chromus.prototype.plugins_info = {};
    Chromus.prototype.plugins_list = ['echonest', 'lastfm', 'iframe_player', 'local_files_player', 'vkontakte', 'music_manager', 'ui'];
    function Chromus() {
      _.bindAll(this);
      this.pluginsLoadedCallback = function() {};
      this.loadPlugins();
    }
    Chromus.prototype.injectPluginFiles = function() {
      var files, meta, plugin, plugin_files, _ref;
      console.log('injecting files');
      files = [];
      _ref = this.plugins_info;
      for (plugin in _ref) {
        meta = _ref[plugin];
        plugin_files = meta[browser.page_type] || [];
        if (window.jasmine) {
          plugin_files = _.union(plugin_files, meta['spec'] || []);
        }
        files.push(_.map(plugin_files, function(file) {
          return "" + meta.path + "/" + file + "?" + (+new Date());
        }));
      }
      return yepnope({
        load: _.flatten(files),
        complete: this.pluginsLoadedCallback
      });
    };
    Chromus.prototype.loadPlugins = function() {
      var callback, plugin, _i, _len, _ref, _results;
      callback = _.after(this.plugins_list.length, this.injectPluginFiles);
      _ref = this.plugins_list;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        plugin = _ref[_i];
        _results.push(__bind(function(plugin) {
          var package_path, plugin_path;
          plugin_path = browser.extension.getURL("/plugins/" + plugin);
          package_path = "" + plugin_path + "/package.json";
          return $.getJSON(package_path, __bind(function(package) {
            this.plugins_info[plugin] = package;
            this.plugins_info[plugin].path = plugin_path;
            return callback();
          }, this));
        }, this)(plugin));
      }
      return _results;
    };
    Chromus.prototype.registerPlugin = function(name, context) {
      return this.plugins[name] = context;
    };
    Chromus.prototype.registerPlayer = function(name, context) {
      return this.audio_players[name] = context;
    };
    Chromus.prototype.registerAudioSource = function(name, context) {
      return this.audio_sources[name] = context;
    };
    return Chromus;
  })();
  this.chromus = new Chromus();
  this.chromus.utils = {
    uid: function() {
      var _ref;
      if ((_ref = this.uid_start) == null) {
        this.uid_start = +new Date();
      }
      return this.uid_start++;
    }
  };
}).call(this);
