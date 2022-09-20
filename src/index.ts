type excludeFunction = (el: HTMLAnchorElement) => boolean

interface Config {

    /**
     * Whether to show the bar
     */
    bar: boolean,

    /**
     * Delay of the bar
     */
    barDelay: number,

    /**
     * Base path to match links
     */
    basePath: string,

    /**
     * A function to exclude paths
     */
    exclude: excludeFunction

}

if (!(window as any).Flashload) {

    (window as any).Flashload = (function () {

        const DATA_NAME_SKIP_SCRIPT = 'data-flashload-skip-script'
        const DATA_NAME_SKIP_LINK = 'data-flashload-skip-link'

        let $storage: Record<string, Page> = {},
            $started: boolean = false,
            $currenHref: string = removeHash(location.href),
            $basePath: string = '',
            $excludeFunction: excludeFunction | undefined,
            $barDelay: number = 2000,
            $lastPreloadRequest: null | Page = null;

        function start(config: Partial<Config> = {}) {
            if ($started) return
            $started = true;

            if (config.basePath) {
                $basePath = "/" + removeSlashes(config.basePath);
            }
            if (config.exclude) {
                $excludeFunction = config.exclude;
            }
            if (typeof config.barDelay === 'number') {
                $barDelay = config.barDelay;
            }
            if (config.bar === true) {
                initProgressBar($barDelay);
            }

            document.addEventListener("mouseover", handleMouseOver, true)
            document.addEventListener("touchstart", handleMouseOver, true);
            document.addEventListener("click", handleClick, true);
            window.addEventListener("popstate", handlePopState, true);

            // add current page
            const page = new Page($currenHref);
            page.setTitleAndBody(document.title, document.body)
            page.status = 'success'
            $storage[$currenHref] = page
        }

        function linkPreloadable(linkElement: HTMLAnchorElement) {

            const currentOrigin = new URL(location.href).origin;
            const hrefUrl = new URL(linkElement.href);

            if (
                linkElement.target || // _blank
                linkElement.hasAttribute('download') || // downloadable links
                currentOrigin !== hrefUrl.origin ||
                (
                    hrefUrl.pathname !== $basePath &&
                    hrefUrl.pathname.indexOf($basePath + "/") !== 0
                ) ||
                shouldSkip(linkElement)
            ) {
                return false;
            }

            return true;
        }

        function shouldSkip(el: HTMLAnchorElement) {

            // check all custom excludes in config
            if ($excludeFunction && $excludeFunction(el)) {
                return true;
            }

            // check all parents
            let currentElement: HTMLElement | null = el;
            while (currentElement) {
                if (currentElement.hasAttribute(DATA_NAME_SKIP_LINK)) return true;
                currentElement = currentElement.parentElement
            }

            return false;
        }

        /**
         * Start preloading on mouseover
         */
        function handleMouseOver(e: MouseEvent | TouchEvent) {
            const closestLink: HTMLAnchorElement | null = (e.target as HTMLElement).closest('a[href]');
            if (closestLink && linkPreloadable(closestLink)) {
                preload(closestLink);
            }
        }

        /**
         * Make sure preloading has started
         * And display after loading
         */
        function handleClick(e: MouseEvent) {
            if (e.metaKey || e.ctrlKey) return;

            const closestLink: HTMLAnchorElement | null = (e.target as HTMLElement).closest('a[href]');
            if (closestLink && linkPreloadable(closestLink)) {
                e.preventDefault();
                click(closestLink);
            }
        }

        /**
         * On popstate change, mainly when back button is clicked,
         * First, check if we have the page cached. If yes, yay! Just display it.
         * Otherwise, we will need to reload the page.
         */
        function handlePopState() {
            const url = removeHash(location.href);

            if ($currenHref === url)
                return;

            const a = document.createElement("a");
            a.href = url;
            if (linkPreloadable(a)) click(a)
            else location.reload();
        }

        function preload(linkElement: HTMLAnchorElement, displayOnLoad: boolean = false) {
            const href = linkElement.href;
            const url = removeHash(href);

            if (!$storage[url]) {
                const page = new Page(href);
                page.displayOnLoad = displayOnLoad;
                page.preload();
                $storage[url] = page;
            }
        }

        function click(linkElement: HTMLAnchorElement) {

            /**
             * Save the scroll position of the current document in case the user comes back
             */
            if ($storage[$currenHref]) {
                $storage[$currenHref].scrollPos = window.scrollY;
            }

            sendEvent("navigationStarted", {url: linkElement.href})
            var url = removeHash(linkElement.href);
            if (!$storage[url]) {
                preload(linkElement, true);
            } else {
                /**
                 * Update href to prevent caching the hash
                 */
                $storage[url].href = linkElement.href;
                $storage[url].display();
            }
        }

        /**
         * href - URL to preload
         * displayOnLoad - should display when loaded?
         */
        class Page {

            href: string;
            displayOnLoad: boolean = false;

            scrollPos: number = 0;
            status: 'loading' | 'success' | 'error' = 'loading';
            xhr: XMLHttpRequest | null = null;

            error: string | null = null;

            title?: string;
            body?: HTMLElement;

            public constructor(href: string) {
                this.href = href
            }

            public preload() {
                sendEvent('preloadStarted', {url: this.href});

                const xhr = new XMLHttpRequest();
                xhr.open('GET', this.href);
                xhr.timeout = 20000;
                xhr.setRequestHeader('X-FLASHLOAD', "1")
                xhr.send();

                xhr.onreadystatechange = () => {
                    if (xhr.readyState === 2) { // headers received
                        const contentType = xhr.getResponseHeader('Content-Type') || '';
                        if (contentType.toLowerCase().split(';')[0] !== "text/html") {
                            this.setError('Not an HTML response');
                        }
                    }

                    if (xhr.readyState === 4) { // response received
                        if (xhr.status === 200) {
                            $lastPreloadRequest = null;
                            this.setSuccess(xhr.responseText);
                        } else { // do not set error on abort
                            this.setError('Request error');
                        }
                    }

                }

                this.xhr = xhr;
            }

            public abort() {
                this.xhr && this.xhr.abort();
                delete $storage[removeHash(this.href)]
            }

            public setError(e: string) {
                this.status = 'error';
                this.error = e;

                if (this.displayOnLoad) {
                    this.display();
                }
            }

            public setSuccess(text: string) {
                this.status = 'success';

                sendEvent("preloadEnded", {url: this.href})

                const doc = document.implementation.createHTMLDocument('') // new XML document so that we can get <body> without regex
                doc.documentElement.innerHTML = text;

                this.setTitleAndBody(doc.title, doc.body)

                if (this.displayOnLoad) {
                    this.display();
                }
            }

            public setTitleAndBody(title: string, body: HTMLElement) {
                this.title = title;
                this.body = body;
            }

            public display() {
                if (this.status === 'loading') {
                    this.displayOnLoad = true;
                } else if (this.status === 'error') {
                    location.href = this.href;
                } else {
                    // replace the page body

                    if (this.title === undefined || this.body === undefined) {
                        console.error('Title and body is not set');
                        return;
                    }

                    const currentLoc = removeHash(location.href)
                    if (currentLoc !== this.href) {
                        if ($storage[currentLoc]) {
                            $storage[currentLoc].scrollPos = window.scrollY
                        }

                        history.pushState(null, '', this.href);
                    }

                    $currenHref = this.href;

                    // change title and body
                    document.title = this.title;
                    document.documentElement.replaceChild(this.body, document.body)

                    window.scrollTo(0, this.scrollPos);

                    // <script>s do not run when replacing child
                    // so run scripts manually
                    replaceScripts();

                    sendEvent("navigationEnded", {url: this.href})

                    const hash = getHash(this.href)
                    if (hash) {
                        const el = document.getElementById(hash)
                        el && el.scrollIntoView()
                    } else {
                        location.hash = '';
                    }

                }
            }

        }

        function replaceScripts() {
            let scripts = document.body.getElementsByTagName("script");
            for (let i = 0; i < scripts.length; i++) {
                let script = scripts[i];
                if (script.hasAttribute(DATA_NAME_SKIP_SCRIPT)) continue;
                script.parentNode?.replaceChild(cloneScript(script), script);
            }

            function cloneScript(node: HTMLScriptElement) {
                const script = document.createElement("script");
                script.text = node.innerHTML;

                let i = -1, attrs = node.attributes, attr;
                while (++i < attrs.length) {
                    script.setAttribute((attr = attrs[i]).name, attr.value);
                }
                return script;
            }
        }

        // events
        type eventName = 'preloadStarted' | 'preloadEnded' | 'navigationStarted' | 'navigationEnded';

        function sendEvent(name: eventName, data: object) {
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
        function removeHash(url: string) {
            const index = url.indexOf('#')
            return index == -1 ? url : url.substring(0, index)
        }

        function getHash(url: string) {
            return url.split('#')[1];
        }

        function removeSlashes(t: string) {
            return t.replace(/^\/|\/$/g, '');
        }

        // progressbar
        function initProgressBar(delay: number) {

            var style = document.createElement('style');
            style.innerHTML = '#flashload-bar-container{position:fixed;top:0;left:0;width:100%;pointer-events:none;z-index:2147483647;transition:opacity .25s .1s;opacity:0}.flashload-bar{background:#000;width:100%;margin-left:-100%;height:2px;transition:all .25s}';
            document.head.appendChild(style);

            // to avoid showing bar when the navigation fetching is
            // delayed than the barDelay
            var hasTimeoutStarted = false,
                // elements
                barContainer: HTMLDivElement,
                bar: HTMLDivElement,
                // length of bar (100%)
                barLength: number;

            // add elemnts
            barContainer = document.createElement('div');
            barContainer.id = "flashload-bar-container";

            bar = document.createElement("div");
            bar.id = "flashload-bar";
            bar.className = bar.id

            barContainer.appendChild(bar);
            document.body.appendChild(barContainer);


            // inspired from instantclick 3.1.0 (fake transition)
            function updateTransform(val: number) {
                if (bar) bar.style.transform = 'translate(' + val + '%)';
                barLength = val;
                if (!document.getElementById(barContainer.id)) {
                    document.body.appendChild(barContainer);
                }
            }

            function autoIncreaseLength() {
                if (!hasTimeoutStarted)
                    return;

                var val = barLength + 1 + (Math.random() * 2);

                if (val >= 98) {
                    val = 98
                }

                updateTransform(val)
                setTimeout(autoIncreaseLength, 50)
            }

            function start() {
                if (!hasTimeoutStarted) {
                    return
                }

                if (document.getElementById(barContainer.id)) {
                    document.body.removeChild(barContainer)
                }
                barContainer.style.opacity = '1'

                setTimeout(function () {
                    updateTransform(10 + (Math.random() * 10))
                }, 0); // set to 10
                setTimeout(autoIncreaseLength, 1);
            }

            document.addEventListener("flashload:navigationStarted", function () {
                hasTimeoutStarted = true;
                setTimeout(start, delay);
            });
            document.addEventListener("flashload:navigationEnded", function () {
                hasTimeoutStarted = false;

                /**
                 * It is a new document.body now
                 * So, add container to this document
                 */
                document.body.appendChild(barContainer);

                setTimeout(function () {
                    updateTransform(barLength)
                }, 0);
                setTimeout(function () {
                    updateTransform(100)
                    setTimeout(function () {
                        barContainer.style.opacity = '0'
                    }, 100);
                }, 1)
            });
        }

        return {
            start: start
        };

    })();

}