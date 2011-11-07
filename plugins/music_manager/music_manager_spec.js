(function() {
  var fixtures, manager;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  manager = chromus.plugins.music_manager;
  fixtures = {
    playlist: [
      {
        'song': 'Song 1',
        'artist': 'Beatles'
      }, {
        'song': 'Song 2',
        'artist': 'Chuck Berry'
      }, {
        'song': 'Song 3',
        'artist': 'Louess Reed'
      }
    ],
    searchResults: [
      {
        'song': 'Help',
        'artist': 'Beatles',
        'file_url': 'http://a/1.mp3',
        'duration': 100
      }, {
        'song': 'Song 2',
        'artist': 'Chuck Berry',
        'file_url': 'http://a/2.mp3',
        'duration': 200
      }
    ]
  };
  describe("Music manager", function() {
    beforeEach(function() {
      return manager.playlist.reset();
    });
    it("should load artist top tracks", function() {
      var first_track_id, play_spy, search_spy, top_spy;
      top_spy = spyOn(manager.lastfm.artist, 'getTopTracks').andCallFake(__bind(function(artist, callback) {
        return callback(fixtures.playlist);
      }, this));
      search_spy = spyOn(manager, "searchTrack");
      play_spy = spyOn(manager, 'playTrack').andCallThrough();
      manager.playTrack({
        type: "artist",
        artist: "Chuck Berry"
      });
      expect(top_spy).toHaveBeenCalled();
      expect(manager.playlist.length).toBe(3);
      expect(play_spy.callCount).toBe(2);
      expect(search_spy).toHaveBeenCalled();
      first_track_id = manager.playlist.first().id;
      expect(first_track_id).toBeDefined();
      return expect(manager.get('current_track')).toBe(first_track_id);
    });
    it("should play song after searching", function() {
      var play_spy, play_track_spy, search_spy, vk_spy;
      search_spy = spyOn(manager, "searchTrack").andCallThrough();
      play_track_spy = spyOn(manager, "playTrack").andCallThrough();
      play_spy = spyOn(manager, "play");
      vk_spy = spyOn(chromus.audio_sources.vkontakte, "search").andCallFake(function(track, callback) {
        return callback(fixtures.searchResults);
      });
      manager.playlist.reset(fixtures.playlist);
      manager.playTrack(manager.playlist.first());
      expect(search_spy).toHaveBeenCalled();
      expect(vk_spy).toHaveBeenCalled();
      expect(manager.currentTrack().get('file_url')).toBe(fixtures.searchResults[0].file_url);
      expect(play_track_spy.callCount).toBe(2);
      return expect(play_spy).toHaveBeenCalled();
    });
    it("should change player state", function() {
      var callback, play_spy, state_spy, states, vk_spy;
      manager.playlist.reset(fixtures.playlist);
      expect(manager.state.get('name')).toBe("stopped");
      play_spy = spyOn(manager.player, "play");
      vk_spy = spyOn(chromus.audio_sources.vkontakte, "search").andCallFake(function(track, callback) {
        return callback(fixtures.searchResults);
      });
      state_spy = jasmine.createSpy();
      callback = function(state) {
        return state_spy(state.toJSON());
      };
      manager.state.bind('change', callback);
      manager.playTrack(manager.playlist.first());
      manager.pause();
      manager.stop();
      manager.state.unbind('change', callback);
      states = _.map(state_spy.calls, function(call) {
        return call.args[0].name;
      });
      return expect(states).toEqual(['loading', 'playing', 'paused', 'stopped']);
    });
    it("should change state to paused", function() {
      manager.playlist.reset(fixtures.playlist);
      manager.pause();
      return expect(manager.state.get('name')).toBe("paused");
    });
    it("should reset current_track after stop", function() {
      manager.playlist.reset(fixtures.playlist);
      manager.set({
        'current_track': manager.playlist.first().id
      });
      manager.state.set({
        'name': 'playing'
      });
      manager.stop();
      expect(manager.state.get('name')).toBe('stopped');
      return expect(manager.state.get('current_track')).toBeUndefined();
    });
    it("should change next track after stopping", function() {
      var play_spy, play_track_spy, search_spy, update_state_spy, vk_spy;
      manager.playlist.reset(fixtures.playlist);
      manager.set({
        'current_track': manager.playlist.first().id
      });
      manager.state.set({
        'name': 'playing'
      });
      update_state_spy = spyOn(manager, "updateState").andCallThrough();
      play_track_spy = spyOn(manager, "playTrack").andCallThrough();
      search_spy = spyOn(manager, "searchTrack").andCallThrough();
      vk_spy = spyOn(chromus.audio_sources.vkontakte, "search").andCallFake(function(track, callback) {
        return callback(fixtures.searchResults);
      });
      play_spy = spyOn(manager.player, "play").andCallFake(function() {
        return manager.player.state.unset('name', {
          silent: true
        });
      });
      manager.player.state.set({
        name: "stopped"
      });
      expect(play_track_spy).toHaveBeenCalled();
      expect(search_spy).toHaveBeenCalled();
      expect(vk_spy).toHaveBeenCalled();
      expect(manager.get('current_track')).toBe(manager.playlist.models[1].id);
      manager.player.state.set({
        name: "stopped"
      });
      expect(manager.get('current_track')).toBe(manager.playlist.models[2].id);
      return expect(manager.state.get('name')).toBe("playing");
    });
    return it("should stop if song ended", function() {
      var play_track_spy;
      play_track_spy = spyOn(manager, "playTrack");
      manager.playlist.reset(fixtures.playlist);
      manager.set({
        'current_track': manager.playlist.first().id
      });
      manager.state.set({
        'name': 'playing'
      });
      manager.currentTrack().set({
        'duration': 100
      });
      manager.updateState({
        "played": 100
      });
      expect(play_track_spy).toHaveBeenCalled();
      return expect(manager.state.get('name')).toBe("stopped");
    });
  });
}).call(this);