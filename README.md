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
Options to configure in the script file:
```
noTitle: fallback text for cases where the title attribute is empty (string)
noArtist: fallback text for cases where the artist attribute is empty (string)
seekOffset: amount of time to skip forward and backward (seconds)
baseHeight: height of the player (pixels as int)
noArtworkBreakpoint: width at which to hide the artwork (container width in pixels as int)
noDurationBreakpoint: width at which to hide the duration (container width in pixels as int)
noPercentBreakpoint: width at which to hide the timestamp and seek control UI (container width in pixels as int)
noSkipBreakpoint: width at which to hide the skip forward and back buttons (container width in pixels as int)
```
CSS variables you can set in your own stylesheet:
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

## Notes
- Currently supports only one audio track at a time.
- Currently only supports a single codec per track so MP3 is recommended.
