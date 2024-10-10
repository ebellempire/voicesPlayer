# About
A custom audio player web component with support for MediaSession API, custom artwork, skip ahead/back, seek, etc. Features expand and contract based on available space.

## Basic Usage
Include the script on your page and use the `<voices-player>` element as follows:
```
<voices-player
  track-src="path/to/audio/file"
  track-title="title text"
  track-artist="artist text"
  track-album="album text"
  track-artwork="path/to/image/file"
></voices-player>
```
## External scripting
Control external playback using the `voicesPlayerSeconds` event.
```
let seconds = 0; // time in seconds
let event = new CustomEvent("voicesPlayerSeconds", { detail: seconds});
audio.dispatchEvent(event);
```
## Customization
Some configurations may be passed as option attributes:
```
<voices-player 
  ...
  option-breakpoints="440,300,250,200,100"
  option-base-height="40"
  option-seek-offset="30"
></voices-player>
```
Some CSS variables you can set in your own stylesheet:
```
--player-font-family
--player-font-size
--player-text-color
--player-text-shadow
--player-background-color
--player-background-image
--player-padding
--player-border-radius
--player-base-height
--player-artwork-size
--player-artwork-background
--player-button-size
--player-button-background
--player-button-background_hover
--player-button-text
--player-button-text-hover
--player-button-border-radius
--player-progress-background
--player-progress-color
--player-timestamp-color
--player-timestamp-background
```
If you need more customization than this allows, you should probably create a fork.
## Notes
- Currently supports only one audio track at a time.
- Currently only supports a single codec per track so MP3 is recommended.
