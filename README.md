# Flashload

Flashload does two things:

1. It converts separate HTML pages to single-page application using `history.pushState`
2. It makes navigation faster by preloading pages on mouseover (on desktop) or touchstart (on mobile) events.

This library is heavily inspired by [InstantClick](http://instantclick.io), but more lightweight (<2kb gzipped) and has more configuration options.

## Installation

The best way is to copy the following code to the bottom of your HTML pages.
```
<script src="flashload.js"></script>
<script data-flashload-skip-script>
    FlashLoad.start()
</script>
```

## How Flashload Works

When you add Flashload to your website, it adds two event listeners to the `document` element

* `mouseoever` (or `touchstart` for mobile): When a user hovers over a link, Flashload starts "pre-fetching" that page and saves it in javascript memory.
* `click` event: When a user clicks on a link, Flashload uses `event.preventDefault()` to stop browser from loading the page by itself. Intead, Flashload handles this action using `history.pushState()` (just like a single page app). As the page is already pre-fetched, Flashload simply swaps content, which is super fast than a browser load. However, it is important to know that Flashload only replaces the `<body>` of the HTML document. The `<head>` part remains same across pages.

## Rules of Flashload

These are the rules to follow when designing a website for Flashload.

* All shared CSS and JS should go into 

## Designing a website for FlashLload

Flashload is best for landing pages, blogs, and other small website, where you can share a single theme (styles).

As only `<body>` is replaced, you have to add your stylesheets and/or scripts to the `<head>` and they should be **"common"** for all pages on your website, where you wish Flashload to handle navigation.

Flashload updates `document.title` too, so making sure that each HTML page has a correct `<title>` tag is enough to make browser title work.

What about other meta tags in `<head>`? Flashload does not update other meta tags (SEO, Social Media) when the user navigates, simply because it is unnecessary. Crawlers (such as search engine robots) "fetch" pages as HTML by sending HTTP requests. They do not "navigate" between pages clicking links. Therefore, Flashload does not change how robots see pages.

Simply saying, Flashload has nothing to do with robots. It is only about **real user experience**.

## Config

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


### `data-flashload-skip-script` Attribute

```
<script data-flashload-skip-script></script>
```

`data-flashload-skip-script` attribute can only be used in `<script>` elements. When used, that script will only be executed on the first load. For example, the `<script>` element that wraps the `FlashLoad()` initial function has this attribute. It is because, `FlashLoad.start()` sets event listeners on the `document` element, and these events should only be added once.

> Under the hood, FlashLoad fetches HTML pages via AJAX and replaces the content of the body. However, browsers do not run any Javascript in the new body content. Therefore, FlashLoad manually runs them, and if there is a `data-flashload-skip-script` attribute, that script will be skipped.


## Story

We wanted to make [Hyvor Blogs](https://blogs.hyvor.com) as fast as possible. We understood that, one overlooked way was preloading content before the user clicks on a link. In most cases, it takes 150ms+ from "hover" to "click" (Test it yourself using [this tool](http://instantclick.io/click-test) at InstantClick). It takes even more time when you are just freely navigating. Also, seeing how fast navigation is in [Gatsby](https://www.gatsbyjs.com/) and [Forem](https://www.forem.com/) (or dev.to), we wanted to implement something like that.

How Gatsby do it is a different story. But, dev.to worked in a similar way like what we wanted: send a XHR (Ajax) request when the user loads (so we eliminate that "hover...click" delay) and fetch the complete HTML pages. For fast connections, pages usually display instantly after the click.

We first used InstantClick, which is the same library Forem uses. However, we wanted implement caching to fetched content to reduce bandwidth and wanted to add some options like delayed progress bar. Another reason to re-write the library was that InstantClick had not been maintained since 2017 (We will be maintaining this library as long as we run Hyvor Blogs)