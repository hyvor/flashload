window.FlashLoad = (function() {

    var $storage = {},
        $started = false,
        $basepath = '',
        $excludeArray = [],
        $barDelay = 0;

    function start(config) {
        if ($started) return
        $started = true;

        if (!config) config = {};

        if (config.basepath) {
            $basepath = removeSlashes(config.basepath);
        }
        if (config.exclude) {
            $excludeArray = config.exclude;
        }
        if (config.barDelay) {
            $barDelay = config.barDelay;
        }
        if (config.bar) {
            initProgressBar($barDelay);
        }

        document.addEventListener('mouseover', handleMouseOver, true)
        document.addEventListener("click", handleClick, true);
    }

    function linkPreloadable(linkElement) {

        var startDomainAndPath = 
            location.protocol + '//' + 
            location.host + 
            ($basepath ? '/' + removeSlashes($basepath) : "");

        if (
            linkElement.target || // _blank
            linkElement.hasAttribute('download') || // downloadable links
            (
                linkElement.href.indexOf('#') > -1 && 
                removeHash(linkElement.href) == removeHash(location.href)
            ) || // same page with hash
            linkElement.href.indexOf(startDomainAndPath + '/') != 0 || // different domain
            shouldSkip(linkElement)
        ) {
            return false;
        }

        return true;
    }

    function shouldSkip(el) {
        // check all custom excludes in config
        for (var i = 0; i < $excludeArray; i++) {
            var exclude = $excludeArray[i];
            if (typeof exclude === 'function' && exclude(el)) {
                return true;
            }
        }

        // check all parents
        while (el = el.parentElement) {
            if (!el) return false;
            if (el.hasAttribute('data-flashload-skip-preloading')) return true;
        }

        return false;
    }

    function handleMouseOver(e) {
        var closestLink = e.target.closest('a[href]');
        if (closestLink && linkPreloadable(closestLink)) {
            preload(closestLink);
        }   
    }
    function handleClick(e) {
        if (e.metaKey || e.ctrlKey) return;

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
            $storage[url] = new PreloadRequest(href, displayOnLoad);
        }
    }
    function display(linkElement) {
        sendEvent("navigationStarted", {url: linkElement.href})
        var url = removeHash(linkElement.href);
        if (!$storage[url]) {
            preload(linkElement, true);
        } else {
            $storage[url].display();
        }
    }

    function PreloadRequest(href, displayOnLoad) {
        var selfx = this;

        this.href = href;

        this.status = 'loading'; // loading | success | error
        this.error = null;

        this.displayOnLoad = displayOnLoad ? true : false;

        sendEvent("preloadStarted", {url: href})

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

            sendEvent("preloadEnded", {url: href})

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
                // replace the page body
                history.pushState(null, null, this.href);

                // change title and body
                document.title = this.title;
                document.documentElement.replaceChild(this.body, document.body)

                // <script>s do not run when replacing child
                // so run scripts manually
                replaceScripts();

                sendEvent("navigationEnded", {url: this.href})

            }
        }

    }

    function replaceScripts() {
        var scripts = document.body.getElementsByTagName("script");
        for (var i = 0; i < scripts.length; i++) {
            var script = scripts[i];
            if (script.hasAttribute('data-flashload-skip-replacing')) continue;
            script.parentNode.replaceChild(cloneScript(script), script);
        }
        function cloneScript(node){
            var script  = document.createElement("script");
            script.text = node.innerHTML;
    
            var i = -1, attrs = node.attributes, attr;
            while ( ++i < attrs.length ) {                                    
                script.setAttribute( (attr = attrs[i]).name, attr.value );
            }
            return script;
        }
    }

    // events
    function sendEvent(name, data) {
        document.dispatchEvent(
            new CustomEvent("flashload:" + name, {
                detail: data,
                bubbles: true,
                cancelable: true,
                composed: false,
            })
        );
    }

    // helpers
    function removeHash(url) {
        var index = url.indexOf('#')
        return index == -1 ? url : url.substr(0, index)
    }
    function removeSlashes(t) {
        return t.replace(/^\/|\/$/g, '');
    }

    // progressbar
    // from instantclick 3.1.0 (fake transition)
    function initProgressBar(delay) {

        var style = document.createElement('style');
        style.innerHTML = '#flashload-bar-container{position:fixed;top:0;left:0;width:100%;pointer-events:none;z-index:2147483647;transition:opacity .25s .1s}.flashload-bar{background:#000;width:100%;margin-left:-100%;height:2px;transition:all .25s}';
        document.head.appendChild(style);

            // to avoid showing bar when the navigation fetching is 
            // delayed than the barDelay
        var hasTimeoutStarted = false,
            // elements
            barContainer,
            bar,
            // length of bar (100%)
            barLength;

        // add elemnts
        barContainer = document.createElement('div');
        barContainer.id = "flashload-bar-container";

        bar = document.createElement("div");
        bar.id = "flashload-bar";
        bar.className = bar.id

        barContainer.appendChild(bar);
        document.body.appendChild(barContainer);

            

        function updateTransform(val) {
            if (bar) bar.style.transform = 'translate(' + val + '%)';
            barLength = val;
            if (!document.getElementById(barContainer.id)) {
                document.body.appendChild(barContainer);
            }
        }

        function autoIncreaseLength() {
            var val = barLength + 1 + (Math.random() * 2);

            if (val >= 98) {
                val = 98
            } else if (hasTimeoutStarted) {
                setTimeout(autoIncreaseLength, 50)
            }
            updateTransform(val)
        }

        function start() {
            // skip starting (only for delayed loading)
            if  (!hasTimeoutStarted)
                return;

            if (document.getElementById(barContainer.id)) {
                document.body.removeChild(barContainer)
            }
            barContainer.style.opacity = '1'
  
            setTimeout(function() {updateTransform(10 + (Math.random() * 10))}, 0); // set to 10
            setTimeout(autoIncreaseLength, 1);
        }

        document.addEventListener("flashload:navigationStarted", function() {
            hasTimeoutStarted = true;
            setTimeout(start, delay);
        });
        document.addEventListener("flashload:navigationEnded", function() {
            hasTimeoutStarted = false;

            /**
             * It is a new document.body now
             * So, add container to this document
             */
            document.body.appendChild(barContainer);

            setTimeout(function() {updateTransform(barLength)}, 0);
            setTimeout(function() {
                updateTransform(100)
                barContainer.style.opacity = '0'
                return
            }, 1)
        });
    }

    return {
        start: start,
        on: null
    };

})();