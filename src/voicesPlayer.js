/* ===
VoicesPlayer
Author: Erin Bell
Copyright: 2024 Center for Public History + Digital Humanities at Cleveland State University
License: GPL
=== */
class VoicesPlayer extends HTMLElement {
	constructor(){
		super();
		// options
		this.options = {
			noTitle: document.title,
			noArtist: window.location.hostname,
			seekOffset: 30, // seconds
			baseHeight: 45, // pixels (not incl. padding)
			noArtworkBreakpoint: 420, // pixels (@container width)
			noDurationBreakpoint: 250, // pixels (@container width)
			noPercentBreakpoint: 200, // pixels (@container width)
			noSkipBreakpoint: 100, // pixels (@container width)
		};
		// properties
		this.labels = {
			play: 'Play',
			pause: 'Pause',
			skipforward: 'Skip ahead ' + this.options.seekOffset + ' seconds',
			skipbackward: 'Skip back ' + this.options.seekOffset + ' seconds',
		}
		this.info = {
			time: 0,
			rate: 1,
			volume: 1,
			percent: '0%',
			state: 'stop',
			duration: 0,
			overHour: false,
		}
		this.controls = {
			ui_container: null,
			ui_time: null,
			ui_duration: null,
			ui_percent: null,
			ui_rate: null,
			ui_volume: null,
			ui_playpause: null,
			ui_skipforward: null,
			ui_skipbackward: null,
			ui_artwork: null,
			ui_icons: {
				play: null,
				pause: null,
				skip_forward: null,
				skip_back: null,
			}
		}
		// the audio track
		this.track = null;
		// shadow dom
		this.shadow = this.attachShadow({ mode: "open" });
	}
	connectedCallback(){
		this.getAttributes();
		this.styleSheet();
		this.audioElement();
		this.addEventListener('voicesPlayerSeconds', (e)=>{
			if( Number.isInteger( parseInt(e.detail) ) )
				this.skipTo(e.detail);
		});
	}
	disconnectedCallback(){}
	iconSvg(_iconName){
		if(!_iconName) return null;
		let icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		icon.setAttribute("viewBox", "0 0 512 512");
		if(_iconName == 'play'){
			icon.innerHTML = `<path style="fill:currentColor;" d="M81.2,508.5l420.8-252.5L81.2,3.5v505Z"/>`;
		}
		if(_iconName == 'pause'){
			icon.innerHTML = `<path style="fill:currentColor;" d="M210.1,508.5h-114.8V3.5h114.8v505ZM416.7,508.5h-114.8V3.5h114.8v505Z"/>`;
		}
		if(_iconName == 'skip_forward' || _iconName == 'skip_back'){
			icon.innerHTML = `<path style="fill: none;stroke: currentColor;stroke-linecap: square;stroke-miterlimit: 10;stroke-width: 37.4px;" d="M331.2,132.3s28.6-13.9-75.2-13.9-188,83.1-188,185.5,84.2,185.5,188,185.5,188-83.1,188-185.5"/><path style="fill:currentColor;" d="M256,30.3l94,92.8-94,92.8"/>`;
		}
		return icon.outerHTML;
	}
	styleSheet(){
		const css = new CSSStyleSheet();
		css.replaceSync(`
		:host{
			--player-font-family: monospace;
			--player-font-size: 11px;
			--player-text-color: #eaeaea;
			--player-text-shadow: 1px 1px 1px rgba(0,0,0,.25);
			--player-background-color: #000;
			--player-background-image: linear-gradient(to bottom right, transparent, #222);
			--player-padding: 4px;
			--player-border-radius: 7px;
			--player-base-height: ${this.options.baseHeight}px;
			--player-artwork-size: var(--player-base-height);
			--player-artwork-background: #333;
			--player-button-size: 40px;
			--player-button-background: transparent;
			--player-button-background-hover: transparent;
			--player-button-text: #f2f2f2;
			--player-button-text-hover: #a2a2a2;
			--player-button-border-radius: 0;
			--player-progress-background: #444;
			--player-progress-color: #a2a2a2;
			--player-timestamp-color: var(--player-text-color);
			--player-timestamp-background: rgba(0,0,0,.5);
			
			container-type: inline-size;
			container-name: player;
			display: block;
			overflow: hidden;
			font-size: var(--player-font-size);
			font-family: var(--player-font-family);
			text-shadow: var(--player-text-shadow);
			background-color: var(--player-background-color);
			background-image: var(--player-background-image);
			color: var(--player-text-color);
			padding: var(--player-padding);
			border-radius: var(--player-border-radius);
			height: var(--player-base-height);
			min-width: calc(var(--player-button-size) * 1.5);
		}
		#player-inner{
			display: flex;
			flex-direction: row;
			align-items: center;
			width: 100%;
			min-height: var(--player-base-height);
		}
		#player-artwork{
			height: var(--player-artwork-size);
			width: var(--player-artwork-size);
			object-fit: cover;
			background: var(--player-artwork-background);
			margin-right: var(--player-padding);
			border-radius: clamp( 
				calc( var(--player-border-radius) / 2 ),
				calc( var(--player-border-radius) - var(--player-padding) ),
				var(--player-border-radius)
			);
		}
		@container player (max-width: ${this.options.noArtworkBreakpoint}px){
			#player-artwork{
				display: none;
			}
		}
		button{
			transition: all .15s linear;
			color: var(--player-button-text);
			background: var(--player-button-background);
			border-radius: var(--player-button-border-radius);
			border: 0 none transparent;
			flex-shrink: 0;
			cursor: pointer;
			overflow: hidden;
		}
		button:hover{
			color: var(--player-button-text-hover);
			background: var(--player-button-background-hover);
		}
		button svg{
			display: block;
			height: 100%;
			width: 100%;
			object-fit: fill;
		}
		#player-play-pause{
			height: calc(var(--player-button-size) * 0.85);
			width: calc(var(--player-button-size) * 0.85);
		}
		#player-skip-forward,
		#player-skip-backward{
			width: calc(var(--player-base-height) * 0.65);
			height: calc(var(--player-base-height) * 0.65);
		}
		#player-skip-backward{
			transform: scale(-1, 1);
		}
		@container player (max-width: ${this.options.noArtworkBreakpoint}px){
			#player-play-pause{
				width: calc(var(--player-base-height) * 0.95);
				height: calc(var(--player-base-height) * 0.95);
				padding: 6px;
			}
			#player-skip-forward,
			#player-skip-backward{
				width: calc(var(--player-base-height) * 0.85);
				height: calc(var(--player-base-height) * 0.85);
				padding: 8px;
			}
		}
		@container player (max-width: ${this.options.noSkipBreakpoint}px){
			#player-skip-forward,
			#player-skip-backward{
				display: none;
			}
		}
		#player-time,
		#player-duration{
			background: var(--player-timestamp-background);
			color: var(--player-timestamp-color);
			padding: 0 var(--player-padding);
			margin: calc( var(--player-padding) / 2 );
			border-radius: clamp( 
				calc( var(--player-border-radius) / 2 ),
				calc( var(--player-border-radius) - var(--player-padding) ),
				var(--player-border-radius)
			);
		}
		@container player (max-width: ${this.options.noDurationBreakpoint}px){
			#player-duration{
				display:none;
			}
		}
		#player-percent{
			--data-percent: 0%;
			margin-left: var(--player-padding);
			height: var(--player-base-height);
			border-radius: clamp( 
				calc( var(--player-border-radius) / 2 ),
				calc( var(--player-border-radius) - var(--player-padding) ),
				var(--player-border-radius)
			);
			flex-grow:1;
			display: flex;
			flex-direction: row;
			justify-content: space-between;
			align-items: flex-end;
			background-color: var(--player-progress-background);
			background-image: linear-gradient(to right, var(--player-progress-color) 0 var(--data-percent), transparent var(--data-percent) 100%);
		}
		@container player (max-width: ${this.options.noPercentBreakpoint}px){
			#player-percent{
				display: none;
			}
			#player-inner{
				justify-content: center;
			}
		}
		#player-volume,
		#player-rate{
			/* @todo */
			display: none;
		}
		`);
		this.shadow.adoptedStyleSheets = [css];
	}
	getAttributes(){
		this.trackSrc = this.hasAttribute("track-src") ? this.getAttribute("track-src") : null;
		this.trackTitle = this.hasAttribute("track-title") ? this.getAttribute("track-title") : this.options.noTitle;
		this.trackArtist = this.hasAttribute("track-artist") ? this.getAttribute("track-artist") : this.options.noArtist;
		this.trackAlbum = this.hasAttribute("track-album") ? this.getAttribute("track-album") : null;
		this.trackArtworkSrc = this.hasAttribute("track-artwork-src") ? this.getAttribute("track-artwork-src") : null;
	}
	hhmmss(_time_s){
		let seconds = Math.floor(_time_s);
		let minutes = Math.floor(seconds / 60);
		let hours = Math.floor(minutes / 60);
		seconds = seconds % 60;
		minutes = minutes % 60;
		hours = hours % 24;
		return ((this.info.overHour) ? hours.toString().padStart(2, '0')+':' : '')+
			minutes.toString().padStart(2, '0')+':'+
			seconds.toString().padStart(2, '0');
	}
	updatePlayerState(){
		this.controls.ui_time.innerText = this.hhmmss(this.info.time, this.info.overHour);
		this.controls.ui_percent.style.setProperty('--data-percent', this.info.percent); 
		this.controls.ui_rate.innerText = this.info.rate; 
		this.controls.ui_volume.innerText = this.info.volume; 
	}
	updateSessionState(){
		if ("mediaSession" in navigator){
			if ('setPositionState' in navigator.mediaSession) {
				navigator.mediaSession.setPositionState({
					duration: this.info.duration,
					playbackRate: this.track.playbackRate,
					position: this.track.currentTime,
				});
			}
		}
	}
	playTrack(){
		this.controls.ui_playpause.innerHTML = this.iconSvg('pause');
		this.controls.ui_playpause.ariaLabel = this.labels.pause;
		this.track.play();
	}
	pauseTrack(){
		this.controls.ui_playpause.innerHTML = this.iconSvg('play');
		this.controls.ui_playpause.ariaLabel = this.labels.play;
		this.track.pause();
	}
	skipTo(_seconds){
		this.info.percent = (_seconds / this.info.duration * 100)+'%';
		this.info.time = _seconds;
		this.track.currentTime = this.info.duration * (_seconds / this.info.duration);
		if(this.info.state !== 'playing'){
			this.playTrack();
		}
	}
	seekTo(_event){
		let rect = _event.target.getBoundingClientRect();
		let total = rect.width;
		let x = _event.clientX - rect.left;
		this.info.percent = (x / total * 100)+'%';
		let pos = this.info.duration * (x / total);
		this.track.currentTime = pos;
		this.updateSessionState();
	}
	skipForward(){
		this.track.currentTime = Math.min(this.track.currentTime + this.options.seekOffset, this.info.duration);
		this.updateSessionState();
	}
	skipBack(){
		this.track.currentTime = Math.max(this.track.currentTime - this.options.seekOffset, 0);
		this.updateSessionState();
	}
	uiArtwork(){
		this.controls.ui_artwork = document.createElement("img");
		this.controls.ui_artwork.id = 'player-artwork';
		this.controls.ui_artwork.src = this.trackArtworkSrc;
		this.controls.ui_artwork.width = this.options.baseHeight;
		this.controls.ui_artwork.height = this.options.baseHeight;
		this.controls.ui_artwork.loading = 'lazy';
		this.controls.ui_container.appendChild(this.controls.ui_artwork);
	}
	uiSkipBack(){
		this.controls.ui_skipbackward = document.createElement("button");
		this.controls.ui_skipbackward.id = 'player-skip-backward';
		this.controls.ui_skipbackward.ariaLabel = this.labels.skipbackward;
		this.controls.ui_skipbackward.tabIndex = 0;
		this.controls.ui_skipbackward.innerHTML = this.iconSvg('skip_back');
		this.controls.ui_skipbackward.addEventListener('click',()=>{
			this.skipBack();
		});
		this.controls.ui_container.appendChild(this.controls.ui_skipbackward);
	}
	uiPlayPause(){
		this.controls.ui_playpause = document.createElement("button");
		this.controls.ui_playpause.id = 'player-play-pause';
		this.controls.ui_playpause.ariaLabel = this.labels.play;
		this.controls.ui_playpause.tabIndex = 0;
		this.controls.ui_playpause.innerHTML = this.iconSvg('play');
		this.controls.ui_playpause.addEventListener('click',()=>{
			if(this.info.state !== 'playing'){
				this.playTrack();
			}
			if(this.info.state === 'playing'){
				this.pauseTrack();
			}
		});
		this.controls.ui_container.appendChild(this.controls.ui_playpause);
	}
	uiSkipForward(){
		this.controls.ui_skipforward = document.createElement("button");
		this.controls.ui_skipforward.id = 'player-skip-forward';
		this.controls.ui_skipforward.ariaLabel = this.labels.skipforward;
		this.controls.ui_skipforward.tabIndex = 0;
		this.controls.ui_skipforward.innerHTML = this.iconSvg('skip_forward');
		this.controls.ui_skipforward.addEventListener('click',()=>{
			this.skipForward();
		});
		this.controls.ui_container.appendChild(this.controls.ui_skipforward);
	}
	uiSeekProgress(){
		this.controls.ui_percent = document.createElement("span");
		this.controls.ui_percent.id = 'player-percent';
		this.controls.ui_percent.style.setProperty('--data-percent', this.info.percent); 
		this.controls.ui_percent.addEventListener('click',(e)=>{
			this.seekTo(e);
		});
		this.controls.ui_container.appendChild(this.controls.ui_percent);
		this.uiTime();
		this.uiDuration()
	}
	uiTime(){
		this.controls.ui_time = document.createElement("span");
		this.controls.ui_time.id = 'player-time';
		this.controls.ui_time.textContent = this.hhmmss(this.info.time);
		this.controls.ui_percent.appendChild(this.controls.ui_time);
	}
	uiDuration(){
		this.controls.ui_duration = document.createElement("span");
		this.controls.ui_duration.id = 'player-duration';
		this.controls.ui_duration.textContent = this.hhmmss(this.info.duration);
		this.controls.ui_percent.appendChild(this.controls.ui_duration);
	}
	uiRate(){
		this.controls.ui_rate = document.createElement("span");
		this.controls.ui_rate.id = 'player-rate';
		this.controls.ui_rate.textContent = this.info.rate;
		this.controls.ui_rate.addEventListener('click',(e)=>{
			console.log('@todo: rate controls', e)
		});
		this.controls.ui_container.appendChild(this.controls.ui_rate);
	}
	uiVolume(){
		this.controls.ui_volume = document.createElement("span");
		this.controls.ui_volume.id = 'player-volume';
		this.controls.ui_volume.textContent = this.info.volume;
		this.controls.ui_volume.addEventListener('click',(e)=>{
			console.log('@todo: volume controls', e)
		});
		this.controls.ui_container.appendChild(this.controls.ui_volume);
	}
	uiElements(){
		if(this.trackSrc){
			this.controls.ui_container = document.createElement("div");
			this.controls.ui_container.id = 'player-inner';
			if(this.trackArtworkSrc){
				this.uiArtwork();
			}
			this.uiSkipBack();
			this.uiPlayPause();
			this.uiSkipForward();
			this.uiSeekProgress();
			this.uiRate();
			this.uiVolume();
			this.shadow.appendChild(this.controls.ui_container);
		}
	}
	audioElement(){
		if(this.trackSrc){
			this.track = new Audio(this.trackSrc);
			this.track.addEventListener("loadedmetadata", () => {
				this.info.duration = this.track.duration;
				this.info.overHour = Boolean(this.track.duration >= 3600);
				this.uiElements();
				// media session
				if ("mediaSession" in navigator) {
					navigator.mediaSession.metadata = new MediaMetadata({
						title: this.trackTitle,
						artist: this.trackArtist,
						album: this.trackAlbum,
						artwork: [{
							src: this.trackArtworkSrc
						}]
					});
					navigator.mediaSession.setActionHandler('play', async () => {
						await this.track.play();
						this.updateSessionState();
					});
					navigator.mediaSession.setActionHandler('pause', () => {
						this.track.pause();
						this.updateSessionState();
					});
					navigator.mediaSession.setActionHandler('stop', () => {
						this.track.pause();
						this.track.currentTime = 0;
						this.info.state = 'stop';
						this.info.time = 0;
						this.info.rate = 1;
						this.info.volume = 1;
						this.info.percent = 0;
						this.updateSessionState();
					});
					navigator.mediaSession.setActionHandler('seekbackward', (details) => {
						const skipTime = details.seekOffset || this.options.seekOffset;
						this.track.currentTime = Math.max(this.track.currentTime - skipTime, 0);
						this.updateSessionState();
					});
					navigator.mediaSession.setActionHandler('seekforward', (details) => {
						const skipTime = details.seekOffset || this.options.seekOffset;
						this.track.currentTime = Math.min(this.track.currentTime + skipTime, this.track.duration);
						this.updateSessionState();
					});
					navigator.mediaSession.setActionHandler('seekto', (details) => {
						this.track.currentTime = details.seekTime;
						this.updateSessionState();
					});
					navigator.mediaSession.setActionHandler('nexttrack', null);
					navigator.mediaSession.setActionHandler('previoustrack', null);
				}
				// player events
				this.track.ontimeupdate = (e) =>{
					this.info.time = e.target.currentTime;
					this.info.percent = Math.min(100, Math.max(0, (parseFloat(this.info.time/this.info.duration) * 100)))+'%'; // 0-100%
					this.updatePlayerState();
				};
				this.track.onplay = (e) => {
					this.info.state = 'playing';
					if ("mediaSession" in navigator){
						navigator.mediaSession.playbackState = 'playing';
					}
				};
				this.track.onpause = (e) => {
					this.info.state = 'paused';
					if ("mediaSession" in navigator){
						navigator.mediaSession.playbackState = 'paused';
					}
				};
				this.track.onratechange = (e) => {
					this.info.rate = this.track.playbackRate;
					this.updatePlayerState();
					if ("mediaSession" in navigator) {
						navigator.mediaSession.playbackRate = this.info.rate;
					}
				};
				this.track.onvolumechange = (e) => {
					this.info.volume = this.track.volume;
					this.updatePlayerState();
				};
				this.track.onended = (e) => {
					this.info.state = 'stop';
					if ("mediaSession" in navigator){
						navigator.mediaSession.playbackState = 'none';
						navigator.mediaSession.setPositionState(null);
					}
				};
				this.track.onerror = (e) => {
					console.log(e);
				};
			});
		}
	}
}
// register component
customElements.define('voices-player', VoicesPlayer);