	$.h264 = {
		version: res.version
	}
	
	$.fn.h264HTML5_ = function(params, flparams, callbacks) {
		var result = VideoPlayer(this, params, callbacks)

		$.isFunction(callbacks.succeeded) && callbacks.succeeded.call(this);
		
		return { isHTML5: true, player: result };
	};
	
	$.fn.h264Flash_ = function(params, flparams, callbacks) {
		var result = $.extend(def.noFlashReturn);
		failed = true;
		
		if (flparams) {
			failed = false;
			var flashvars = flparams.flashvars;
			flparams.flashvars = null;
		
			flparams = $.extend({
				onFail: function() { failed = true; }
			}, flparams);
		
			var result = this.flashembed(flparams, flashvars);
		}

		$.isFunction(callbacks.failed) && callbacks.failed.call(this);
		$.isFunction(callbacks.succeeded) && callbacks.succeeded.call(this);
		
		return { isHTML5: false, player: result };
	};
	
	if (useVideoTag_()) $.fn.h264_ = $.fn.h264HTML5_;
    else $.fn.h264_ = $.fn.h264Flash_;
	
	$.fn.h264 = function(params, flparams, callbacks) {
		if (!$.isPlainObject(params)) params = { src: params };
		if (!$.isPlainObject(callbacks)) callbacks = { completed: callbacks };
		
		params = $.extend(def.params, params);
		
		flparams = flparams && $.extend(def.flparams, {
			width: params.width,
			height: params.height
		}, flparams);
		
		callbacks = $.extend(def.callbacks, callbacks);
		
		var result = this.h264_(params, flparams, callbacks);
		
		$.isFunction(callbacks.completed) && callbacks.completed.call(this);
		
		return result;
	};