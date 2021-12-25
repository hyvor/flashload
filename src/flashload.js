window.FlashLoad = (function() {

    var $storage = {},
        $initiated = false

    function init(config) {
        if ($initiated) return
        $initiated = true;

        document.addEventListener('mouseover', handleMouseOver, true)
        document.addEventListener("click", handleClick, true);
    }

    function linkPreloadable() {
        return true;
    }

    function handleMouseOver(e) {
        var closestLink = e.target.closest('a[href]');
        if (closestLink && linkPreloadable(closestLink)) {
            preload(closestLink);
        }   
    }
    function handleClick(e) {
        var closestLink = e.target.closest('a[href]');
        if (closestLink && linkPreloadable(closestLink)) {
            e.preventDefault();
            display(closestLink);
        }
    }

    function preload(linkElement, displayOnLoad) {
        var href = linkElement.href;
        var url = removeHash(href);

        if (!$storage[url]) {
            console.log("Preloading");
            $storage[url] = new PreloadRequest(href, displayOnLoad);
        }
    }
    function display(linkElement) {
        console.log("Display");
        var url = removeHash(linkElement.href);
        if (!$storage[url]) {
            preload(linkElement, true);
        } else {
            $storage[url].display();
        }
    }

    function removeHash(url) {
        var index = url.indexOf('#')
        return index == -1 ? url : url.substr(0, index)
    }

    function PreloadRequest(href, displayOnLoad) {
        var selfx = this;

        this.href = href;

        this.status = 'loading'; // loading | success | error
        this.error = null;

        this.displayOnLoad = displayOnLoad ? true : false;

        var xhr = new XMLHttpRequest();
        xhr.open('GET', href);
        xhr.timeout = 20000;
        xhr.send();

        xhr.onreadystatechange = function() {
            if (xhr.readyState === 2) { // headers received
                if (xhr.getResponseHeader('Content-Type').toLowerCase() !== "text/html") {
                    selfx.setError('Not an HTML response');
                }
            }

            if (xhr.readyState === 4) { // response received
                if (xhr.status !== 200) {
                    selfx.setError('Request error');
                } else {
                    selfx.setSuccess(xhr.responseText);
                }
            }

        }

        this.setError = function(e) {
            this.status = e;
            this.error = e;
        }

        this.setSuccess = function(text) {
            this.status = 'success';

            var doc = document.implementation.createHTMLDocument('') // new XML document so that we can get <body> without regex
            doc.documentElement.innerHTML = text;

            this.title = doc.title;
            this.body = doc.body;

            if (this.displayOnLoad) {
                this.display();
            }
        }

        this.xhr = xhr;

        this.display = function() {
            if (this.status === 'loading') {
                this.displayOnLoad = true;
            } else if (this.status === 'error') {
                location.href = this.href;
            } else {
                history.pushState(null, null, this.href);

                document.title = this.title;
                document.documentElement.replaceChild(this.body, document.body)
            }
        }

    }

    return init;

})();