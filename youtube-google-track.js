/**
 *
 * Builds a Youtube IFrame with API controls which also sends viewing data to Google Analytics at
 * Start, pause, scrubbing, 25%, 50%, 75%, and finished.
 *
 * @author      Andrew J McCauley <mccauley.andrew@marshfieldclinic.org>
 * @version     1.0
 * @method
 * @param {string} - YouTube video ID
 * @param {object} - Default parameter overrides
 *
 */

// Self-Executing Anonymous Function (hide scope)
// Full documentation for the YouTube IFrame Player API located at https://developers.google.com/youtube/iframe_api_reference
(function($){

    // Set percentage viewed values to 0, they change to 1 once that percentage has been viewed
    var percentageHasBeenViewed = [0, 0, 0, 0];

    // Map the YouTube API codes to the various player states. These are used for Google Event reporting
    var playerStates = {
        '-1': 'unstarted',
        '0': 'ended',
        '1': 'playing',
        '2': 'paused',
        '3': 'buffering',
        '5': 'video cued'
    };

    function YoutubeVideo(){
        this.id = null;
        // setting the player defaults to match the most common use case
        // DO NOT CHANGE PLAYER SETTINGS HERE.
        // Pass changes into the "options" object when initializing
        this._defaults = {
            height: 390,
            width: 640,

            // This parameter specifies whether the initial video will automatically
            // start to play when the player loads. Supported values are 0 or 1. The default value is 0.
            autoplay: 0,

            // Setting the parameter's value to 1 causes closed captions to be shown
            // by default, even if the user has turned captions off.
            // The default behavior is based on user preference.
            cc_load_policy: 0,

            // This parameter specifies the color that will be used in the player's
            // video progress bar to highlight the amount of the video that the viewer
            // has already seen. Valid parameter values are red and white, and, by default,
            // the player uses the color red in the video progress bar. See the YouTube
            // API blog for more information about color options.
            // Note: Setting the color parameter to white will disable the modestbranding option.
            color: 'red',

            // This parameter indicates whether the video player controls are displayed
            controls: 1,

            // Setting the parameter's value to 1 causes the player to not respond to keyboard controls.
            // The default value is 0, which means that keyboard controls are enabled.
            disablekb: 0,

            // Setting the parameter's value to 1 enables the player to be controlled via
            // IFrame or JavaScript Player API calls. The default value is 0, which means that
            // the player cannot be controlled using those APIs.
            enablejsapi: 1,

            // This parameter specifies the time, measured in seconds from the start of
            // the video, when the player should stop playing the video. The parameter value
            // is a positive integer.
            end: null,

            //Setting this parameter to 0 prevents the fullscreen button from displaying
            // in the player. The default value is 1, which causes the fullscreen button to display.
            fs: 1,

            // Setting the parameter's value to 1 causes video annotations to be shown by default,
            // whereas setting to 3 causes video annotations to not be shown by default.
            // The default value is 1.
            iv_load_policy: 1,

            // The list parameter, in conjunction with the listType parameter,
            // identifies the content that will load in the player.
            list: null,

            // The listType parameter, in conjunction with the list parameter, identifies
            // the content that will load in the player. Valid parameter values are playlist,
            // search, and user_uploads.
            listType: null,

            // In the case of a single video player, a setting of 1 causes the player to play
            // the initial video again and again. In the case of a playlist player (or custom player),
            // the player plays the entire playlist and then starts again at the first video.
            loop: 0,

            // This parameter lets you use a YouTube player that does not show a YouTube logo.
            // Set the parameter value to 1 to prevent the YouTube logo from displaying in the control bar.
            // Note that a small YouTube text label will still display in the upper-right corner of a
            // paused video when the user's mouse pointer hovers over the player.
            modestbranding: 1,

            // This parameter provides an extra security measure for the IFrame API and is only
            // supported for IFrame embeds. If you are using the IFrame API, which means you are
            // setting the enablejsapi parameter value to 1, you should always specify your domain
            // as the origin parameter value.
            origin: null,

            // This parameter specifies a comma-separated list of video IDs to play.
            // If you specify a value, the first video that plays will be the VIDEO_ID specified
            // in the URL path, and the videos specified in the playlist parameter will play thereafter.
            playlist: null,

            // This parameter controls whether videos play inline or fullscreen in an HTML5 player on iOS.
            playsinline: null,

            // This parameter indicates whether the player should show related videos when playback of
            // the initial video ends. Supported values are 0 and 1. The default value is 1.
            rel: 0,

            // Setting the parameter's value to 0 causes the player to not display information like
            // the video title and uploader before the video starts playing.
            showinfo: 1,

            // This parameter causes the player to begin playing the video at the given number of
            // seconds from the start of the video. The parameter value is a positive integer.
            // Note that similar to the seekTo function, the player will look for the closest keyframe
            // to the time you specify. This means that sometimes the play head may seek to just before
            // the requested time, usually no more than around two seconds.
            start: null,

            // This parameter identifies the URL where the player is embedded. This value is used in
            // YouTube Analytics reporting when the YouTube player is embedded in a widget, and that
            // widget is then embedded in a web page or application. In that scenario, the origin parameter
            // identifies the widget provider's domain, but YouTube Analytics should not identify the widget
            // provider as the actual traffic source. Instead, YouTube Analytics uses the widget_referrer
            // parameter value to identify the domain associated with the traffic source.
            widget_referrer: null
        };
        this.init = function(videoId){

            var stated = this;

            // loads YouTube API script on to the page
            stated.loadApiScript();

            // YouTube API automatically fires onYouTubeIframeAPIReady() when it has completed loading
            window.onYouTubeIframeAPIReady = function() {
                stated.makePlayer(videoId);
            }
        };

        // Writes the youtube api script to the page dynamically so there
        // is no need to add the script manually to the document
        this.loadApiScript = function(){
            var tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            var firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        };

        // This function builds the iframe, it is only called after the API script is fully loaded
        this.makePlayer = function (videoId) {

            var obj = this;
            var staticElement = document.getElementById(obj.id);

            // Loading default settings from above
            player = new YT.Player(staticElement, {
                height: this._defaults.height,
                width: this._defaults.width,
                videoId: videoId,
                playerVars: {
                    autoplay: this._defaults.autoplay,
                    cc_load_policy: this._defaults.cc_load_policy,
                    color: this._defaults.color,
                    controls: this._defaults.controls,
                    disablekb: this._defaults.disablekb,
                    enablejsapi: this._defaults.enablejsapi,
                    end: this._defaults.end,
                    fs: this._defaults.fs,
                    iv_load_policy: this._defaults.iv_load_policy,
                    list: this._defaults.list,
                    listType: this._defaults.listType,
                    loop: this._defaults.loop,
                    modestbranding: this._defaults.modestbranding,
                    origin: this._defaults.origin,
                    playlist: this._defaults.playlist,
                    playsinline: this._defaults.playsinline,
                    rel: this._defaults.rel,
                    showinfo: this._defaults.showinfo,
                    start: this._defaults.start,
                    widget_referrer: this._defaults.widget_referrer
                },
                events: {

                    // this fires once the player has completely loaded
                    'onReady': this.onPlayerReady,

                    // this fires when video is loaded, ended, playing, paused, buffering, or cued
                    'onStateChange': this.onPlayerStateChange
                }
            });
        };

        // You must cast the Youtube Video object to a variable to use this.
        // EX:  var YoutubeVideo = $('#player').youtubeVideo('youtube-id-here');
        // EX: YoutubeVideo.changeVideo('other-youtube-id');
        this.changeVideo = function(videoId){
            percentageHasBeenViewed = [0, 0, 0, 0];
            player.loadVideoById(videoId);
        };

        this.onPlayerReady = function(){

        };

        this.onPlayerStateChange = function(){
            if (typeof ga === 'function') {
                ga('send', 'event', 'video', playerStates[player.getPlayerState().toString()], player.getVideoData().title);
            }
            if(playerStates[player.getPlayerState().toString()] === 'playing'){
                var checkVideoTime = setInterval(function(){
                    var currentTime = player.getCurrentTime();
                    var videoDuration = player.getDuration();
                    var percentComplete = parseFloat((currentTime / videoDuration) * 100);
                    if(percentComplete > 25 && percentageHasBeenViewed[0] === 0){
                        percentageHasBeenViewed[0] = 1;
                        if (typeof ga === 'function') {
                            ga('send', 'event', 'video', 'watch', player.getVideoData().title, 25);
                        }
                    }
                    if(percentComplete > 50 && percentageHasBeenViewed[1] === 0){
                        percentageHasBeenViewed[1] = 1;
                        if (typeof ga === 'function') {
                            ga('send', 'event', 'video', 'watch', player.getVideoData().title, 50);
                        }
                    }
                    if(percentComplete > 75 && percentageHasBeenViewed[2] === 0){
                        percentageHasBeenViewed[2] = 1;
                        if (typeof ga === 'function') {
                            ga('send', 'event', 'video', 'watch', player.getVideoData().title, 75);
                        }
                    }
                    if(percentComplete > 99 && percentageHasBeenViewed[3] === 0){
                        percentageHasBeenViewed[3] = 1;
                        if (typeof ga === 'function') {
                            ga('send', 'event', 'video', 'watch', player.getVideoData().title, 100);
                        }
                    }
                }, 100)
            }
            if(playerStates[player.getPlayerState().toString()] === 'ended'){
                clearInterval(checkVideoTime)
            }
        }
    }

    $.fn.youtubeVideo = function(videoId, options, callback) {
        $.youtubeVideo = new YoutubeVideo();
        $.youtubeVideo.instance = $(this);
        $.youtubeVideo.id = $(this).attr("id");
        $.youtubeVideo.callback = callback;
        for(prop in options){
            $.youtubeVideo._defaults[prop] = options[prop];
        }
        if($(this).html() !== null) {
            setTimeout(function () {
                $.youtubeVideo.init(videoId);
            }, 250);

        }
        return $.youtubeVideo;
    };
})(jQuery);
