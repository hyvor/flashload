# flashload
FlashLoad converts separate HTML pages into a single-page application and makes loading faster by cheating.


### InstantClick vs Flashload

Flashload is greatly inspired from InstantClick. There is a few differences between InstantClick and Flashload.

* InstantClick loads the same content over and over if the user hovers in, out, and in again. Flashload fetches content only one time.
* FlashLoad is more lightweight than InstantClick (mostly because InstantClick has "browser-specific" code old devides and browsers).
* InstantClick supports loading on "mouseclick", but Flashload does not. It is designed for preloading on "mouseover".
* In InstantClick, you have to change HTML and add `data-no-instant` to exclude an link from preloading. In Flashload, you manage these settings in the `init()` call config using Javascript.