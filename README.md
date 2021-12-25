# FlashLoad

FlashLoad converts separate HTML pages into a single-page application and makes navigation faster by preloading pages on mouseover

This library is heavily inspired by [InstantClick](https://instantclick.io), but more lightweight and has more configuration options.

Add FlashLoad to your website.
```
<script src="flashload.js"></script>
<script data-flashload-skip-preloading>
    FlashLoad.start()
</script>
```

## Story

We wanted to make [Hyvor Blogs](https://blogs.hyvor.com) as fast as possible. We understood that, one overlooked way was preloading content before the user clicks on a link. In most cases, it takes 150ms+ from "hover" to "click" (Test it yourself using [this tool](http://instantclick.io/click-test) at InstantClick). It takes even more time when you are just freely navigating. Also, seeing how fast navigation is in [Gatsby](https://www.gatsbyjs.com/) and [Forem](https://www.forem.com/) (or dev.to), we wanted to implement something like that.

How Gatsby do it is a different story. But, dev.to worked in a similar way like what we wanted: send a XHR (Ajax) request when the user loads (so we eliminate that "hover...click" delay) and fetch the complete HTML pages. For fast connections, pages usually display instantly after the click.

We first used InstantClick, which is the same library Forem uses. However, we wanted implement caching to fetched content to reduce bandwidth and wanted to add some options like delayed progress bar. Another reason to re-write the library was that InstantClick had not been maintained since 2017 (We will be maintaining this library as long as we run Hyvor Blogs)

### Config

You can define configuration in an object in the `FlashLoad.start()` function.

(The following are the defaults)
```
FlashLoad.start({
    bar: true,
    barDelay: 2000
    basepath: "",
    exclude: [],
})
```

* **bar** - progress bar
* **barDelay** - 
* **basepath** - Only match URLs starting with this basepath. Do not add the domain, just the path (FlashLoad only works on a single domain). For example, if only paths that start with `/blog` should be preloaded, add `basepath: "blog"`. Don't worry about leading and trailing slashes!
* **exclude** - A function to conditionally exclude URLs.
    ```
    exclude: function(linkElement) {
        // linkElement - the clicked/hovered <a> element
        if (linkElement.pathname.match(/^\/app.*/))
            return true;
        return false;
    }
    ```
### Events
Flashload triggers 4 events.

1. `flashload:preloadStarted`
    User hovered on a preloadable link. Preloading started
2. `flashload:preloadEnded`
    Preloading successful
3. `flashload:navigationStarted`
    User clicked on a link. Navigation started.
4. `flashload:navigationEnded`
    New page displayed (URL, title, and body updated).


### `data-flashload-skip-preloading`

```
<div data-flashload-skip-preloading></div>
<a data-flashload-skip-preloading></a>
```

When `data-flashload-skip-preloading` is added to any element, that element and all children inside it will be "blacklisted" from preloading. So, all links inside that element will be "skipped" by FlashLoad and will be handled by the browser as usual.


### `data-flashload-skip-replacing` Attribute

```
<script data-flashload-skip-replacing></script>
```

`data-flashload-skip-replacing` attribute can only be used in `<script>` elements. When used, that script will only be executed on the first load. For example, if you have not noticed, the `<script>` element that wraps the `FlashLoad()` intial function has this attribute. It is because, `FlashLoad.start()` sets event listeners on the `document` element. These events should only be added once.

> Under the hood, FlashLoad fetches HTML pages via AJAX and replaces the content of the body. However, browsers do not run any Javascript in the new body content. Therefore, FlashLoad manually runs them, and if there is a `data-flashload-skip-replacing` attribute, that script will be skipped.



### InstantClick vs Flashload

Flashload is greatly inspired from InstantClick. There is a few differences between InstantClick and Flashload.

* InstantClick loads the same content over and over if the user hovers in, out, and in again. Flashload fetches content only one time.
* FlashLoad is more lightweight than InstantClick (mostly because InstantClick has "browser-specific" code old devides and browsers).
* InstantClick supports loading on "mouseclick", but Flashload does not. It is designed for preloading on "mouseover".
* In InstantClick, you have to change HTML and add `data-no-instant` to exclude an link from preloading. In Flashload, you manage these settings in the `start()` call config using Javascript.