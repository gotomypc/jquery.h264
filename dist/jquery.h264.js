/**
 * jQuery h.264 library 1.0.3
 * http://github.com/mbrio/jquery.h264
 *
 * Copyright (c) 2010 Michael Diolosa - http://github.com/mbrio
 * Dual-licensed under the GPL and MIT licenses.
 *
 * Date: Mon Sep 6 23:14:45 2010 -0400
 */
(function($) {

	/*
	 * @license 
	 * jQuery Tools / Flashembed - New wave Flash embedding
	 * 
	 * NO COPYRIGHTS OR LICENSES. DO WHAT YOU LIKE.
	 * 
	 * http://flowplayer.org/tools/toolbox/flashembed.html
	 *
	 * Since : March 2008
	 */ 
	(function() {
		
		var IE = document.all,
			 URL = 'http://www.adobe.com/go/getflashplayer',
			 JQUERY = typeof jQuery == 'function', 
			 RE = /(\d+)[^\d]+(\d+)[^\d]*(\d*)/,
			 GLOBAL_OPTS = { 
				// very common opts
				width: '100%',
				height: '100%',		
				id: "_" + ("" + Math.random()).slice(9),
			
				// flashembed defaults
				allowfullscreen: true,
				allowscriptaccess: 'always',
				quality: 'high',	
			
				// flashembed specific options
				version: [3, 0],
				onFail: null,
				expressInstall: null, 
				w3c: false,
				cachebusting: false  		 		 
		};
	
		// version 9 bugfix: (http://blog.deconcept.com/2006/07/28/swfobject-143-released/)
		if (window.attachEvent) {
			window.attachEvent("onbeforeunload", function() {
				__flash_unloadHandler = function() {};
				__flash_savedUnloadHandler = function() {};
			});
		}
	
		// simple extend
		function extend(to, from) {
			if (from) {
				for (var key in from) {
					if (from.hasOwnProperty(key)) {
						to[key] = from[key];
					}
				}
			} 
			return to;
		}	

		// used by asString method	
		function map(arr, func) {
			var newArr = []; 
			for (var i in arr) {
				if (arr.hasOwnProperty(i)) {
					newArr[i] = func(arr[i]);
				}
			}
			return newArr;
		}

		window.flashembed = function(root, opts, conf) {
	
			// root must be found / loaded	
			if (typeof root == 'string') {
				root = document.getElementById(root.replace("#", ""));
			}
		
			// not found
			if (!root) { return; }
		
			if (typeof opts == 'string') {
				opts = {src: opts};	
			}

			return new Flash(root, extend(extend({}, GLOBAL_OPTS), opts), conf); 
		};	
	
		// flashembed "static" API
		var f = extend(window.flashembed, {
		
			conf: GLOBAL_OPTS,
	
			getVersion: function()  {
				var fo, ver;
			
				try {
					ver = navigator.plugins["Shockwave Flash"].description.slice(16); 
				} catch(e) {
				
					try  {
						fo = new ActiveXObject("ShockwaveFlash.ShockwaveFlash.7");
						ver = fo && fo.GetVariable("$version");
					
					} catch(err) {
	                try  {
	                    fo = new ActiveXObject("ShockwaveFlash.ShockwaveFlash.6");
	                    ver = fo && fo.GetVariable("$version");  
	                } catch(err2) { } 						
					} 
				}
			
				ver = RE.exec(ver);
				return ver ? [ver[1], ver[3]] : [0, 0];
			},
		
			asString: function(obj) { 

				if (obj === null || obj === undefined) { return null; }
				var type = typeof obj;
				if (type == 'object' && obj.push) { type = 'array'; }
			
				switch (type){  
				
					case 'string':
						obj = obj.replace(new RegExp('(["\\\\])', 'g'), '\\$1');
					
						// flash does not handle %- characters well. transforms "50%" to "50pct" (a dirty hack, I admit)
						obj = obj.replace(/^\s?(\d+\.?\d+)%/, "$1pct");
						return '"' +obj+ '"';
					
					case 'array':
						return '['+ map(obj, function(el) {
							return f.asString(el);
						}).join(',') +']'; 
					
					case 'function':
						return '"function()"';
					
					case 'object':
						var str = [];
						for (var prop in obj) {
							if (obj.hasOwnProperty(prop)) {
								str.push('"'+prop+'":'+ f.asString(obj[prop]));
							}
						}
						return '{'+str.join(',')+'}';
				}
			
				// replace ' --> "  and remove spaces
				return String(obj).replace(/\s/g, " ").replace(/\'/g, "\"");
			},
		
			getHTML: function(opts, conf) {

				opts = extend({}, opts);
			
				/******* OBJECT tag and it's attributes *******/
				var html = '<object width="' + opts.width + 
					'" height="' + opts.height + 
					'" id="' + opts.id + 
					'" name="' + opts.id + '"';
			
				if (opts.cachebusting) {
					opts.src += ((opts.src.indexOf("?") != -1 ? "&" : "?") + Math.random());		
				}			
			
				if (opts.w3c || !IE) {
					html += ' data="' +opts.src+ '" type="application/x-shockwave-flash"';		
				} else {
					html += ' classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"';	
				}
			
				html += '>'; 
			
				/******* nested PARAM tags *******/
				if (opts.w3c || IE) {
					html += '<param name="movie" value="' +opts.src+ '" />'; 	
				} 
			
				// not allowed params
				opts.width = opts.height = opts.id = opts.w3c = opts.src = null;
				opts.onFail = opts.version = opts.expressInstall = null;
			
				for (var key in opts) {
					if (opts[key]) {
						html += '<param name="'+ key +'" value="'+ opts[key] +'" />';
					}
				}	
		
				/******* FLASHVARS *******/
				var vars = "";
			
				if (conf) {
					for (var k in conf) { 
						if (conf[k]) {
							var val = conf[k]; 
							vars += k +'='+ (/function|object/.test(typeof val) ? f.asString(val) : val) + '&';
						}
					}
					vars = vars.slice(0, -1);
					html += '<param name="flashvars" value=\'' + vars + '\' />';
				}
			
				html += "</object>";	
			
				return html;				
			},
		
			isSupported: function(ver) {
				return VERSION[0] > ver[0] || VERSION[0] == ver[0] && VERSION[1] >= ver[1];			
			}		
		
		});
	
		var VERSION = f.getVersion(); 
	
		function Flash(root, opts, conf) {  
	                                                
			// version is ok
			if (f.isSupported(opts.version)) {
				root.innerHTML = f.getHTML(opts, conf);
			
			// express install
			} else if (opts.expressInstall && f.isSupported([6, 65])) {
				root.innerHTML = f.getHTML(extend(opts, {src: opts.expressInstall}), {
					MMredirectURL: location.href,
					MMplayerType: 'PlugIn',
					MMdoctitle: document.title
				});	
			
			} else {
			
				// fail #2.1 custom content inside container
				if (!root.innerHTML.replace(/\s/g, '')) {
					root.innerHTML = 
						"<h2>Flash version " + opts.version + " or greater is required</h2>" + 
						"<h3>" + 
							(VERSION[0] > 0 ? "Your version is " + VERSION : "You have no flash plugin installed") +
						"</h3>" + 
					
						(root.tagName == 'A' ? "<p>Click here to download latest version</p>" : 
							"<p>Download latest version from <a href='" + URL + "'>here</a></p>");
					
					if (root.tagName == 'A') {	
						root.onclick = function() {
							location.href = URL;
						};
					}				
				}
			
				// onFail
				if (opts.onFail) {
					var ret = opts.onFail.call(this);
					if (typeof ret == 'string') { root.innerHTML = ret; }	
				}			
			}
		
			// http://flowplayer.org/forum/8/18186#post-18593
			if (IE) {
				window[opts.id] = document.getElementById(opts.id);
			} 
		
			// API methods for callback
			extend(this, {
				
				getRoot: function() {
					return root;	
				},
			
				getOptions: function() {
					return opts;	
				},

			
				getConf: function() {
					return conf;	
				}, 
			
				getApi: function() {
					return root.firstChild;	
				}
			
			}); 
		}
	
		// setup jquery support
		if (JQUERY) {
		
			// tools version number
			jQuery.tools = jQuery.tools || {version: '1.0.3'};
		
			jQuery.tools.flashembed = {  
				conf: GLOBAL_OPTS
			};	
		
			jQuery.fn.flashembed = function(opts, conf) {		
				return this.each(function() { 
					$(this).data("flashembed", flashembed(this, opts, conf));
				});
			}; 
		} 
	
	})();

	// Beginning of the jQuery h.264 code
	// Create private variables that represent many string values
	var res = {
		version: '1.0.3',
		videoElementName: 'video',
		divElement: '<div>',
		videoElement: '<video>',
		customControlQuery: /iphone|ipod|ipad|android/i,
		h264Type: 'video/mp4; codecs="avc1.42E01E"',
		videoClass: 'jquery-h264-video',
		videoContainerClass: 'jquery-h264-video-container',
		videoPosterClass: 'jquery-h264-video-poster',
		videoPosterPlayClass: 'jquery-h264-poster-play',
		videoControlsSelector: '.jquery-h264-video-controls',
		videoControlsPlayButtonSelector: '.jquery-h264-play-button',
		videoControlsGutterSelector: '.jquery-h264-gutter',
		videoControlsPlayheadSelector: '.jquery-h264-playhead',
		videoControlsProgressSelector: '.jquery-h264-progress',
		playingClass: 'playing'
	}

	// Default objects
	var def = {
		params: {
			src: null,
			poster: null,
			preload: 'none',
			autoplay: null,
			loop: null,
			controls: 'controls',
			width: '100%',
			height: '100%'
		},
		flparams: {
			src: null,
			version: [9],
			expressInstall: null,
			w3c: false,
			cachebusting: false,
			bgcolor: null,
			wmode: 'opaque',
			allowfullscreen: true,
	        allowscriptaccess: 'always',
			quality: 'high',
			flashvars: {}
		},
		callbacks: {
			complete: null,
			success: null,
			failure: null
		}
	}

	var VideoPlayer = function vp(ele, params, callbacks) {
		if (!(this instanceof arguments.callee)) return new vp(ele, params, callbacks);
	
		this.percentComplete = 0;
		this.percentLoaded = 0;
	
		this.element = ele;
	
		init_.call(this, params);
	}

	var useVideoTag_ = function() {
		if (useVideoTag_.cache === null) {
			var obj = document.createElement(res.videoElementName);
			useVideoTag_.cache = !!(typeof(obj.canPlayType) !== 'undefined' && obj.canPlayType(res.h264Type));
		}
	
		return useVideoTag_.cache;
	}
	useVideoTag_.cache = null;

	var supportsCustomControls_ = function() {
		if (supportsCustomControls_.cache === null) {
			supportsCustomControls_.cache = navigator.userAgent.search(res.customControlQuery) === -1;
		}
	
		return supportsCustomControls_.cache;
	}
	supportsCustomControls_.cache = null;

	var init_ = function(params) {
		initVideo_.call(this, params);
		
		initControls_.call(this, params);

		this.videoContainer.append(this.controls);
	
		this.element.empty();
		this.element.append(this.videoContainer);
	}

	var initVideo_ = function(params) {
		this.videoContainer = $(res.divElement).css({
			width: params.width,
			height: params.height,
			position: 'relative'
		}).addClass(res.videoContainerClass);
	
		var ele = this.video = $(res.videoElement).attr(params).addClass(res.videoClass);
		this.videoElement = this.video.get(0);
	
		if (supportsCustomControls_() && params.poster && !params.autoplay) {
			var play = $(res.divElement).addClass(res.videoPosterPlayClass);
			ele = this.posterImage = $(res.divElement).css({
				width: params.width,
				height: params.height,
				background: "transparent url(" + params.poster + ") no-repeat",
				cursor: "pointer",
				position: "relative"
			}).click((function(player) {
				return function() {
					$(this).replaceWith(player.video);
					if (player.hasControls) player.controls.css("visibility", "visible");
					player.play();
				}
			})(this)).addClass(res.videoPosterClass).append(play);
		}
	
		this.videoContainer.append(ele);
	}

	var initControls_ = function(params) {
		this.hasControls = supportsCustomControls_() && (this.controls = this.element.find(res.videoControlsSelector)).size() > 0;
	
		if (this.hasControls) {
			this.controls.remove();
		
			if (this.posterImage) this.controls.css("visibility", "hidden");
		
			this.video.attr("controls", null);
		
			this.playButton = this.controls.find(res.videoControlsPlayButtonSelector);
			this.gutter = this.controls.find(res.videoControlsGutterSelector);
			this.playhead = this.controls.find(res.videoControlsPlayheadSelector);
			this.progress = this.controls.find(res.videoControlsProgressSelector);
		
			this.playhead.css("width", 1);
	
			this.video.bind("timeupdate", $.proxy(updatePercentComplete_, this));
			this.video.bind("progress", $.proxy(updatePercentLoaded_, this));
	
			this.video.bind("play", $.proxy(displayPlaying_, this));
			this.video.bind("pause", $.proxy(displayPaused_, this));
			this.video.bind("ended", $.proxy(displayPaused_, this));
			
			this.playButton.click($.proxy(this.togglePlay, this));
		} else {
			this.update = new Function();
		}
	}

	var displayPlaying_ = function() {
		this.element.addClass(res.playingClass);
	}

	var displayPaused_ = function() {
		this.element.removeClass(res.playingClass);
	}	

	var updatePercentComplete_ = function() {
		this.percentComplete = (this.videoElement.currentTime * 100 / this.videoElement.duration) / 100;
		this.update();
	}

	var updatePercentLoaded_ = function() {
		this.percentLoaded = (this.videoElement.buffered.end() * 100 / this.videoElement.duration) / 100;
		this.update();
	}

	VideoPlayer.prototype.update = function() {
		this.playhead.css("width", this.gutter.width() * this.percentComplete);
		this.progress.css("width", this.gutter.width() * this.percentLoaded);
	}

	VideoPlayer.prototype.togglePlay = function() {
		if (this.element.hasClass(res.playingClass)) this.pause();
		else this.play();
	}

	VideoPlayer.prototype.play = function() {
		this.videoElement.play();
	}

	VideoPlayer.prototype.pause = function() {
		this.videoElement.pause();
	}
		$.h264 = {
		version: res.version
	}
	
	$.fn.h264HTML5_ = function(params, flparams, callbacks) {
		var obj = VideoPlayer(this, params)

		if ($.isFunction(callbacks.success)) callbacks.success(this);
		
		return { isHTML5: true, player: obj };
	};
	
	$.fn.h264Flash_ = function(params, flparams, callbacks) {
		var failed = false;
		var flashvars = flparams.flashvars;
		flparams.flashvars = null;
		
		flparams = $.extend({
			onFail: function() { failed = true; }
		}, flparams);
		
		var obj = this.flashembed(flparams, flashvars);

		if (failed && $.isFunction(callbacks.failure)) callbacks.failure(this);
		if (!failed && $.isFunction(callbacks.success)) callbacks.success(this);
		
		return { isHTML5: false, player: obj };
	};
	
	if (useVideoTag_()) $.fn.h264_ = $.fn.h264HTML5_;
    else $.fn.h264_ = $.fn.h264Flash_;
	
	$.fn.h264 = function(params, flparams, callbacks) {
		if (!$.isPlainObject(params)) params = { src: params };
		if (!$.isPlainObject(callbacks)) callbacks = { complete: callbacks };
		
		params = $.extend(def.params, params);
		
		flparams = $.extend(def.flparams, {
			width: params.width,
			height: params.height
		}, flparams);
		
		callbacks = $.extend(def.callbacks, callbacks);
		
		var obj = this.h264_(params, flparams, callbacks);
		
		if ($.isFunction(callbacks.complete)) callbacks.complete(this);
		
		return obj;
	};
})(jQuery);