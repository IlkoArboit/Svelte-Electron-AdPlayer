
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    var _documentCurrentScript = typeof document !== 'undefined' ? document.currentScript : null;
    function noop$1() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop$1;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function get_store_value(store) {
        let value;
        subscribe(store, _ => value = _)();
        return value;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    /**
     * The `onMount` function schedules a callback to run as soon as the component has been mounted to the DOM.
     * It must be called during the component's initialisation (but doesn't need to live *inside* the component;
     * it can be called from an external module).
     *
     * `onMount` does not run inside a [server-side component](/docs#run-time-server-side-component-api).
     *
     * https://svelte.dev/docs#run-time-svelte-onmount
     */
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    let render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = /* @__PURE__ */ Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        // Do not reenter flush while dirty components are updated, as this can
        // result in an infinite loop. Instead, let the inner flush handle it.
        // Reentrancy is ok afterwards for bindings etc.
        if (flushidx !== 0) {
            return;
        }
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            try {
                while (flushidx < dirty_components.length) {
                    const component = dirty_components[flushidx];
                    flushidx++;
                    set_current_component(component);
                    update(component.$$);
                }
            }
            catch (e) {
                // reset dirty state to not end up in a deadlocked state and then rethrow
                dirty_components.length = 0;
                flushidx = 0;
                throw e;
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    /**
     * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
     */
    function flush_render_callbacks(fns) {
        const filtered = [];
        const targets = [];
        render_callbacks.forEach((c) => fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c));
        targets.forEach((c) => c());
        render_callbacks = filtered;
    }
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            flush_render_callbacks($$.after_update);
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: [],
            // state
            props,
            update: noop$1,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop$1;
        }
        $on(type, callback) {
            if (!is_function(callback)) {
                return noop$1;
            }
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.59.2' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    var global$1 = (typeof global !== "undefined" ? global :
      typeof self !== "undefined" ? self :
      typeof window !== "undefined" ? window : {});

    // shim for using process in browser
    // based off https://github.com/defunctzombie/node-process/blob/master/browser.js

    function defaultSetTimout() {
        throw new Error('setTimeout has not been defined');
    }
    function defaultClearTimeout () {
        throw new Error('clearTimeout has not been defined');
    }
    var cachedSetTimeout = defaultSetTimout;
    var cachedClearTimeout = defaultClearTimeout;
    if (typeof global$1.setTimeout === 'function') {
        cachedSetTimeout = setTimeout;
    }
    if (typeof global$1.clearTimeout === 'function') {
        cachedClearTimeout = clearTimeout;
    }

    function runTimeout(fun) {
        if (cachedSetTimeout === setTimeout) {
            //normal enviroments in sane situations
            return setTimeout(fun, 0);
        }
        // if setTimeout wasn't available but was latter defined
        if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
            cachedSetTimeout = setTimeout;
            return setTimeout(fun, 0);
        }
        try {
            // when when somebody has screwed with setTimeout but no I.E. maddness
            return cachedSetTimeout(fun, 0);
        } catch(e){
            try {
                // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
                return cachedSetTimeout.call(null, fun, 0);
            } catch(e){
                // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
                return cachedSetTimeout.call(this, fun, 0);
            }
        }


    }
    function runClearTimeout(marker) {
        if (cachedClearTimeout === clearTimeout) {
            //normal enviroments in sane situations
            return clearTimeout(marker);
        }
        // if clearTimeout wasn't available but was latter defined
        if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
            cachedClearTimeout = clearTimeout;
            return clearTimeout(marker);
        }
        try {
            // when when somebody has screwed with setTimeout but no I.E. maddness
            return cachedClearTimeout(marker);
        } catch (e){
            try {
                // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
                return cachedClearTimeout.call(null, marker);
            } catch (e){
                // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
                // Some versions of I.E. have different rules for clearTimeout vs setTimeout
                return cachedClearTimeout.call(this, marker);
            }
        }



    }
    var queue = [];
    var draining = false;
    var currentQueue;
    var queueIndex = -1;

    function cleanUpNextTick() {
        if (!draining || !currentQueue) {
            return;
        }
        draining = false;
        if (currentQueue.length) {
            queue = currentQueue.concat(queue);
        } else {
            queueIndex = -1;
        }
        if (queue.length) {
            drainQueue();
        }
    }

    function drainQueue() {
        if (draining) {
            return;
        }
        var timeout = runTimeout(cleanUpNextTick);
        draining = true;

        var len = queue.length;
        while(len) {
            currentQueue = queue;
            queue = [];
            while (++queueIndex < len) {
                if (currentQueue) {
                    currentQueue[queueIndex].run();
                }
            }
            queueIndex = -1;
            len = queue.length;
        }
        currentQueue = null;
        draining = false;
        runClearTimeout(timeout);
    }
    function nextTick(fun) {
        var args = new Array(arguments.length - 1);
        if (arguments.length > 1) {
            for (var i = 1; i < arguments.length; i++) {
                args[i - 1] = arguments[i];
            }
        }
        queue.push(new Item(fun, args));
        if (queue.length === 1 && !draining) {
            runTimeout(drainQueue);
        }
    }
    // v8 likes predictible objects
    function Item(fun, array) {
        this.fun = fun;
        this.array = array;
    }
    Item.prototype.run = function () {
        this.fun.apply(null, this.array);
    };
    var title = 'browser';
    var platform = 'browser';
    var browser = true;
    var env = {};
    var argv = [];
    var version = ''; // empty string to avoid regexp issues
    var versions = {};
    var release = {};
    var config = {};

    function noop() {}

    var on = noop;
    var addListener = noop;
    var once = noop;
    var off = noop;
    var removeListener = noop;
    var removeAllListeners = noop;
    var emit = noop;

    function binding(name) {
        throw new Error('process.binding is not supported');
    }

    function cwd () { return '/' }
    function chdir (dir) {
        throw new Error('process.chdir is not supported');
    }function umask() { return 0; }

    // from https://github.com/kumavis/browser-process-hrtime/blob/master/index.js
    var performance = global$1.performance || {};
    var performanceNow =
      performance.now        ||
      performance.mozNow     ||
      performance.msNow      ||
      performance.oNow       ||
      performance.webkitNow  ||
      function(){ return (new Date()).getTime() };

    // generate timestamp or delta
    // see http://nodejs.org/api/process.html#process_process_hrtime
    function hrtime(previousTimestamp){
      var clocktime = performanceNow.call(performance)*1e-3;
      var seconds = Math.floor(clocktime);
      var nanoseconds = Math.floor((clocktime%1)*1e9);
      if (previousTimestamp) {
        seconds = seconds - previousTimestamp[0];
        nanoseconds = nanoseconds - previousTimestamp[1];
        if (nanoseconds<0) {
          seconds--;
          nanoseconds += 1e9;
        }
      }
      return [seconds,nanoseconds]
    }

    var startTime = new Date();
    function uptime() {
      var currentTime = new Date();
      var dif = currentTime - startTime;
      return dif / 1000;
    }

    var browser$1 = {
      nextTick: nextTick,
      title: title,
      browser: browser,
      env: env,
      argv: argv,
      version: version,
      versions: versions,
      on: on,
      addListener: addListener,
      once: once,
      off: off,
      removeListener: removeListener,
      removeAllListeners: removeAllListeners,
      emit: emit,
      binding: binding,
      cwd: cwd,
      chdir: chdir,
      umask: umask,
      hrtime: hrtime,
      platform: platform,
      release: release,
      config: config,
      uptime: uptime
    };

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function getDefaultExportFromCjs (x) {
    	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
    }

    function getAugmentedNamespace(n) {
      if (n.__esModule) return n;
      var f = n.default;
    	if (typeof f == "function") {
    		var a = function a () {
    			if (this instanceof a) {
    				var args = [null];
    				args.push.apply(args, arguments);
    				var Ctor = Function.bind.apply(f, args);
    				return new Ctor();
    			}
    			return f.apply(this, arguments);
    		};
    		a.prototype = f.prototype;
      } else a = {};
      Object.defineProperty(a, '__esModule', {value: true});
    	Object.keys(n).forEach(function (k) {
    		var d = Object.getOwnPropertyDescriptor(n, k);
    		Object.defineProperty(a, k, d.get ? d : {
    			enumerable: true,
    			get: function () {
    				return n[k];
    			}
    		});
    	});
    	return a;
    }

    function commonjsRequire(path) {
    	throw new Error('Could not dynamically require "' + path + '". Please configure the dynamicRequireTargets or/and ignoreDynamicRequires option of @rollup/plugin-commonjs appropriately for this require call to work.');
    }

    var lokijs = {exports: {}};

    var lokiIndexedAdapter = {exports: {}};

    /*
      Loki IndexedDb Adapter (need to include this script to use it)

      Console Usage can be used for management/diagnostic, here are a few examples :
      adapter.getDatabaseList(); // with no callback passed, this method will log results to console
      adapter.saveDatabase('UserDatabase', JSON.stringify(myDb));
      adapter.loadDatabase('UserDatabase'); // will log the serialized db to console
      adapter.deleteDatabase('UserDatabase');
    */

    var hasRequiredLokiIndexedAdapter;

    function requireLokiIndexedAdapter () {
    	if (hasRequiredLokiIndexedAdapter) return lokiIndexedAdapter.exports;
    	hasRequiredLokiIndexedAdapter = 1;
    	(function (module, exports) {
    		(function (root, factory) {
    		    {
    		        // Node, CommonJS-like
    		        module.exports = factory();
    		    }
    		}(commonjsGlobal, function () {
    		  return (function() {

    		    /**
    		     * Loki persistence adapter class for indexedDb.
    		     *     This class fulfills abstract adapter interface which can be applied to other storage methods.
    		     *     Utilizes the included LokiCatalog app/key/value database for actual database persistence.
    		     *     Indexeddb is highly async, but this adapter has been made 'console-friendly' as well.
    		     *     Anywhere a callback is omitted, it should return results (if applicable) to console.
    		     *     IndexedDb storage is provided per-domain, so we implement app/key/value database to
    		     *     allow separate contexts for separate apps within a domain.
    		     *
    		     * @example
    		     * var idbAdapter = new LokiIndexedAdapter('finance');
    		     *
    		     * @constructor LokiIndexedAdapter
    		     *
    		     * @param {string} appname - (Optional) Application name context can be used to distinguish subdomains, 'loki' by default
    		     * @param {object=} options Configuration options for the adapter
    		     * @param {boolean} options.closeAfterSave Whether the indexedDB database should be closed after saving.
    		     */
    		    function LokiIndexedAdapter(appname, options)
    		    {
    		      this.app = 'loki';
    		      this.options = options || {};

    		      if (typeof (appname) !== 'undefined')
    		      {
    		        this.app = appname;
    		      }

    		      // keep reference to catalog class for base AKV operations
    		      this.catalog = null;

    		      if (!this.checkAvailability()) {
    		        throw new Error('indexedDB does not seem to be supported for your environment');
    		      }
    		    }

    		    /**
    		     * Used for closing the indexeddb database.
    		     */
    		    LokiIndexedAdapter.prototype.closeDatabase = function ()
    		    {
    		      if (this.catalog && this.catalog.db) {
    		        this.catalog.db.close();
    		        this.catalog.db = null;
    		      }
    		    };

    		    /**
    		     * Used to check if adapter is available
    		     *
    		     * @returns {boolean} true if indexeddb is available, false if not.
    		     * @memberof LokiIndexedAdapter
    		     */
    		    LokiIndexedAdapter.prototype.checkAvailability = function()
    		    {
    		      if (typeof indexedDB !== 'undefined' && indexedDB) return true;

    		      return false;
    		    };

    		    /**
    		     * Retrieves a serialized db string from the catalog.
    		     *
    		     * @example
    		     * // LOAD
    		     * var idbAdapter = new LokiIndexedAdapter('finance');
    		     * var db = new loki('test', { adapter: idbAdapter });
    		     *   db.loadDatabase(function(result) {
    		     *   console.log('done');
    		     * });
    		     *
    		     * @param {string} dbname - the name of the database to retrieve.
    		     * @param {function} callback - callback should accept string param containing serialized db string.
    		     * @memberof LokiIndexedAdapter
    		     */
    		    LokiIndexedAdapter.prototype.loadDatabase = function(dbname, callback)
    		    {
    		      var appName = this.app;
    		      var adapter = this;

    		      // lazy open/create db reference so dont -need- callback in constructor
    		      if (this.catalog === null || this.catalog.db === null) {
    		        this.catalog = new LokiCatalog(function(cat) {
    		          adapter.catalog = cat;

    		          adapter.loadDatabase(dbname, callback);
    		        });

    		        return;
    		      }

    		      // lookup up db string in AKV db
    		      this.catalog.getAppKey(appName, dbname, function(result) {
    		        if (typeof (callback) === 'function') {
    		          if (result.id === 0) {
    		            callback(null);
    		            return;
    		          }
    		          callback(result.val);
    		        }
    		        else {
    		          // support console use of api
    		          console.log(result.val);
    		        }
    		      });
    		    };

    		    // alias
    		    LokiIndexedAdapter.prototype.loadKey = LokiIndexedAdapter.prototype.loadDatabase;

    		    /**
    		     * Saves a serialized db to the catalog.
    		     *
    		     * @example
    		     * // SAVE : will save App/Key/Val as 'finance'/'test'/{serializedDb}
    		     * var idbAdapter = new LokiIndexedAdapter('finance');
    		     * var db = new loki('test', { adapter: idbAdapter });
    		     * var coll = db.addCollection('testColl');
    		     * coll.insert({test: 'val'});
    		     * db.saveDatabase();  // could pass callback if needed for async complete
    		     *
    		     * @param {string} dbname - the name to give the serialized database within the catalog.
    		     * @param {string} dbstring - the serialized db string to save.
    		     * @param {function} callback - (Optional) callback passed obj.success with true or false
    		     * @memberof LokiIndexedAdapter
    		     */
    		    LokiIndexedAdapter.prototype.saveDatabase = function(dbname, dbstring, callback)
    		    {
    		      var appName = this.app;
    		      var adapter = this;

    		      function saveCallback(result) {
    		        if (result && result.success === true) {
    		          callback(null);
    		        }
    		        else {
    		          callback(new Error("Error saving database"));
    		        }

    		        if (adapter.options.closeAfterSave) {
    		          adapter.closeDatabase();
    		        }
    		      }

    		      // lazy open/create db reference so dont -need- callback in constructor
    		      if (this.catalog === null || this.catalog.db === null) {
    		        this.catalog = new LokiCatalog(function(cat) {
    		          adapter.saveDatabase(dbname, dbstring, saveCallback);
    		        });

    		        return;
    		      }

    		      // set (add/update) entry to AKV database
    		      this.catalog.setAppKey(appName, dbname, dbstring, saveCallback);
    		    };

    		    // alias
    		    LokiIndexedAdapter.prototype.saveKey = LokiIndexedAdapter.prototype.saveDatabase;

    		    /**
    		     * Deletes a serialized db from the catalog.
    		     *
    		     * @example
    		     * // DELETE DATABASE
    		     * // delete 'finance'/'test' value from catalog
    		     * idbAdapter.deleteDatabase('test', function {
    		     *   // database deleted
    		     * });
    		     *
    		     * @param {string} dbname - the name of the database to delete from the catalog.
    		     * @param {function=} callback - (Optional) executed on database delete
    		     * @memberof LokiIndexedAdapter
    		     */
    		    LokiIndexedAdapter.prototype.deleteDatabase = function(dbname, callback)
    		    {
    		      var appName = this.app;
    		      var adapter = this;

    		      // lazy open/create db reference and pass callback ahead
    		      if (this.catalog === null || this.catalog.db === null) {
    		        this.catalog = new LokiCatalog(function(cat) {
    		          adapter.catalog = cat;

    		          adapter.deleteDatabase(dbname, callback);
    		        });

    		        return;
    		      }

    		      // catalog was already initialized, so just lookup object and delete by id
    		      this.catalog.getAppKey(appName, dbname, function(result) {
    		        var id = result.id;

    		        if (id !== 0) {
    		          adapter.catalog.deleteAppKey(id, callback);
    		        } else if (typeof (callback) === 'function') {
    		          callback({ success: true });
    		        }
    		      });
    		    };

    		    // alias
    		    LokiIndexedAdapter.prototype.deleteKey = LokiIndexedAdapter.prototype.deleteDatabase;

    		    /**
    		     * Removes all database partitions and pages with the base filename passed in.
    		     * This utility method does not (yet) guarantee async deletions will be completed before returning
    		     *
    		     * @param {string} dbname - the base filename which container, partitions, or pages are derived
    		     * @memberof LokiIndexedAdapter
    		     */
    		    LokiIndexedAdapter.prototype.deleteDatabasePartitions = function(dbname) {
    		      var self=this;
    		      this.getDatabaseList(function(result) {
    		        result.forEach(function(str) {
    		          if (str.startsWith(dbname)) {
    		            self.deleteDatabase(str);
    		          }
    		        });
    		      });
    		    };

    		    /**
    		     * Retrieves object array of catalog entries for current app.
    		     *
    		     * @example
    		     * idbAdapter.getDatabaseList(function(result) {
    		     *   // result is array of string names for that appcontext ('finance')
    		     *   result.forEach(function(str) {
    		     *     console.log(str);
    		     *   });
    		     * });
    		     *
    		     * @param {function} callback - should accept array of database names in the catalog for current app.
    		     * @memberof LokiIndexedAdapter
    		     */
    		    LokiIndexedAdapter.prototype.getDatabaseList = function(callback)
    		    {
    		      var appName = this.app;
    		      var adapter = this;

    		      // lazy open/create db reference so dont -need- callback in constructor
    		      if (this.catalog === null || this.catalog.db === null) {
    		        this.catalog = new LokiCatalog(function(cat) {
    		          adapter.catalog = cat;

    		          adapter.getDatabaseList(callback);
    		        });

    		        return;
    		      }

    		      // catalog already initialized
    		      // get all keys for current appName, and transpose results so just string array
    		      this.catalog.getAppKeys(appName, function(results) {
    		        var names = [];

    		        for(var idx = 0; idx < results.length; idx++) {
    		          names.push(results[idx].key);
    		        }

    		        if (typeof (callback) === 'function') {
    		          callback(names);
    		        }
    		        else {
    		          names.forEach(function(obj) {
    		            console.log(obj);
    		          });
    		        }
    		      });
    		    };

    		    // alias
    		    LokiIndexedAdapter.prototype.getKeyList = LokiIndexedAdapter.prototype.getDatabaseList;

    		    /**
    		     * Allows retrieval of list of all keys in catalog along with size
    		     *
    		     * @param {function} callback - (Optional) callback to accept result array.
    		     * @memberof LokiIndexedAdapter
    		     */
    		    LokiIndexedAdapter.prototype.getCatalogSummary = function(callback)
    		    {
    		      this.app;
    		      var adapter = this;

    		      // lazy open/create db reference
    		      if (this.catalog === null || this.catalog.db === null) {
    		        this.catalog = new LokiCatalog(function(cat) {
    		          adapter.catalog = cat;

    		          adapter.getCatalogSummary(callback);
    		        });

    		        return;
    		      }

    		      // catalog already initialized
    		      // get all keys for current appName, and transpose results so just string array
    		      this.catalog.getAllKeys(function(results) {
    		        var entries = [];
    		        var obj,
    		          size,
    		          oapp,
    		          okey,
    		          oval;

    		        for(var idx = 0; idx < results.length; idx++) {
    		          obj = results[idx];
    		          oapp = obj.app || '';
    		          okey = obj.key || '';
    		          oval = obj.val || '';

    		          // app and key are composited into an appkey column so we will mult by 2
    		          size = oapp.length * 2 + okey.length * 2 + oval.length + 1;

    		          entries.push({ "app": obj.app, "key": obj.key, "size": size });
    		        }

    		        if (typeof (callback) === 'function') {
    		          callback(entries);
    		        }
    		        else {
    		          entries.forEach(function(obj) {
    		            console.log(obj);
    		          });
    		        }
    		      });
    		    };

    		    /**
    		     * LokiCatalog - underlying App/Key/Value catalog persistence
    		     *    This non-interface class implements the actual persistence.
    		     *    Used by the IndexedAdapter class.
    		     */
    		    function LokiCatalog(callback)
    		    {
    		      this.db = null;
    		      this.initializeLokiCatalog(callback);
    		    }

    		    LokiCatalog.prototype.initializeLokiCatalog = function(callback) {
    		      var openRequest = indexedDB.open('LokiCatalog', 1);
    		      var cat = this;

    		      // If database doesn't exist yet or its version is lower than our version specified above (2nd param in line above)
    		      openRequest.onupgradeneeded = function(e) {
    		        var thisDB = e.target.result;
    		        if (thisDB.objectStoreNames.contains('LokiAKV')) {
    		          thisDB.deleteObjectStore('LokiAKV');
    		        }

    		        if(!thisDB.objectStoreNames.contains('LokiAKV')) {
    		          var objectStore = thisDB.createObjectStore('LokiAKV', { keyPath: 'id', autoIncrement:true });
    		          objectStore.createIndex('app', 'app', {unique:false});
    		          objectStore.createIndex('key', 'key', {unique:false});
    		          // hack to simulate composite key since overhead is low (main size should be in val field)
    		          // user (me) required to duplicate the app and key into comma delimited appkey field off object
    		          // This will allow retrieving single record with that composite key as well as
    		          // still supporting opening cursors on app or key alone
    		          objectStore.createIndex('appkey', 'appkey', {unique:true});
    		        }
    		      };

    		      openRequest.onsuccess = function(e) {
    		        cat.db = e.target.result;

    		        if (typeof (callback) === 'function') callback(cat);
    		      };

    		      openRequest.onerror = function(e) {
    		        throw e;
    		      };
    		    };

    		    LokiCatalog.prototype.getAppKey = function(app, key, callback) {
    		      var transaction = this.db.transaction(['LokiAKV'], 'readonly');
    		      var store = transaction.objectStore('LokiAKV');
    		      var index = store.index('appkey');
    		      var appkey = app + "," + key;
    		      var request = index.get(appkey);

    		      request.onsuccess = (function(usercallback) {
    		        return function(e) {
    		          var lres = e.target.result;

    		          if (lres === null || typeof(lres) === 'undefined') {
    		            lres = {
    		              id: 0,
    		              success: false
    		            };
    		          }

    		          if (typeof(usercallback) === 'function') {
    		            usercallback(lres);
    		          }
    		          else {
    		            console.log(lres);
    		          }
    		        };
    		      })(callback);

    		      request.onerror = (function(usercallback) {
    		        return function(e) {
    		          if (typeof(usercallback) === 'function') {
    		            usercallback({ id: 0, success: false });
    		          }
    		          else {
    		            throw e;
    		          }
    		        };
    		      })(callback);
    		    };

    		    LokiCatalog.prototype.getAppKeyById = function (id, callback, data) {
    		      var transaction = this.db.transaction(['LokiAKV'], 'readonly');
    		      var store = transaction.objectStore('LokiAKV');
    		      var request = store.get(id);

    		      request.onsuccess = (function(data, usercallback){
    		        return function(e) {
    		          if (typeof(usercallback) === 'function') {
    		            usercallback(e.target.result, data);
    		          }
    		          else {
    		            console.log(e.target.result);
    		          }
    		        };
    		      })(data, callback);
    		    };

    		    LokiCatalog.prototype.setAppKey = function (app, key, val, callback) {
    		      var transaction = this.db.transaction(['LokiAKV'], 'readwrite');
    		      var store = transaction.objectStore('LokiAKV');
    		      var index = store.index('appkey');
    		      var appkey = app + "," + key;
    		      var request = index.get(appkey);

    		      // first try to retrieve an existing object by that key
    		      // need to do this because to update an object you need to have id in object, otherwise it will append id with new autocounter and clash the unique index appkey
    		      request.onsuccess = function(e) {
    		        var res = e.target.result;

    		        if (res === null || res === undefined) {
    		          res = {
    		            app:app,
    		            key:key,
    		            appkey: app + ',' + key,
    		            val:val
    		          };
    		        }
    		        else {
    		          res.val = val;
    		        }

    		        var requestPut = store.put(res);

    		        requestPut.onerror = (function(usercallback) {
    		          return function(e) {
    		            if (typeof(usercallback) === 'function') {
    		              usercallback({ success: false });
    		            }
    		            else {
    		              console.error('LokiCatalog.setAppKey (set) onerror');
    		              console.error(request.error);
    		            }
    		          };

    		        })(callback);

    		        requestPut.onsuccess = (function(usercallback) {
    		          return function(e) {
    		            if (typeof(usercallback) === 'function') {
    		              usercallback({ success: true });
    		            }
    		          };
    		        })(callback);
    		      };

    		      request.onerror = (function(usercallback) {
    		        return function(e) {
    		          if (typeof(usercallback) === 'function') {
    		            usercallback({ success: false });
    		          }
    		          else {
    		            console.error('LokiCatalog.setAppKey (get) onerror');
    		            console.error(request.error);
    		          }
    		        };
    		      })(callback);
    		    };

    		    LokiCatalog.prototype.deleteAppKey = function (id, callback) {
    		      var transaction = this.db.transaction(['LokiAKV'], 'readwrite');
    		      var store = transaction.objectStore('LokiAKV');
    		      var request = store.delete(id);

    		      request.onsuccess = (function(usercallback) {
    		        return function(evt) {
    		          if (typeof(usercallback) === 'function') usercallback({ success: true });
    		        };
    		      })(callback);

    		      request.onerror = (function(usercallback) {
    		        return function(evt) {
    		          if (typeof(usercallback) === 'function') {
    		            usercallback({ success: false });
    		          }
    		          else {
    		            console.error('LokiCatalog.deleteAppKey raised onerror');
    		            console.error(request.error);
    		          }
    		        };
    		      })(callback);
    		    };

    		    LokiCatalog.prototype.getAppKeys = function(app, callback) {
    		      var transaction = this.db.transaction(['LokiAKV'], 'readonly');
    		      var store = transaction.objectStore('LokiAKV');
    		      var index = store.index('app');

    		      // We want cursor to all values matching our (single) app param
    		      var singleKeyRange = IDBKeyRange.only(app);

    		      // To use one of the key ranges, pass it in as the first argument of openCursor()/openKeyCursor()
    		      var cursor = index.openCursor(singleKeyRange);

    		      // cursor internally, pushing results into this.data[] and return
    		      // this.data[] when done (similar to service)
    		      var localdata = [];

    		      cursor.onsuccess = (function(data, callback) {
    		        return function(e) {
    		          var cursor = e.target.result;
    		          if (cursor) {
    		            var currObject = cursor.value;

    		            data.push(currObject);

    		            cursor.continue();
    		          }
    		          else {
    		            if (typeof(callback) === 'function') {
    		              callback(data);
    		            }
    		            else {
    		              console.log(data);
    		            }
    		          }
    		        };
    		      })(localdata, callback);

    		      cursor.onerror = (function(usercallback) {
    		        return function(e) {
    		          if (typeof(usercallback) === 'function') {
    		            usercallback(null);
    		          }
    		          else {
    		            console.error('LokiCatalog.getAppKeys raised onerror');
    		            console.error(e);
    		          }
    		        };
    		      })(callback);

    		    };

    		    // Hide 'cursoring' and return array of { id: id, key: key }
    		    LokiCatalog.prototype.getAllKeys = function (callback) {
    		      var transaction = this.db.transaction(['LokiAKV'], 'readonly');
    		      var store = transaction.objectStore('LokiAKV');
    		      var cursor = store.openCursor();

    		      var localdata = [];

    		      cursor.onsuccess = (function(data, callback) {
    		        return function(e) {
    		          var cursor = e.target.result;
    		          if (cursor) {
    		            var currObject = cursor.value;

    		            data.push(currObject);

    		            cursor.continue();
    		          }
    		          else {
    		            if (typeof(callback) === 'function') {
    		              callback(data);
    		            }
    		            else {
    		              console.log(data);
    		            }
    		          }
    		        };
    		      })(localdata, callback);

    		      cursor.onerror = (function(usercallback) {
    		        return function(e) {
    		          if (typeof(usercallback) === 'function') usercallback(null);
    		        };
    		      })(callback);

    		    };

    		    return LokiIndexedAdapter;

    		  }());
    		})); 
    	} (lokiIndexedAdapter));
    	return lokiIndexedAdapter.exports;
    }

    var _polyfillNode_fs = {};

    var _polyfillNode_fs$1 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        default: _polyfillNode_fs
    });

    var require$$1 = /*@__PURE__*/getAugmentedNamespace(_polyfillNode_fs$1);

    (function (module, exports) {
    	(function (root, factory) {
    	  {
    	    // CommonJS
    	    module.exports = factory();
    	  }
    	}(commonjsGlobal, function () {

    	  return (function () {

    	    var hasOwnProperty = Object.prototype.hasOwnProperty;

    	    function deepFreeze(obj) {
    	      var prop, i;
    	      if (Array.isArray(obj)) {
    	        for (i = 0; i < obj.length; i++) {
    	          deepFreeze(obj[i]);
    	        }
    	        freeze(obj);
    	      } else if (obj !== null && (typeof obj === 'object')) {
    	        for (prop in obj) {
    	          if (obj.hasOwnProperty(prop)) {
    	            deepFreeze(obj[prop]);
    	          }
    	        }
    	        freeze(obj);
    	      }
    	    }

    	    function freeze(obj) {
    	      if (!Object.isFrozen(obj)) {
    	        Object.freeze(obj);
    	      }
    	    }

    	    function unFreeze(obj) {
    	      if (!Object.isFrozen(obj)) {
    	        return obj;
    	      }
    	      return clone(obj, 'shallow');
    	    }

    	    var Utils = {
    	      copyProperties: function (src, dest) {
    	        var prop;
    	        for (prop in src) {
    	          dest[prop] = src[prop];
    	        }
    	      },
    	      // used to recursively scan hierarchical transform step object for param substitution
    	      resolveTransformObject: function (subObj, params, depth) {
    	        var prop,
    	          pname;

    	        if (typeof depth !== 'number') {
    	          depth = 0;
    	        }

    	        if (++depth >= 10) return subObj;

    	        for (prop in subObj) {
    	          if (typeof subObj[prop] === 'string' && subObj[prop].indexOf("[%lktxp]") === 0) {
    	            pname = subObj[prop].substring(8);
    	            if (params.hasOwnProperty(pname)) {
    	              subObj[prop] = params[pname];
    	            }
    	          } else if (typeof subObj[prop] === "object") {
    	            subObj[prop] = Utils.resolveTransformObject(subObj[prop], params, depth);
    	          }
    	        }

    	        return subObj;
    	      },
    	      // top level utility to resolve an entire (single) transform (array of steps) for parameter substitution
    	      resolveTransformParams: function (transform, params) {
    	        var idx,
    	          clonedStep,
    	          resolvedTransform = [];

    	        if (typeof params === 'undefined') return transform;

    	        // iterate all steps in the transform array
    	        for (idx = 0; idx < transform.length; idx++) {
    	          // clone transform so our scan/replace can operate directly on cloned transform
    	          clonedStep = clone(transform[idx], "shallow-recurse-objects");
    	          resolvedTransform.push(Utils.resolveTransformObject(clonedStep, params));
    	        }

    	        return resolvedTransform;
    	      },

    	      // By default (if usingDotNotation is false), looks up path in
    	      // object via `object[path]`
    	      //
    	      // If `usingDotNotation` is true, then the path is assumed to
    	      // represent a nested path. It can be in the form of an array of
    	      // field names, or a period delimited string. The function will
    	      // look up the value of object[path[0]], and then call
    	      // result[path[1]] on the result, etc etc.
    	      //
    	      // If `usingDotNotation` is true, this function still supports
    	      // non nested fields.
    	      //
    	      // `usingDotNotation` is a performance optimization. The caller
    	      // may know that a path is *not* nested. In which case, this
    	      // function avoids a costly string.split('.')
    	      //
    	      // examples:
    	      // getIn({a: 1}, "a") => 1
    	      // getIn({a: 1}, "a", true) => 1
    	      // getIn({a: {b: 1}}, ["a", "b"], true) => 1
    	      // getIn({a: {b: 1}}, "a.b", true) => 1
    	      getIn: function (object, path, usingDotNotation) {
    	        if (object == null) {
    	          return undefined;
    	        }
    	        if (!usingDotNotation) {
    	          return object[path];
    	        }

    	        if (typeof (path) === "string") {
    	          path = path.split(".");
    	        }

    	        if (!Array.isArray(path)) {
    	          throw new Error("path must be a string or array. Found " + typeof (path));
    	        }

    	        var index = 0,
    	          length = path.length;

    	        while (object != null && index < length) {
    	          object = object[path[index++]];
    	        }
    	        return (index && index == length) ? object : undefined;
    	      }
    	    };

    	    // wrapping in object to expose to default export for potential user override.
    	    // warning: overriding these methods will override behavior for all loki db instances in memory.
    	    // warning: if you use binary indices these comparators should be the same for all inserts/updates/removes.
    	    var Comparators = {
    	      aeq: aeqHelper,
    	      lt: ltHelper,
    	      gt: gtHelper
    	    };

    	    /** Helper function for determining 'loki' abstract equality which is a little more abstract than ==
    	     *     aeqHelper(5, '5') === true
    	     *     aeqHelper(5.0, '5') === true
    	     *     aeqHelper(new Date("1/1/2011"), new Date("1/1/2011")) === true
    	     *     aeqHelper({a:1}, {z:4}) === true (all objects sorted equally)
    	     *     aeqHelper([1, 2, 3], [1, 3]) === false
    	     *     aeqHelper([1, 2, 3], [1, 2, 3]) === true
    	     *     aeqHelper(undefined, null) === true
    	     */
    	    function aeqHelper(prop1, prop2) {
    	      var cv1, cv2, t1, t2;

    	      if (prop1 === prop2) return true;

    	      // 'falsy' and Boolean handling
    	      if (!prop1 || !prop2 || prop1 === true || prop2 === true || prop1 !== prop1 || prop2 !== prop2) {
    	        // dates and NaN conditions (typed dates before serialization)
    	        switch (prop1) {
    	          case undefined: t1 = 1; break;
    	          case null: t1 = 1; break;
    	          case false: t1 = 3; break;
    	          case true: t1 = 4; break;
    	          case "": t1 = 5; break;
    	          default: t1 = (prop1 === prop1) ? 9 : 0; break;
    	        }

    	        switch (prop2) {
    	          case undefined: t2 = 1; break;
    	          case null: t2 = 1; break;
    	          case false: t2 = 3; break;
    	          case true: t2 = 4; break;
    	          case "": t2 = 5; break;
    	          default: t2 = (prop2 === prop2) ? 9 : 0; break;
    	        }

    	        // one or both is edge case
    	        if (t1 !== 9 || t2 !== 9) {
    	          return (t1 === t2);
    	        }
    	      }

    	      // Handle 'Number-like' comparisons
    	      cv1 = Number(prop1);
    	      cv2 = Number(prop2);

    	      // if one or both are 'number-like'...
    	      if (cv1 === cv1 || cv2 === cv2) {
    	        return (cv1 === cv2);
    	      }

    	      // not strict equal nor less than nor gt so must be mixed types, convert to string and use that to compare
    	      cv1 = prop1.toString();
    	      cv2 = prop2.toString();

    	      return (cv1 == cv2);
    	    }

    	    /** Helper function for determining 'less-than' conditions for ops, sorting, and binary indices.
    	     *     In the future we might want $lt and $gt ops to use their own functionality/helper.
    	     *     Since binary indices on a property might need to index [12, NaN, new Date(), Infinity], we
    	     *     need this function (as well as gtHelper) to always ensure one value is LT, GT, or EQ to another.
    	     */
    	    function ltHelper(prop1, prop2, equal) {
    	      var cv1, cv2, t1, t2;

    	      // if one of the params is falsy or strictly true or not equal to itself
    	      // 0, 0.0, "", NaN, null, undefined, not defined, false, true
    	      if (!prop1 || !prop2 || prop1 === true || prop2 === true || prop1 !== prop1 || prop2 !== prop2) {
    	        switch (prop1) {
    	          case undefined: t1 = 1; break;
    	          case null: t1 = 1; break;
    	          case false: t1 = 3; break;
    	          case true: t1 = 4; break;
    	          case "": t1 = 5; break;
    	          // if strict equal probably 0 so sort higher, otherwise probably NaN so sort lower than even null
    	          default: t1 = (prop1 === prop1) ? 9 : 0; break;
    	        }

    	        switch (prop2) {
    	          case undefined: t2 = 1; break;
    	          case null: t2 = 1; break;
    	          case false: t2 = 3; break;
    	          case true: t2 = 4; break;
    	          case "": t2 = 5; break;
    	          default: t2 = (prop2 === prop2) ? 9 : 0; break;
    	        }

    	        // one or both is edge case
    	        if (t1 !== 9 || t2 !== 9) {
    	          return (t1 === t2) ? equal : (t1 < t2);
    	        }
    	      }

    	      // if both are numbers (string encoded or not), compare as numbers
    	      cv1 = Number(prop1);
    	      cv2 = Number(prop2);

    	      if (cv1 === cv1 && cv2 === cv2) {
    	        if (cv1 < cv2) return true;
    	        if (cv1 > cv2) return false;
    	        return equal;
    	      }

    	      if (cv1 === cv1 && cv2 !== cv2) {
    	        return true;
    	      }

    	      if (cv2 === cv2 && cv1 !== cv1) {
    	        return false;
    	      }

    	      if (prop1 < prop2) return true;
    	      if (prop1 > prop2) return false;
    	      if (prop1 == prop2) return equal;

    	      // not strict equal nor less than nor gt so must be mixed types, convert to string and use that to compare
    	      cv1 = prop1.toString();
    	      cv2 = prop2.toString();

    	      if (cv1 < cv2) {
    	        return true;
    	      }

    	      if (cv1 == cv2) {
    	        return equal;
    	      }

    	      return false;
    	    }

    	    function gtHelper(prop1, prop2, equal) {
    	      var cv1, cv2, t1, t2;

    	      // 'falsy' and Boolean handling
    	      if (!prop1 || !prop2 || prop1 === true || prop2 === true || prop1 !== prop1 || prop2 !== prop2) {
    	        switch (prop1) {
    	          case undefined: t1 = 1; break;
    	          case null: t1 = 1; break;
    	          case false: t1 = 3; break;
    	          case true: t1 = 4; break;
    	          case "": t1 = 5; break;
    	          // NaN 0
    	          default: t1 = (prop1 === prop1) ? 9 : 0; break;
    	        }

    	        switch (prop2) {
    	          case undefined: t2 = 1; break;
    	          case null: t2 = 1; break;
    	          case false: t2 = 3; break;
    	          case true: t2 = 4; break;
    	          case "": t2 = 5; break;
    	          default: t2 = (prop2 === prop2) ? 9 : 0; break;
    	        }

    	        // one or both is edge case
    	        if (t1 !== 9 || t2 !== 9) {
    	          return (t1 === t2) ? equal : (t1 > t2);
    	        }
    	      }

    	      // if both are numbers (string encoded or not), compare as numbers
    	      cv1 = Number(prop1);
    	      cv2 = Number(prop2);
    	      if (cv1 === cv1 && cv2 === cv2) {
    	        if (cv1 > cv2) return true;
    	        if (cv1 < cv2) return false;
    	        return equal;
    	      }

    	      if (cv1 === cv1 && cv2 !== cv2) {
    	        return false;
    	      }

    	      if (cv2 === cv2 && cv1 !== cv1) {
    	        return true;
    	      }

    	      if (prop1 > prop2) return true;
    	      if (prop1 < prop2) return false;
    	      if (prop1 == prop2) return equal;

    	      // not strict equal nor less than nor gt so must be dates or mixed types
    	      // convert to string and use that to compare
    	      cv1 = prop1.toString();
    	      cv2 = prop2.toString();

    	      if (cv1 > cv2) {
    	        return true;
    	      }

    	      if (cv1 == cv2) {
    	        return equal;
    	      }

    	      return false;
    	    }

    	    function sortHelper(prop1, prop2, desc) {
    	      if (Comparators.aeq(prop1, prop2)) return 0;

    	      if (Comparators.lt(prop1, prop2, false)) {
    	        return (desc) ? (1) : (-1);
    	      }

    	      if (Comparators.gt(prop1, prop2, false)) {
    	        return (desc) ? (-1) : (1);
    	      }

    	      // not lt, not gt so implied equality-- date compatible
    	      return 0;
    	    }

    	    /**
    	     * compoundeval() - helper function for compoundsort(), performing individual object comparisons
    	     *
    	     * @param {array} properties - array of property names, in order, by which to evaluate sort order
    	     * @param {object} obj1 - first object to compare
    	     * @param {object} obj2 - second object to compare
    	     * @returns {integer} 0, -1, or 1 to designate if identical (sortwise) or which should be first
    	     */
    	    function compoundeval(properties, obj1, obj2) {
    	      var res = 0;
    	      var prop, field, val1, val2, arr;
    	      for (var i = 0, len = properties.length; i < len; i++) {
    	        prop = properties[i];
    	        field = prop[0];
    	        if (~field.indexOf('.')) {
    	          arr = field.split('.');
    	          val1 = Utils.getIn(obj1, arr, true);
    	          val2 = Utils.getIn(obj2, arr, true);
    	        } else {
    	          val1 = obj1[field];
    	          val2 = obj2[field];
    	        }
    	        res = sortHelper(val1, val2, prop[1]);
    	        if (res !== 0) {
    	          return res;
    	        }
    	      }
    	      return 0;
    	    }

    	    /**
    	     * dotSubScan - helper function used for dot notation queries.
    	     *
    	     * @param {object} root - object to traverse
    	     * @param {array} paths - array of properties to drill into
    	     * @param {function} fun - evaluation function to test with
    	     * @param {any} value - comparative value to also pass to (compare) fun
    	     * @param {any} extra - extra arg to also pass to compare fun
    	     * @param {number} poffset - index of the item in 'paths' to start the sub-scan from
    	     */
    	    function dotSubScan(root, paths, fun, value, extra, poffset) {
    	      var pathOffset = poffset || 0;
    	      var path = paths[pathOffset];

    	      var valueFound = false;
    	      var element;
    	      if (typeof root === 'object' && path in root) {
    	        element = root[path];
    	      }
    	      if (pathOffset + 1 >= paths.length) {
    	        // if we have already expanded out the dot notation,
    	        // then just evaluate the test function and value on the element
    	        valueFound = fun(element, value, extra);
    	      } else if (Array.isArray(element)) {
    	        for (var index = 0, len = element.length; index < len; index += 1) {
    	          valueFound = dotSubScan(element[index], paths, fun, value, extra, pathOffset + 1);
    	          if (valueFound === true) {
    	            break;
    	          }
    	        }
    	      } else {
    	        valueFound = dotSubScan(element, paths, fun, value, extra, pathOffset + 1);
    	      }

    	      return valueFound;
    	    }

    	    function containsCheckFn(a) {
    	      if (typeof a === 'string' || Array.isArray(a)) {
    	        return function (b) {
    	          return a.indexOf(b) !== -1;
    	        };
    	      } else if (typeof a === 'object' && a !== null) {
    	        return function (b) {
    	          return hasOwnProperty.call(a, b);
    	        };
    	      }
    	      return null;
    	    }

    	    function doQueryOp(val, op, record) {
    	      for (var p in op) {
    	        if (hasOwnProperty.call(op, p)) {
    	          return LokiOps[p](val, op[p], record);
    	        }
    	      }
    	      return false;
    	    }

    	    var LokiOps = {
    	      // comparison operators
    	      // a is the value in the collection
    	      // b is the query value
    	      $eq: function (a, b) {
    	        return a === b;
    	      },

    	      // abstract/loose equality
    	      $aeq: function (a, b) {
    	        return a == b;
    	      },

    	      $ne: function (a, b) {
    	        // ecma 5 safe test for NaN
    	        if (b !== b) {
    	          // ecma 5 test value is not NaN
    	          return (a === a);
    	        }

    	        return a !== b;
    	      },
    	      // date equality / loki abstract equality test
    	      $dteq: function (a, b) {
    	        return Comparators.aeq(a, b);
    	      },

    	      // loki comparisons: return identical unindexed results as indexed comparisons
    	      $gt: function (a, b) {
    	        return Comparators.gt(a, b, false);
    	      },

    	      $gte: function (a, b) {
    	        return Comparators.gt(a, b, true);
    	      },

    	      $lt: function (a, b) {
    	        return Comparators.lt(a, b, false);
    	      },

    	      $lte: function (a, b) {
    	        return Comparators.lt(a, b, true);
    	      },

    	      // lightweight javascript comparisons
    	      $jgt: function (a, b) {
    	        return a > b;
    	      },

    	      $jgte: function (a, b) {
    	        return a >= b;
    	      },

    	      $jlt: function (a, b) {
    	        return a < b;
    	      },

    	      $jlte: function (a, b) {
    	        return a <= b;
    	      },

    	      // ex : coll.find({'orderCount': {$between: [10, 50]}});
    	      $between: function (a, vals) {
    	        if (a === undefined || a === null) return false;
    	        return (Comparators.gt(a, vals[0], true) && Comparators.lt(a, vals[1], true));
    	      },

    	      $jbetween: function (a, vals) {
    	        if (a === undefined || a === null) return false;
    	        return (a >= vals[0] && a <= vals[1]);
    	      },

    	      $in: function (a, b) {
    	        return b.indexOf(a) !== -1;
    	      },

    	      $inSet: function(a, b) {
    	        return b.has(a);
    	      },

    	      $nin: function (a, b) {
    	        return b.indexOf(a) === -1;
    	      },

    	      $keyin: function (a, b) {
    	        return a in b;
    	      },

    	      $nkeyin: function (a, b) {
    	        return !(a in b);
    	      },

    	      $definedin: function (a, b) {
    	        return b[a] !== undefined;
    	      },

    	      $undefinedin: function (a, b) {
    	        return b[a] === undefined;
    	      },

    	      $regex: function (a, b) {
    	        return b.test(a);
    	      },

    	      $containsString: function (a, b) {
    	        return (typeof a === 'string') && (a.indexOf(b) !== -1);
    	      },

    	      $containsNone: function (a, b) {
    	        return !LokiOps.$containsAny(a, b);
    	      },

    	      $containsAny: function (a, b) {
    	        var checkFn = containsCheckFn(a);
    	        if (checkFn !== null) {
    	          return (Array.isArray(b)) ? (b.some(checkFn)) : (checkFn(b));
    	        }
    	        return false;
    	      },

    	      $contains: function (a, b) {
    	        var checkFn = containsCheckFn(a);
    	        if (checkFn !== null) {
    	          return (Array.isArray(b)) ? (b.every(checkFn)) : (checkFn(b));
    	        }
    	        return false;
    	      },

    	      $elemMatch: function (a, b) {
    	        if (Array.isArray(a)) {
    	          return a.some(function (item) {
    	            return Object.keys(b).every(function (property) {
    	              var filter = b[property];
    	              if (!(typeof filter === 'object' && filter)) {
    	                filter = { $eq: filter };
    	              }

    	              if (property.indexOf('.') !== -1) {
    	                return dotSubScan(item, property.split('.'), doQueryOp, b[property], item);
    	              }
    	              return doQueryOp(item[property], filter, item);
    	            });
    	          });
    	        }
    	        return false;
    	      },

    	      $type: function (a, b, record) {
    	        var type = typeof a;
    	        if (type === 'object') {
    	          if (Array.isArray(a)) {
    	            type = 'array';
    	          } else if (a instanceof Date) {
    	            type = 'date';
    	          }
    	        }
    	        return (typeof b !== 'object') ? (type === b) : doQueryOp(type, b, record);
    	      },

    	      $finite: function (a, b) {
    	        return (b === isFinite(a));
    	      },

    	      $size: function (a, b, record) {
    	        if (Array.isArray(a)) {
    	          return (typeof b !== 'object') ? (a.length === b) : doQueryOp(a.length, b, record);
    	        }
    	        return false;
    	      },

    	      $len: function (a, b, record) {
    	        if (typeof a === 'string') {
    	          return (typeof b !== 'object') ? (a.length === b) : doQueryOp(a.length, b, record);
    	        }
    	        return false;
    	      },

    	      $where: function (a, b) {
    	        return b(a) === true;
    	      },

    	      // field-level logical operators
    	      // a is the value in the collection
    	      // b is the nested query operation (for '$not')
    	      //   or an array of nested query operations (for '$and' and '$or')
    	      $not: function (a, b, record) {
    	        return !doQueryOp(a, b, record);
    	      },

    	      $and: function (a, b, record) {
    	        for (var idx = 0, len = b.length; idx < len; idx += 1) {
    	          if (!doQueryOp(a, b[idx], record)) {
    	            return false;
    	          }
    	        }
    	        return true;
    	      },

    	      $or: function (a, b, record) {
    	        for (var idx = 0, len = b.length; idx < len; idx += 1) {
    	          if (doQueryOp(a, b[idx], record)) {
    	            return true;
    	          }
    	        }
    	        return false;
    	      },

    	      $exists: function (a, b) {
    	        if (b) {
    	          return a !== undefined;
    	        } else {
    	          return a === undefined;
    	        }
    	      }
    	    };

    	    // ops that can be used with { $$op: 'column-name' } syntax
    	    var valueLevelOps = ['$eq', '$aeq', '$ne', '$dteq', '$gt', '$gte', '$lt', '$lte', '$jgt', '$jgte', '$jlt', '$jlte', '$type'];
    	    valueLevelOps.forEach(function (op) {
    	      var fun = LokiOps[op];
    	      LokiOps['$' + op] = function (a, spec, record) {
    	        if (typeof spec === 'string') {
    	          return fun(a, record[spec]);
    	        } else if (typeof spec === 'function') {
    	          return fun(a, spec(record));
    	        } else {
    	          throw new Error('Invalid argument to $$ matcher');
    	        }
    	      };
    	    });

    	    // if an op is registered in this object, our 'calculateRange' can use it with our binary indices.
    	    // if the op is registered to a function, we will run that function/op as a 2nd pass filter on results.
    	    // those 2nd pass filter functions should be similar to LokiOps functions, accepting 2 vals to compare.
    	    var indexedOps = {
    	      $eq: LokiOps.$eq,
    	      $aeq: true,
    	      $dteq: true,
    	      $gt: true,
    	      $gte: true,
    	      $lt: true,
    	      $lte: true,
    	      $in: true,
    	      $between: true
    	    };

    	    function clone(data, method) {
    	      if (data === null || data === undefined) {
    	        return null;
    	      }

    	      var cloneMethod = method || 'parse-stringify',
    	        cloned;

    	      switch (cloneMethod) {
    	        case "parse-stringify":
    	          cloned = JSON.parse(JSON.stringify(data));
    	          break;
    	        case "jquery-extend-deep":
    	          cloned = jQuery.extend(true, {}, data);
    	          break;
    	        case "shallow":
    	          // more compatible method for older browsers
    	          cloned = Object.create(data.constructor.prototype);
    	          Object.keys(data).map(function (i) {
    	            cloned[i] = data[i];
    	          });
    	          break;
    	        case "shallow-assign":
    	          // should be supported by newer environments/browsers
    	          cloned = Object.create(data.constructor.prototype);
    	          Object.assign(cloned, data);
    	          break;
    	        case "shallow-recurse-objects":
    	          // shallow clone top level properties
    	          cloned = clone(data, "shallow");
    	          var keys = Object.keys(data);
    	          // for each of the top level properties which are object literals, recursively shallow copy
    	          keys.forEach(function (key) {
    	            if (typeof data[key] === "object" && data[key].constructor.name === "Object") {
    	              cloned[key] = clone(data[key], "shallow-recurse-objects");
    	            } else if (Array.isArray(data[key])) {
    	              cloned[key] = cloneObjectArray(data[key], "shallow-recurse-objects");
    	            }
    	          });
    	          break;
    	      }

    	      return cloned;
    	    }

    	    function cloneObjectArray(objarray, method) {
    	      if (method == "parse-stringify") {
    	        return clone(objarray, method);
    	      }
    	      var result = [];
    	      for (var i = 0, len = objarray.length; i < len; i++) {
    	        result[i] = clone(objarray[i], method);
    	      }
    	      return result;
    	    }

    	    function localStorageAvailable() {
    	      try {
    	        return (window && window.localStorage !== undefined && window.localStorage !== null);
    	      } catch (e) {
    	        return false;
    	      }
    	    }


    	    /**
    	     * LokiEventEmitter is a minimalist version of EventEmitter. It enables any
    	     * constructor that inherits EventEmitter to emit events and trigger
    	     * listeners that have been added to the event through the on(event, callback) method
    	     *
    	     * @constructor LokiEventEmitter
    	     */
    	    function LokiEventEmitter() { }

    	    /**
    	     * @prop {hashmap} events - a hashmap, with each property being an array of callbacks
    	     * @memberof LokiEventEmitter
    	     */
    	    LokiEventEmitter.prototype.events = {};

    	    /**
    	     * @prop {boolean} asyncListeners - boolean determines whether or not the callbacks associated with each event
    	     * should happen in an async fashion or not
    	     * Default is false, which means events are synchronous
    	     * @memberof LokiEventEmitter
    	     */
    	    LokiEventEmitter.prototype.asyncListeners = false;

    	    /**
    	     * on(eventName, listener) - adds a listener to the queue of callbacks associated to an event
    	     * @param {string|string[]} eventName - the name(s) of the event(s) to listen to
    	     * @param {function} listener - callback function of listener to attach
    	     * @returns {int} the index of the callback in the array of listeners for a particular event
    	     * @memberof LokiEventEmitter
    	     */
    	    LokiEventEmitter.prototype.on = function (eventName, listener) {
    	      var event;
    	      var self = this;

    	      if (Array.isArray(eventName)) {
    	        eventName.forEach(function (currentEventName) {
    	          self.on(currentEventName, listener);
    	        });
    	        return listener;
    	      }

    	      event = this.events[eventName];
    	      if (!event) {
    	        event = this.events[eventName] = [];
    	      }
    	      event.push(listener);
    	      return listener;
    	    };

    	    /**
    	     * emit(eventName, data) - emits a particular event
    	     * with the option of passing optional parameters which are going to be processed by the callback
    	     * provided signatures match (i.e. if passing emit(event, arg0, arg1) the listener should take two parameters)
    	     * @param {string} eventName - the name of the event
    	     * @param {object=} data - optional object passed with the event
    	     * @memberof LokiEventEmitter
    	     */
    	    LokiEventEmitter.prototype.emit = function (eventName) {
    	      var self = this;
    	      var selfArgs;
    	      if (eventName && this.events[eventName]) {
    	        if (this.events[eventName].length) {
    	          selfArgs = Array.prototype.slice.call(arguments, 1);
    	          this.events[eventName].forEach(function (listener) {
    	            if (self.asyncListeners) {
    	              setTimeout(function () {
    	                listener.apply(self, selfArgs);
    	              }, 1);
    	            } else {
    	              listener.apply(self, selfArgs);
    	            }
    	          });
    	        }
    	      } else {
    	        throw new Error('No event ' + eventName + ' defined');
    	      }
    	    };

    	    /**
    	     * Alias of LokiEventEmitter.prototype.on
    	     * addListener(eventName, listener) - adds a listener to the queue of callbacks associated to an event
    	     * @param {string|string[]} eventName - the name(s) of the event(s) to listen to
    	     * @param {function} listener - callback function of listener to attach
    	     * @returns {int} the index of the callback in the array of listeners for a particular event
    	     * @memberof LokiEventEmitter
    	     */
    	    LokiEventEmitter.prototype.addListener = LokiEventEmitter.prototype.on;

    	    /**
    	     * removeListener() - removes the listener at position 'index' from the event 'eventName'
    	     * @param {string|string[]} eventName - the name(s) of the event(s) which the listener is attached to
    	     * @param {function} listener - the listener callback function to remove from emitter
    	     * @memberof LokiEventEmitter
    	     */
    	    LokiEventEmitter.prototype.removeListener = function (eventName, listener) {
    	      var self = this;

    	      if (Array.isArray(eventName)) {
    	        eventName.forEach(function (currentEventName) {
    	          self.removeListener(currentEventName, listener);
    	        });

    	        return;
    	      }

    	      if (this.events[eventName]) {
    	        var listeners = this.events[eventName];
    	        listeners.splice(listeners.indexOf(listener), 1);
    	      }
    	    };

    	    /**
    	     * Loki: The main database class
    	     * @constructor Loki
    	     * @implements LokiEventEmitter
    	     * @param {string} filename - name of the file to be saved to
    	     * @param {object=} options - (Optional) config options object
    	     * @param {string} options.env - override environment detection as 'NODEJS', 'BROWSER', 'CORDOVA'
    	     * @param {boolean} [options.verbose=false] - enable console output
    	     * @param {boolean} [options.autosave=false] - enables autosave
    	     * @param {int} [options.autosaveInterval=5000] - time interval (in milliseconds) between saves (if dirty)
    	     * @param {boolean} [options.autoload=false] - enables autoload on loki instantiation
    	     * @param {function} options.autoloadCallback - user callback called after database load
    	     * @param {adapter} options.adapter - an instance of a loki persistence adapter
    	     * @param {string} [options.serializationMethod='normal'] - ['normal', 'pretty', 'destructured']
    	     * @param {string} options.destructureDelimiter - string delimiter used for destructured serialization
    	     * @param {boolean} [options.throttledSaves=true] - debounces multiple calls to to saveDatabase reducing number of disk I/O operations
    	                                                and guaranteeing proper serialization of the calls.
    	     */
    	    function Loki(filename, options) {
    	      this.filename = filename || 'loki.db';
    	      this.collections = [];

    	      // persist version of code which created the database to the database.
    	      // could use for upgrade scenarios
    	      this.databaseVersion = 1.5;
    	      this.engineVersion = 1.5;

    	      // autosave support (disabled by default)
    	      // pass autosave: true, autosaveInterval: 6000 in options to set 6 second autosave
    	      this.autosave = false;
    	      this.autosaveInterval = 5000;
    	      this.autosaveHandle = null;
    	      this.throttledSaves = true;

    	      this.options = {};

    	      // currently keeping persistenceMethod and persistenceAdapter as loki level properties that
    	      // will not or cannot be deserialized.  You are required to configure persistence every time
    	      // you instantiate a loki object (or use default environment detection) in order to load the database anyways.

    	      // persistenceMethod could be 'fs', 'localStorage', or 'adapter'
    	      // this is optional option param, otherwise environment detection will be used
    	      // if user passes their own adapter we will force this method to 'adapter' later, so no need to pass method option.
    	      this.persistenceMethod = null;

    	      // retain reference to optional (non-serializable) persistenceAdapter 'instance'
    	      this.persistenceAdapter = null;

    	      // flags used to throttle saves
    	      this.throttledSavePending = false;
    	      this.throttledCallbacks = [];

    	      // enable console output if verbose flag is set (disabled by default)
    	      this.verbose = options && options.hasOwnProperty('verbose') ? options.verbose : false;

    	      this.events = {
    	        'init': [],
    	        'loaded': [],
    	        'flushChanges': [],
    	        'close': [],
    	        'changes': [],
    	        'warning': []
    	      };

    	      var getENV = function () {
    	        if (typeof commonjsGlobal !== 'undefined' && (commonjsGlobal.android || commonjsGlobal.NSObject)) {
    	          // If no adapter assume nativescript which needs adapter to be passed manually
    	          return 'NATIVESCRIPT'; //nativescript
    	        }

    	        if (typeof window === 'undefined') {
    	          return 'NODEJS';
    	        }

    	        if (typeof commonjsGlobal !== 'undefined' && commonjsGlobal.window && typeof browser$1 !== 'undefined') {
    	          return 'NODEJS'; //node-webkit
    	        }

    	        if (typeof document !== 'undefined') {
    	          if (document.URL.indexOf('http://') === -1 && document.URL.indexOf('https://') === -1) {
    	            return 'CORDOVA';
    	          }
    	          return 'BROWSER';
    	        }
    	        return 'CORDOVA';
    	      };

    	      // refactored environment detection due to invalid detection for browser environments.
    	      // if they do not specify an options.env we want to detect env rather than default to nodejs.
    	      // currently keeping two properties for similar thing (options.env and options.persistenceMethod)
    	      //   might want to review whether we can consolidate.
    	      if (options && options.hasOwnProperty('env')) {
    	        this.ENV = options.env;
    	      } else {
    	        this.ENV = getENV();
    	      }

    	      // not sure if this is necessary now that i have refactored the line above
    	      if (this.ENV === 'undefined') {
    	        this.ENV = 'NODEJS';
    	      }

    	      this.configureOptions(options, true);

    	      this.on('init', this.clearChanges);

    	    }

    	    // db class is an EventEmitter
    	    Loki.prototype = new LokiEventEmitter();
    	    Loki.prototype.constructor = Loki;

    	    // experimental support for browserify's abstract syntax scan to pick up dependency of indexed adapter.
    	    // Hopefully, once this hits npm a browserify require of lokijs should scan the main file and detect this indexed adapter reference.
    	    Loki.prototype.getIndexedAdapter = function () {
    	      var adapter;

    	      if (typeof commonjsRequire === 'function') {
    	        adapter = requireLokiIndexedAdapter();
    	      }

    	      return adapter;
    	    };


    	    /**
    	     * Allows reconfiguring database options
    	     *
    	     * @param {object} options - configuration options to apply to loki db object
    	     * @param {string} options.env - override environment detection as 'NODEJS', 'BROWSER', 'CORDOVA'
    	     * @param {boolean} options.verbose - enable console output (default is 'false')
    	     * @param {boolean} options.autosave - enables autosave
    	     * @param {int} options.autosaveInterval - time interval (in milliseconds) between saves (if dirty)
    	     * @param {boolean} options.autoload - enables autoload on loki instantiation
    	     * @param {function} options.autoloadCallback - user callback called after database load
    	     * @param {adapter} options.adapter - an instance of a loki persistence adapter
    	     * @param {string} options.serializationMethod - ['normal', 'pretty', 'destructured']
    	     * @param {string} options.destructureDelimiter - string delimiter used for destructured serialization
    	     * @param {boolean} initialConfig - (internal) true is passed when loki ctor is invoking
    	     * @memberof Loki
    	     */
    	    Loki.prototype.configureOptions = function (options, initialConfig) {
    	      var defaultPersistence = {
    	        'NODEJS': 'fs',
    	        'BROWSER': 'localStorage',
    	        'CORDOVA': 'localStorage',
    	        'MEMORY': 'memory'
    	      },
    	        persistenceMethods = {
    	          'fs': LokiFsAdapter,
    	          'localStorage': LokiLocalStorageAdapter,
    	          'memory': LokiMemoryAdapter
    	        };

    	      this.options = {};

    	      this.persistenceMethod = null;
    	      // retain reference to optional persistence adapter 'instance'
    	      // currently keeping outside options because it can't be serialized
    	      this.persistenceAdapter = null;

    	      // process the options
    	      if (typeof (options) !== 'undefined') {
    	        this.options = options;

    	        if (this.options.hasOwnProperty('persistenceMethod')) {
    	          // check if the specified persistence method is known
    	          if (typeof (persistenceMethods[options.persistenceMethod]) == 'function') {
    	            this.persistenceMethod = options.persistenceMethod;
    	            this.persistenceAdapter = new persistenceMethods[options.persistenceMethod]();
    	          }
    	          // should be throw an error here, or just fall back to defaults ??
    	        }

    	        // if user passes adapter, set persistence mode to adapter and retain persistence adapter instance
    	        if (this.options.hasOwnProperty('adapter')) {
    	          this.persistenceMethod = 'adapter';
    	          this.persistenceAdapter = options.adapter;
    	          this.options.adapter = null;

    	          // if true, will keep track of dirty ids
    	          this.isIncremental = this.persistenceAdapter.mode === 'incremental';
    	        }


    	        // if they want to load database on loki instantiation, now is a good time to load... after adapter set and before possible autosave initiation
    	        if (options.autoload && initialConfig) {
    	          // for autoload, let the constructor complete before firing callback
    	          var self = this;
    	          setTimeout(function () {
    	            self.loadDatabase(options, options.autoloadCallback);
    	          }, 1);
    	        }

    	        if (this.options.hasOwnProperty('autosaveInterval')) {
    	          this.autosaveDisable();
    	          this.autosaveInterval = parseInt(this.options.autosaveInterval, 10);
    	        }

    	        if (this.options.hasOwnProperty('autosave') && this.options.autosave) {
    	          this.autosaveDisable();
    	          this.autosave = true;

    	          if (this.options.hasOwnProperty('autosaveCallback')) {
    	            this.autosaveEnable(options, options.autosaveCallback);
    	          } else {
    	            this.autosaveEnable();
    	          }
    	        }

    	        if (this.options.hasOwnProperty('throttledSaves')) {
    	          this.throttledSaves = this.options.throttledSaves;
    	        }
    	      } // end of options processing

    	      // ensure defaults exists for options which were not set
    	      if (!this.options.hasOwnProperty('serializationMethod')) {
    	        this.options.serializationMethod = 'normal';
    	      }

    	      // ensure passed or default option exists
    	      if (!this.options.hasOwnProperty('destructureDelimiter')) {
    	        this.options.destructureDelimiter = '$<\n';
    	      }

    	      // if by now there is no adapter specified by user nor derived from persistenceMethod: use sensible defaults
    	      if (this.persistenceAdapter === null) {
    	        this.persistenceMethod = defaultPersistence[this.ENV];
    	        if (this.persistenceMethod) {
    	          this.persistenceAdapter = new persistenceMethods[this.persistenceMethod]();
    	        }
    	      }

    	    };

    	    /**
    	     * Copies 'this' database into a new Loki instance. Object references are shared to make lightweight.
    	     *
    	     * @param {object} options - apply or override collection level settings
    	     * @param {bool} options.removeNonSerializable - nulls properties not safe for serialization.
    	     * @memberof Loki
    	     */
    	    Loki.prototype.copy = function (options) {
    	      // in case running in an environment without accurate environment detection, pass 'NA'
    	      var databaseCopy = new Loki(this.filename, { env: "NA" });
    	      var clen, idx;

    	      options = options || {};

    	      // currently inverting and letting loadJSONObject do most of the work
    	      databaseCopy.loadJSONObject(this, { retainDirtyFlags: true });

    	      // since our JSON serializeReplacer is not invoked for reference database adapters, this will let us mimic
    	      if (options.hasOwnProperty("removeNonSerializable") && options.removeNonSerializable === true) {
    	        databaseCopy.autosaveHandle = null;
    	        databaseCopy.persistenceAdapter = null;

    	        clen = databaseCopy.collections.length;
    	        for (idx = 0; idx < clen; idx++) {
    	          databaseCopy.collections[idx].constraints = null;
    	          databaseCopy.collections[idx].ttl = null;
    	        }
    	      }

    	      return databaseCopy;
    	    };

    	    /**
    	     * Adds a collection to the database.
    	     * @param {string} name - name of collection to add
    	     * @param {object=} options - (optional) options to configure collection with.
    	     * @param {array=} [options.unique=[]] - array of property names to define unique constraints for
    	     * @param {array=} [options.exact=[]] - array of property names to define exact constraints for
    	     * @param {array=} [options.indices=[]] - array property names to define binary indexes for
    	     * @param {boolean} [options.asyncListeners=false] - whether listeners are called asynchronously
    	     * @param {boolean} [options.disableMeta=false] - set to true to disable meta property on documents
    	     * @param {boolean} [options.disableChangesApi=true] - set to false to enable Changes Api
    	     * @param {boolean} [options.disableDeltaChangesApi=true] - set to false to enable Delta Changes API (requires Changes API, forces cloning)
    	     * @param {boolean} [options.autoupdate=false] - use Object.observe to update objects automatically
    	     * @param {boolean} [options.clone=false] - specify whether inserts and queries clone to/from user
    	     * @param {string} [options.cloneMethod='parse-stringify'] - 'parse-stringify', 'jquery-extend-deep', 'shallow, 'shallow-assign'
    	     * @param {int=} options.ttl - age of document (in ms.) before document is considered aged/stale.
    	     * @param {int=} options.ttlInterval - time interval for clearing out 'aged' documents; not set by default.
    	     * @returns {Collection} a reference to the collection which was just added
    	     * @memberof Loki
    	     */
    	    Loki.prototype.addCollection = function (name, options) {
    	      var i,
    	        len = this.collections.length;

    	      if (options && options.disableMeta === true) {
    	        if (options.disableChangesApi === false) {
    	          throw new Error("disableMeta option cannot be passed as true when disableChangesApi is passed as false");
    	        }
    	        if (options.disableDeltaChangesApi === false) {
    	          throw new Error("disableMeta option cannot be passed as true when disableDeltaChangesApi is passed as false");
    	        }
    	        if (typeof options.ttl === "number" && options.ttl > 0) {
    	          throw new Error("disableMeta option cannot be passed as true when ttl is enabled");
    	        }
    	      }

    	      for (i = 0; i < len; i += 1) {
    	        if (this.collections[i].name === name) {
    	          return this.collections[i];
    	        }
    	      }

    	      var collection = new Collection(name, options);
    	      collection.isIncremental = this.isIncremental;
    	      this.collections.push(collection);

    	      if (this.verbose)
    	        collection.lokiConsoleWrapper = console;

    	      return collection;
    	    };

    	    Loki.prototype.loadCollection = function (collection) {
    	      if (!collection.name) {
    	        throw new Error('Collection must have a name property to be loaded');
    	      }
    	      this.collections.push(collection);
    	    };

    	    /**
    	     * Retrieves reference to a collection by name.
    	     * @param {string} collectionName - name of collection to look up
    	     * @returns {Collection} Reference to collection in database by that name, or null if not found
    	     * @memberof Loki
    	     */
    	    Loki.prototype.getCollection = function (collectionName) {
    	      var i,
    	        len = this.collections.length;

    	      for (i = 0; i < len; i += 1) {
    	        if (this.collections[i].name === collectionName) {
    	          return this.collections[i];
    	        }
    	      }

    	      // no such collection
    	      this.emit('warning', 'collection ' + collectionName + ' not found');
    	      return null;
    	    };

    	    /**
    	     * Renames an existing loki collection
    	     * @param {string} oldName - name of collection to rename
    	     * @param {string} newName - new name of collection
    	     * @returns {Collection} reference to the newly renamed collection
    	     * @memberof Loki
    	     */
    	    Loki.prototype.renameCollection = function (oldName, newName) {
    	      var c = this.getCollection(oldName);

    	      if (c) {
    	        c.name = newName;
    	      }

    	      return c;
    	    };

    	    /**
    	     * Returns a list of collections in the database.
    	     * @returns {object[]} array of objects containing 'name', 'type', and 'count' properties.
    	     * @memberof Loki
    	     */
    	    Loki.prototype.listCollections = function () {

    	      var i = this.collections.length,
    	        colls = [];

    	      while (i--) {
    	        colls.push({
    	          name: this.collections[i].name,
    	          type: this.collections[i].objType,
    	          count: this.collections[i].data.length
    	        });
    	      }
    	      return colls;
    	    };

    	    /**
    	     * Removes a collection from the database.
    	     * @param {string} collectionName - name of collection to remove
    	     * @memberof Loki
    	     */
    	    Loki.prototype.removeCollection = function (collectionName) {
    	      var i,
    	        len = this.collections.length;

    	      for (i = 0; i < len; i += 1) {
    	        if (this.collections[i].name === collectionName) {
    	          var tmpcol = new Collection(collectionName, {});
    	          var curcol = this.collections[i];
    	          for (var prop in curcol) {
    	            if (curcol.hasOwnProperty(prop) && tmpcol.hasOwnProperty(prop)) {
    	              curcol[prop] = tmpcol[prop];
    	            }
    	          }
    	          this.collections.splice(i, 1);
    	          return;
    	        }
    	      }
    	    };

    	    Loki.prototype.getName = function () {
    	      return this.name;
    	    };

    	    /**
    	     * serializeReplacer - used to prevent certain properties from being serialized
    	     *
    	     */
    	    Loki.prototype.serializeReplacer = function (key, value) {
    	      switch (key) {
    	        case 'autosaveHandle':
    	        case 'persistenceAdapter':
    	        case 'constraints':
    	        case 'ttl':
    	          return null;
    	        case 'throttledSavePending':
    	        case 'throttledCallbacks':
    	          return undefined;
    	        case 'lokiConsoleWrapper':
    	          return null;
    	        default:
    	          return value;
    	      }
    	    };

    	    /**
    	     * Serialize database to a string which can be loaded via {@link Loki#loadJSON}
    	     *
    	     * @returns {string} Stringified representation of the loki database.
    	     * @memberof Loki
    	     */
    	    Loki.prototype.serialize = function (options) {
    	      options = options || {};

    	      if (!options.hasOwnProperty("serializationMethod")) {
    	        options.serializationMethod = this.options.serializationMethod;
    	      }

    	      switch (options.serializationMethod) {
    	        case "normal": return JSON.stringify(this, this.serializeReplacer);
    	        case "pretty": return JSON.stringify(this, this.serializeReplacer, 2);
    	        case "destructured": return this.serializeDestructured(); // use default options
    	        default: return JSON.stringify(this, this.serializeReplacer);
    	      }
    	    };

    	    // alias of serialize
    	    Loki.prototype.toJson = Loki.prototype.serialize;

    	    /**
    	     * Database level destructured JSON serialization routine to allow alternate serialization methods.
    	     * Internally, Loki supports destructuring via loki "serializationMethod' option and
    	     * the optional LokiPartitioningAdapter class. It is also available if you wish to do
    	     * your own structured persistence or data exchange.
    	     *
    	     * @param {object=} options - output format options for use externally to loki
    	     * @param {bool=} options.partitioned - (default: false) whether db and each collection are separate
    	     * @param {int=} options.partition - can be used to only output an individual collection or db (-1)
    	     * @param {bool=} options.delimited - (default: true) whether subitems are delimited or subarrays
    	     * @param {string=} options.delimiter - override default delimiter
    	     *
    	     * @returns {string|array} A custom, restructured aggregation of independent serializations.
    	     * @memberof Loki
    	     */
    	    Loki.prototype.serializeDestructured = function (options) {
    	      var idx, sidx, result, resultlen;
    	      var reconstruct = [];
    	      var dbcopy;

    	      options = options || {};

    	      if (!options.hasOwnProperty("partitioned")) {
    	        options.partitioned = false;
    	      }

    	      if (!options.hasOwnProperty("delimited")) {
    	        options.delimited = true;
    	      }

    	      if (!options.hasOwnProperty("delimiter")) {
    	        options.delimiter = this.options.destructureDelimiter;
    	      }

    	      // 'partitioned' along with 'partition' of 0 or greater is a request for single collection serialization
    	      if (options.partitioned === true && options.hasOwnProperty("partition") && options.partition >= 0) {
    	        return this.serializeCollection({
    	          delimited: options.delimited,
    	          delimiter: options.delimiter,
    	          collectionIndex: options.partition
    	        });
    	      }

    	      // not just an individual collection, so we will need to serialize db container via shallow copy
    	      dbcopy = new Loki(this.filename);
    	      dbcopy.loadJSONObject(this);

    	      for (idx = 0; idx < dbcopy.collections.length; idx++) {
    	        dbcopy.collections[idx].data = [];
    	      }

    	      // if we -only- wanted the db container portion, return it now
    	      if (options.partitioned === true && options.partition === -1) {
    	        // since we are deconstructing, override serializationMethod to normal for here
    	        return dbcopy.serialize({
    	          serializationMethod: "normal"
    	        });
    	      }

    	      // at this point we must be deconstructing the entire database
    	      // start by pushing db serialization into first array element
    	      reconstruct.push(dbcopy.serialize({
    	        serializationMethod: "normal"
    	      }));

    	      dbcopy = null;

    	      // push collection data into subsequent elements
    	      for (idx = 0; idx < this.collections.length; idx++) {
    	        result = this.serializeCollection({
    	          delimited: options.delimited,
    	          delimiter: options.delimiter,
    	          collectionIndex: idx
    	        });

    	        // NDA : Non-Delimited Array : one iterable concatenated array with empty string collection partitions
    	        if (options.partitioned === false && options.delimited === false) {
    	          if (!Array.isArray(result)) {
    	            throw new Error("a nondelimited, non partitioned collection serialization did not return an expected array");
    	          }

    	          // Array.concat would probably duplicate memory overhead for copying strings.
    	          // Instead copy each individually, and clear old value after each copy.
    	          // Hopefully this will allow g.c. to reduce memory pressure, if needed.
    	          resultlen = result.length;

    	          for (sidx = 0; sidx < resultlen; sidx++) {
    	            reconstruct.push(result[sidx]);
    	            result[sidx] = null;
    	          }

    	          reconstruct.push("");
    	        }
    	        else {
    	          reconstruct.push(result);
    	        }
    	      }

    	      // Reconstruct / present results according to four combinations : D, DA, NDA, NDAA
    	      if (options.partitioned) {
    	        // DA : Delimited Array of strings [0] db [1] collection [n] collection { partitioned: true, delimited: true }
    	        // useful for simple future adaptations of existing persistence adapters to save collections separately
    	        if (options.delimited) {
    	          return reconstruct;
    	        }
    	        // NDAA : Non-Delimited Array with subArrays. db at [0] and collection subarrays at [n] { partitioned: true, delimited : false }
    	        // This format might be the most versatile for 'rolling your own' partitioned sync or save.
    	        // Memory overhead can be reduced by specifying a specific partition, but at this code path they did not, so its all.
    	        else {
    	          return reconstruct;
    	        }
    	      }
    	      else {
    	        // D : one big Delimited string { partitioned: false, delimited : true }
    	        // This is the method Loki will use internally if 'destructured'.
    	        // Little memory overhead improvements but does not require multiple asynchronous adapter call scheduling
    	        if (options.delimited) {
    	          // indicate no more collections
    	          reconstruct.push("");

    	          return reconstruct.join(options.delimiter);
    	        }
    	        // NDA : Non-Delimited Array : one iterable array with empty string collection partitions { partitioned: false, delimited: false }
    	        // This format might be best candidate for custom synchronous syncs or saves
    	        else {
    	          // indicate no more collections
    	          reconstruct.push("");

    	          return reconstruct;
    	        }
    	      }
    	    };

    	    /**
    	     * Collection level utility method to serialize a collection in a 'destructured' format
    	     *
    	     * @param {object=} options - used to determine output of method
    	     * @param {int} options.delimited - whether to return single delimited string or an array
    	     * @param {string} options.delimiter - (optional) if delimited, this is delimiter to use
    	     * @param {int} options.collectionIndex -  specify which collection to serialize data for
    	     *
    	     * @returns {string|array} A custom, restructured aggregation of independent serializations for a single collection.
    	     * @memberof Loki
    	     */
    	    Loki.prototype.serializeCollection = function (options) {
    	      var doccount,
    	        docidx,
    	        resultlines = [];

    	      options = options || {};

    	      if (!options.hasOwnProperty("delimited")) {
    	        options.delimited = true;
    	      }

    	      if (!options.hasOwnProperty("collectionIndex")) {
    	        throw new Error("serializeCollection called without 'collectionIndex' option");
    	      }

    	      doccount = this.collections[options.collectionIndex].data.length;

    	      resultlines = [];

    	      for (docidx = 0; docidx < doccount; docidx++) {
    	        resultlines.push(JSON.stringify(this.collections[options.collectionIndex].data[docidx]));
    	      }

    	      // D and DA
    	      if (options.delimited) {
    	        // indicate no more documents in collection (via empty delimited string)
    	        resultlines.push("");

    	        return resultlines.join(options.delimiter);
    	      }
    	      else {
    	        // NDAA and NDA
    	        return resultlines;
    	      }
    	    };

    	    /**
    	     * Database level destructured JSON deserialization routine to minimize memory overhead.
    	     * Internally, Loki supports destructuring via loki "serializationMethod' option and
    	     * the optional LokiPartitioningAdapter class. It is also available if you wish to do
    	     * your own structured persistence or data exchange.
    	     *
    	     * @param {string|array} destructuredSource - destructured json or array to deserialize from
    	     * @param {object=} options - source format options
    	     * @param {bool=} [options.partitioned=false] - whether db and each collection are separate
    	     * @param {int=} options.partition - can be used to deserialize only a single partition
    	     * @param {bool=} [options.delimited=true] - whether subitems are delimited or subarrays
    	     * @param {string=} options.delimiter - override default delimiter
    	     *
    	     * @returns {object|array} An object representation of the deserialized database, not yet applied to 'this' db or document array
    	     * @memberof Loki
    	     */
    	    Loki.prototype.deserializeDestructured = function (destructuredSource, options) {
    	      var workarray = [];
    	      var len, cdb;
    	      var collIndex = 0, collCount, lineIndex = 1, done = false;
    	      var currObject;

    	      options = options || {};

    	      if (!options.hasOwnProperty("partitioned")) {
    	        options.partitioned = false;
    	      }

    	      if (!options.hasOwnProperty("delimited")) {
    	        options.delimited = true;
    	      }

    	      if (!options.hasOwnProperty("delimiter")) {
    	        options.delimiter = this.options.destructureDelimiter;
    	      }

    	      // Partitioned
    	      // DA : Delimited Array of strings [0] db [1] collection [n] collection { partitioned: true, delimited: true }
    	      // NDAA : Non-Delimited Array with subArrays. db at [0] and collection subarrays at [n] { partitioned: true, delimited : false }
    	      // -or- single partition
    	      if (options.partitioned) {
    	        // handle single partition
    	        if (options.hasOwnProperty('partition')) {
    	          // db only
    	          if (options.partition === -1) {
    	            cdb = JSON.parse(destructuredSource[0]);

    	            return cdb;
    	          }

    	          // single collection, return doc array
    	          return this.deserializeCollection(destructuredSource[options.partition + 1], options);
    	        }

    	        // Otherwise we are restoring an entire partitioned db
    	        cdb = JSON.parse(destructuredSource[0]);
    	        collCount = cdb.collections.length;
    	        for (collIndex = 0; collIndex < collCount; collIndex++) {
    	          // attach each collection docarray to container collection data, add 1 to collection array index since db is at 0
    	          cdb.collections[collIndex].data = this.deserializeCollection(destructuredSource[collIndex + 1], options);
    	        }

    	        return cdb;
    	      }

    	      // Non-Partitioned
    	      // D : one big Delimited string { partitioned: false, delimited : true }
    	      // NDA : Non-Delimited Array : one iterable array with empty string collection partitions { partitioned: false, delimited: false }

    	      // D
    	      if (options.delimited) {
    	        workarray = destructuredSource.split(options.delimiter);
    	        destructuredSource = null; // lower memory pressure
    	        len = workarray.length;

    	        if (len === 0) {
    	          return null;
    	        }
    	      }
    	      // NDA
    	      else {
    	        workarray = destructuredSource;
    	      }

    	      // first line is database and collection shells
    	      cdb = JSON.parse(workarray[0]);
    	      collCount = cdb.collections.length;
    	      workarray[0] = null;

    	      while (!done) {
    	        workarray[lineIndex];

    	        // empty string indicates either end of collection or end of file
    	        if (workarray[lineIndex] === "") {
    	          // if no more collections to load into, we are done
    	          if (++collIndex > collCount) {
    	            done = true;
    	          }
    	        }
    	        else {
    	          currObject = JSON.parse(workarray[lineIndex]);
    	          cdb.collections[collIndex].data.push(currObject);
    	        }

    	        // lower memory pressure and advance iterator
    	        workarray[lineIndex++] = null;
    	      }

    	      return cdb;
    	    };

    	    /**
    	     * Collection level utility function to deserializes a destructured collection.
    	     *
    	     * @param {string|array} destructuredSource - destructured representation of collection to inflate
    	     * @param {object=} options - used to describe format of destructuredSource input
    	     * @param {int=} [options.delimited=false] - whether source is delimited string or an array
    	     * @param {string=} options.delimiter - if delimited, this is delimiter to use (if other than default)
    	     *
    	     * @returns {array} an array of documents to attach to collection.data.
    	     * @memberof Loki
    	     */
    	    Loki.prototype.deserializeCollection = function (destructuredSource, options) {
    	      var workarray = [];
    	      var idx, len;

    	      options = options || {};

    	      if (!options.hasOwnProperty("partitioned")) {
    	        options.partitioned = false;
    	      }

    	      if (!options.hasOwnProperty("delimited")) {
    	        options.delimited = true;
    	      }

    	      if (!options.hasOwnProperty("delimiter")) {
    	        options.delimiter = this.options.destructureDelimiter;
    	      }

    	      if (options.delimited) {
    	        workarray = destructuredSource.split(options.delimiter);
    	        workarray.pop();
    	      }
    	      else {
    	        workarray = destructuredSource;
    	      }

    	      len = workarray.length;
    	      for (idx = 0; idx < len; idx++) {
    	        workarray[idx] = JSON.parse(workarray[idx]);
    	      }

    	      return workarray;
    	    };

    	    /**
    	     * Inflates a loki database from a serialized JSON string
    	     *
    	     * @param {string} serializedDb - a serialized loki database string
    	     * @param {object=} options - apply or override collection level settings
    	     * @param {bool} options.retainDirtyFlags - whether collection dirty flags will be preserved
    	     * @memberof Loki
    	     */
    	    Loki.prototype.loadJSON = function (serializedDb, options) {
    	      var dbObject;
    	      if (serializedDb.length === 0) {
    	        dbObject = {};
    	      } else {

    	        // using option defined in instantiated db not what was in serialized db
    	        switch (this.options.serializationMethod) {
    	          case "normal":
    	          case "pretty": dbObject = JSON.parse(serializedDb); break;
    	          case "destructured": dbObject = this.deserializeDestructured(serializedDb); break;
    	          default: dbObject = JSON.parse(serializedDb); break;
    	        }
    	      }

    	      this.loadJSONObject(dbObject, options);
    	    };

    	    /**
    	     * Inflates a loki database from a JS object
    	     *
    	     * @param {object} dbObject - a serialized loki database string
    	     * @param {object=} options - apply or override collection level settings
    	     * @param {bool} options.retainDirtyFlags - whether collection dirty flags will be preserved
    	     * @memberof Loki
    	     */
    	    Loki.prototype.loadJSONObject = function (dbObject, options) {
    	      var i = 0,
    	        len = dbObject.collections ? dbObject.collections.length : 0,
    	        coll,
    	        copyColl,
    	        clen,
    	        j,
    	        loader,
    	        collObj;

    	      this.name = dbObject.name;

    	      // restore save throttled boolean only if not defined in options
    	      if (dbObject.hasOwnProperty('throttledSaves') && options && !options.hasOwnProperty('throttledSaves')) {
    	        this.throttledSaves = dbObject.throttledSaves;
    	      }

    	      this.collections = [];

    	      function makeLoader(coll) {
    	        var collOptions = options[coll.name];
    	        var inflater;

    	        if (collOptions.proto) {
    	          inflater = collOptions.inflate || Utils.copyProperties;

    	          return function (data) {
    	            var collObj = new (collOptions.proto)();
    	            inflater(data, collObj);
    	            return collObj;
    	          };
    	        }

    	        return collOptions.inflate;
    	      }

    	      for (i; i < len; i += 1) {
    	        coll = dbObject.collections[i];

    	        copyColl = this.addCollection(coll.name, {
    	          disableChangesApi: coll.disableChangesApi,
    	          disableDeltaChangesApi: coll.disableDeltaChangesApi,
    	          disableMeta: coll.disableMeta,
    	          disableFreeze: coll.hasOwnProperty('disableFreeze') ? coll.disableFreeze : true
    	        });

    	        copyColl.adaptiveBinaryIndices = coll.hasOwnProperty('adaptiveBinaryIndices') ? (coll.adaptiveBinaryIndices === true) : false;
    	        copyColl.transactional = coll.transactional;
    	        copyColl.asyncListeners = coll.asyncListeners;
    	        copyColl.cloneObjects = coll.cloneObjects;
    	        copyColl.cloneMethod = coll.cloneMethod || "parse-stringify";
    	        copyColl.autoupdate = coll.autoupdate;
    	        copyColl.changes = coll.changes;
    	        copyColl.dirtyIds = coll.dirtyIds || [];

    	        if (options && options.retainDirtyFlags === true) {
    	          copyColl.dirty = coll.dirty;
    	        }
    	        else {
    	          copyColl.dirty = false;
    	        }

    	        // load each element individually
    	        clen = coll.data.length;
    	        j = 0;
    	        if (options && options.hasOwnProperty(coll.name)) {
    	          loader = makeLoader(coll);

    	          for (j; j < clen; j++) {
    	            collObj = loader(coll.data[j]);
    	            copyColl.data[j] = collObj;
    	            copyColl.addAutoUpdateObserver(collObj);
    	            if (!copyColl.disableFreeze) {
    	              deepFreeze(copyColl.data[j]);
    	            }
    	          }
    	        } else {

    	          for (j; j < clen; j++) {
    	            copyColl.data[j] = coll.data[j];
    	            copyColl.addAutoUpdateObserver(copyColl.data[j]);
    	            if (!copyColl.disableFreeze) {
    	              deepFreeze(copyColl.data[j]);
    	            }
    	          }
    	        }

    	        copyColl.maxId = (typeof coll.maxId === 'undefined') ? 0 : coll.maxId;
    	        if (typeof (coll.binaryIndices) !== 'undefined') {
    	          copyColl.binaryIndices = coll.binaryIndices;
    	        }
    	        if (typeof coll.transforms !== 'undefined') {
    	          copyColl.transforms = coll.transforms;
    	        }

    	        // regenerate unique indexes
    	        copyColl.uniqueNames = [];
    	        if (coll.hasOwnProperty("uniqueNames")) {
    	          copyColl.uniqueNames = coll.uniqueNames;
    	        }

    	        // in case they are loading a database created before we added dynamic views, handle undefined
    	        if (typeof (coll.DynamicViews) === 'undefined') continue;

    	        // reinflate DynamicViews and attached Resultsets
    	        for (var idx = 0; idx < coll.DynamicViews.length; idx++) {
    	          var colldv = coll.DynamicViews[idx];

    	          var dv = copyColl.addDynamicView(colldv.name, colldv.options);
    	          dv.resultdata = colldv.resultdata;
    	          dv.resultsdirty = colldv.resultsdirty;
    	          dv.filterPipeline = colldv.filterPipeline;
    	          dv.sortCriteriaSimple = colldv.sortCriteriaSimple;
    	          dv.sortCriteria = colldv.sortCriteria;
    	          dv.sortFunction = null;
    	          dv.sortDirty = colldv.sortDirty;
    	          if (!copyColl.disableFreeze) {
    	            deepFreeze(dv.filterPipeline);
    	            if (dv.sortCriteriaSimple) {
    	              deepFreeze(dv.sortCriteriaSimple);
    	            } else if (dv.sortCriteria) {
    	              deepFreeze(dv.sortCriteria);
    	            }
    	          }
    	          dv.resultset.filteredrows = colldv.resultset.filteredrows;
    	          dv.resultset.filterInitialized = colldv.resultset.filterInitialized;

    	          dv.rematerialize({
    	            removeWhereFilters: true
    	          });
    	        }

    	        // Upgrade Logic for binary index refactoring at version 1.5
    	        if (dbObject.databaseVersion < 1.5) {
    	          // rebuild all indices
    	          copyColl.ensureAllIndexes(true);
    	          copyColl.dirty = true;
    	        }
    	      }
    	    };

    	    /**
    	     * Emits the close event. In autosave scenarios, if the database is dirty, this will save and disable timer.
    	     * Does not actually destroy the db.
    	     *
    	     * @param {function=} callback - (Optional) if supplied will be registered with close event before emitting.
    	     * @memberof Loki
    	     */
    	    Loki.prototype.close = function (callback) {
    	      // for autosave scenarios, we will let close perform final save (if dirty)
    	      // For web use, you might call from window.onbeforeunload to shutdown database, saving pending changes
    	      if (this.autosave) {
    	        this.autosaveDisable();
    	        if (this.autosaveDirty()) {
    	          this.saveDatabase(callback);
    	          callback = undefined;
    	        }
    	      }

    	      if (callback) {
    	        this.on('close', callback);
    	      }
    	      this.emit('close');
    	    };

    	    /**-------------------------+
    	    | Changes API               |
    	    +--------------------------*/

    	    /**
    	     * The Changes API enables the tracking the changes occurred in the collections since the beginning of the session,
    	     * so it's possible to create a differential dataset for synchronization purposes (possibly to a remote db)
    	     */

    	    /**
    	     * (Changes API) : takes all the changes stored in each
    	     * collection and creates a single array for the entire database. If an array of names
    	     * of collections is passed then only the included collections will be tracked.
    	     *
    	     * @param {array=} optional array of collection names. No arg means all collections are processed.
    	     * @returns {array} array of changes
    	     * @see private method createChange() in Collection
    	     * @memberof Loki
    	     */
    	    Loki.prototype.generateChangesNotification = function (arrayOfCollectionNames) {
    	      function getCollName(coll) {
    	        return coll.name;
    	      }
    	      var changes = [],
    	        selectedCollections = arrayOfCollectionNames || this.collections.map(getCollName);

    	      this.collections.forEach(function (coll) {
    	        if (selectedCollections.indexOf(getCollName(coll)) !== -1) {
    	          changes = changes.concat(coll.getChanges());
    	        }
    	      });
    	      return changes;
    	    };

    	    /**
    	     * (Changes API) - stringify changes for network transmission
    	     * @returns {string} string representation of the changes
    	     * @memberof Loki
    	     */
    	    Loki.prototype.serializeChanges = function (collectionNamesArray) {
    	      return JSON.stringify(this.generateChangesNotification(collectionNamesArray));
    	    };

    	    /**
    	     * (Changes API) : clears all the changes in all collections.
    	     * @memberof Loki
    	     */
    	    Loki.prototype.clearChanges = function () {
    	      this.collections.forEach(function (coll) {
    	        if (coll.flushChanges) {
    	          coll.flushChanges();
    	        }
    	      });
    	    };

    	    /*------------------+
    	    | PERSISTENCE       |
    	    -------------------*/

    	    /** there are two build in persistence adapters for internal use
    	     * fs             for use in Nodejs type environments
    	     * localStorage   for use in browser environment
    	     * defined as helper classes here so its easy and clean to use
    	     */

    	    /**
    	     * In in-memory persistence adapter for an in-memory database.
    	     * This simple 'key/value' adapter is intended for unit testing and diagnostics.
    	     *
    	     * @param {object=} options - memory adapter options
    	     * @param {boolean} [options.asyncResponses=false] - whether callbacks are invoked asynchronously
    	     * @param {int} [options.asyncTimeout=50] - timeout in ms to queue callbacks
    	     * @constructor LokiMemoryAdapter
    	     */
    	    function LokiMemoryAdapter(options) {
    	      this.hashStore = {};
    	      this.options = options || {};

    	      if (!this.options.hasOwnProperty('asyncResponses')) {
    	        this.options.asyncResponses = false;
    	      }

    	      if (!this.options.hasOwnProperty('asyncTimeout')) {
    	        this.options.asyncTimeout = 50; // 50 ms default
    	      }
    	    }

    	    /**
    	     * Loads a serialized database from its in-memory store.
    	     * (Loki persistence adapter interface function)
    	     *
    	     * @param {string} dbname - name of the database (filename/keyname)
    	     * @param {function} callback - adapter callback to return load result to caller
    	     * @memberof LokiMemoryAdapter
    	     */
    	    LokiMemoryAdapter.prototype.loadDatabase = function (dbname, callback) {
    	      var self = this;

    	      if (this.options.asyncResponses) {
    	        setTimeout(function () {
    	          if (self.hashStore.hasOwnProperty(dbname)) {
    	            callback(self.hashStore[dbname].value);
    	          }
    	          else {
    	            // database doesn't exist, return falsy
    	            callback(null);
    	          }
    	        }, this.options.asyncTimeout);
    	      }
    	      else {
    	        if (this.hashStore.hasOwnProperty(dbname)) {
    	          // database doesn't exist, return falsy
    	          callback(this.hashStore[dbname].value);
    	        }
    	        else {
    	          callback(null);
    	        }
    	      }
    	    };

    	    /**
    	     * Saves a serialized database to its in-memory store.
    	     * (Loki persistence adapter interface function)
    	     *
    	     * @param {string} dbname - name of the database (filename/keyname)
    	     * @param {function} callback - adapter callback to return load result to caller
    	     * @memberof LokiMemoryAdapter
    	     */
    	    LokiMemoryAdapter.prototype.saveDatabase = function (dbname, dbstring, callback) {
    	      var self = this;
    	      var saveCount;

    	      if (this.options.asyncResponses) {
    	        setTimeout(function () {
    	          saveCount = (self.hashStore.hasOwnProperty(dbname) ? self.hashStore[dbname].savecount : 0);

    	          self.hashStore[dbname] = {
    	            savecount: saveCount + 1,
    	            lastsave: new Date(),
    	            value: dbstring
    	          };

    	          callback();
    	        }, this.options.asyncTimeout);
    	      }
    	      else {
    	        saveCount = (this.hashStore.hasOwnProperty(dbname) ? this.hashStore[dbname].savecount : 0);

    	        this.hashStore[dbname] = {
    	          savecount: saveCount + 1,
    	          lastsave: new Date(),
    	          value: dbstring
    	        };

    	        callback();
    	      }
    	    };

    	    /**
    	     * Deletes a database from its in-memory store.
    	     *
    	     * @param {string} dbname - name of the database (filename/keyname)
    	     * @param {function} callback - function to call when done
    	     * @memberof LokiMemoryAdapter
    	     */
    	    LokiMemoryAdapter.prototype.deleteDatabase = function (dbname, callback) {
    	      if (this.hashStore.hasOwnProperty(dbname)) {
    	        delete this.hashStore[dbname];
    	      }

    	      if (typeof callback === "function") {
    	        callback();
    	      }
    	    };

    	    /**
    	     * An adapter for adapters.  Converts a non reference mode adapter into a reference mode adapter
    	     * which can perform destructuring and partioning.  Each collection will be stored in its own key/save and
    	     * only dirty collections will be saved.  If you  turn on paging with default page size of 25megs and save
    	     * a 75 meg collection it should use up roughly 3 save slots (key/value pairs sent to inner adapter).
    	     * A dirty collection that spans three pages will save all three pages again
    	     * Paging mode was added mainly because Chrome has issues saving 'too large' of a string within a
    	     * single indexeddb row.  If a single document update causes the collection to be flagged as dirty, all
    	     * of that collection's pages will be written on next save.
    	     *
    	     * @param {object} adapter - reference to a 'non-reference' mode loki adapter instance.
    	     * @param {object=} options - configuration options for partitioning and paging
    	     * @param {bool} options.paging - (default: false) set to true to enable paging collection data.
    	     * @param {int} options.pageSize - (default : 25MB) you can use this to limit size of strings passed to inner adapter.
    	     * @param {string} options.delimiter - allows you to override the default delimeter
    	     * @constructor LokiPartitioningAdapter
    	     */
    	    function LokiPartitioningAdapter(adapter, options) {
    	      this.mode = "reference";
    	      this.adapter = null;
    	      this.options = options || {};
    	      this.dbref = null;
    	      this.dbname = "";
    	      this.pageIterator = {};

    	      // verify user passed an appropriate adapter
    	      if (adapter) {
    	        if (adapter.mode === "reference") {
    	          throw new Error("LokiPartitioningAdapter cannot be instantiated with a reference mode adapter");
    	        }
    	        else {
    	          this.adapter = adapter;
    	        }
    	      }
    	      else {
    	        throw new Error("LokiPartitioningAdapter requires a (non-reference mode) adapter on construction");
    	      }

    	      // set collection paging defaults
    	      if (!this.options.hasOwnProperty("paging")) {
    	        this.options.paging = false;
    	      }

    	      // default to page size of 25 megs (can be up to your largest serialized object size larger than this)
    	      if (!this.options.hasOwnProperty("pageSize")) {
    	        this.options.pageSize = 25 * 1024 * 1024;
    	      }

    	      if (!this.options.hasOwnProperty("delimiter")) {
    	        this.options.delimiter = '$<\n';
    	      }
    	    }

    	    /**
    	     * Loads a database which was partitioned into several key/value saves.
    	     * (Loki persistence adapter interface function)
    	     *
    	     * @param {string} dbname - name of the database (filename/keyname)
    	     * @param {function} callback - adapter callback to return load result to caller
    	     * @memberof LokiPartitioningAdapter
    	     */
    	    LokiPartitioningAdapter.prototype.loadDatabase = function (dbname, callback) {
    	      var self = this;
    	      this.dbname = dbname;
    	      this.dbref = new Loki(dbname);

    	      // load the db container (without data)
    	      this.adapter.loadDatabase(dbname, function (result) {
    	        // empty database condition is for inner adapter return null/undefined/falsy
    	        if (!result) {
    	          // partition 0 not found so new database, no need to try to load other partitions.
    	          // return same falsy result to loadDatabase to signify no database exists (yet)
    	          callback(result);
    	          return;
    	        }

    	        if (typeof result !== "string") {
    	          callback(new Error("LokiPartitioningAdapter received an unexpected response from inner adapter loadDatabase()"));
    	        }

    	        // I will want to use loki destructuring helper methods so i will inflate into typed instance
    	        var db = JSON.parse(result);
    	        self.dbref.loadJSONObject(db);
    	        db = null;

    	        self.dbref.collections.length;

    	        if (self.dbref.collections.length === 0) {
    	          callback(self.dbref);
    	          return;
    	        }

    	        self.pageIterator = {
    	          collection: 0,
    	          pageIndex: 0
    	        };

    	        self.loadNextPartition(0, function () {
    	          callback(self.dbref);
    	        });
    	      });
    	    };

    	    /**
    	     * Used to sequentially load each collection partition, one at a time.
    	     *
    	     * @param {int} partition - ordinal collection position to load next
    	     * @param {function} callback - adapter callback to return load result to caller
    	     */
    	    LokiPartitioningAdapter.prototype.loadNextPartition = function (partition, callback) {
    	      var keyname = this.dbname + "." + partition;
    	      var self = this;

    	      if (this.options.paging === true) {
    	        this.pageIterator.pageIndex = 0;
    	        this.loadNextPage(callback);
    	        return;
    	      }

    	      this.adapter.loadDatabase(keyname, function (result) {
    	        var data = self.dbref.deserializeCollection(result, { delimited: true, collectionIndex: partition });
    	        self.dbref.collections[partition].data = data;

    	        if (++partition < self.dbref.collections.length) {
    	          self.loadNextPartition(partition, callback);
    	        }
    	        else {
    	          callback();
    	        }
    	      });
    	    };

    	    /**
    	     * Used to sequentially load the next page of collection partition, one at a time.
    	     *
    	     * @param {function} callback - adapter callback to return load result to caller
    	     */
    	    LokiPartitioningAdapter.prototype.loadNextPage = function (callback) {
    	      // calculate name for next saved page in sequence
    	      var keyname = this.dbname + "." + this.pageIterator.collection + "." + this.pageIterator.pageIndex;
    	      var self = this;

    	      // load whatever page is next in sequence
    	      this.adapter.loadDatabase(keyname, function (result) {
    	        var data = result.split(self.options.delimiter);
    	        result = ""; // free up memory now that we have split it into array
    	        var dlen = data.length;
    	        var idx;

    	        // detect if last page by presence of final empty string element and remove it if so
    	        var isLastPage = (data[dlen - 1] === "");
    	        if (isLastPage) {
    	          data.pop();
    	          dlen = data.length;
    	          // empty collections are just a delimiter meaning two blank items
    	          if (data[dlen - 1] === "" && dlen === 1) {
    	            data.pop();
    	            dlen = data.length;
    	          }
    	        }

    	        // convert stringified array elements to object instances and push to collection data
    	        for (idx = 0; idx < dlen; idx++) {
    	          self.dbref.collections[self.pageIterator.collection].data.push(JSON.parse(data[idx]));
    	          data[idx] = null;
    	        }
    	        data = [];

    	        // if last page, we are done with this partition
    	        if (isLastPage) {

    	          // if there are more partitions, kick off next partition load
    	          if (++self.pageIterator.collection < self.dbref.collections.length) {
    	            self.loadNextPartition(self.pageIterator.collection, callback);
    	          }
    	          else {
    	            callback();
    	          }
    	        }
    	        else {
    	          self.pageIterator.pageIndex++;
    	          self.loadNextPage(callback);
    	        }
    	      });
    	    };

    	    /**
    	     * Saves a database by partioning into separate key/value saves.
    	     * (Loki 'reference mode' persistence adapter interface function)
    	     *
    	     * @param {string} dbname - name of the database (filename/keyname)
    	     * @param {object} dbref - reference to database which we will partition and save.
    	     * @param {function} callback - adapter callback to return load result to caller
    	     *
    	     * @memberof LokiPartitioningAdapter
    	     */
    	    LokiPartitioningAdapter.prototype.exportDatabase = function (dbname, dbref, callback) {
    	      var idx, clen = dbref.collections.length;

    	      this.dbref = dbref;
    	      this.dbname = dbname;

    	      // queue up dirty partitions to be saved
    	      this.dirtyPartitions = [-1];
    	      for (idx = 0; idx < clen; idx++) {
    	        if (dbref.collections[idx].dirty) {
    	          this.dirtyPartitions.push(idx);
    	        }
    	      }

    	      this.saveNextPartition(function (err) {
    	        callback(err);
    	      });
    	    };

    	    /**
    	     * Helper method used internally to save each dirty collection, one at a time.
    	     *
    	     * @param {function} callback - adapter callback to return load result to caller
    	     */
    	    LokiPartitioningAdapter.prototype.saveNextPartition = function (callback) {
    	      var self = this;
    	      var partition = this.dirtyPartitions.shift();
    	      var keyname = this.dbname + ((partition === -1) ? "" : ("." + partition));

    	      // if we are doing paging and this is collection partition
    	      if (this.options.paging && partition !== -1) {
    	        this.pageIterator = {
    	          collection: partition,
    	          docIndex: 0,
    	          pageIndex: 0
    	        };

    	        // since saveNextPage recursively calls itself until done, our callback means this whole paged partition is finished
    	        this.saveNextPage(function (err) {
    	          if (self.dirtyPartitions.length === 0) {
    	            callback(err);
    	          }
    	          else {
    	            self.saveNextPartition(callback);
    	          }
    	        });
    	        return;
    	      }

    	      // otherwise this is 'non-paged' partioning...
    	      var result = this.dbref.serializeDestructured({
    	        partitioned: true,
    	        delimited: true,
    	        partition: partition
    	      });

    	      this.adapter.saveDatabase(keyname, result, function (err) {
    	        if (err) {
    	          callback(err);
    	          return;
    	        }

    	        if (self.dirtyPartitions.length === 0) {
    	          callback(null);
    	        }
    	        else {
    	          self.saveNextPartition(callback);
    	        }
    	      });
    	    };

    	    /**
    	     * Helper method used internally to generate and save the next page of the current (dirty) partition.
    	     *
    	     * @param {function} callback - adapter callback to return load result to caller
    	     */
    	    LokiPartitioningAdapter.prototype.saveNextPage = function (callback) {
    	      var self = this;
    	      var coll = this.dbref.collections[this.pageIterator.collection];
    	      var keyname = this.dbname + "." + this.pageIterator.collection + "." + this.pageIterator.pageIndex;
    	      var pageLen = 0,
    	        cdlen = coll.data.length,
    	        delimlen = this.options.delimiter.length;
    	      var serializedObject = "",
    	        pageBuilder = "";
    	      var doneWithPartition = false,
    	        doneWithPage = false;

    	      var pageSaveCallback = function (err) {
    	        pageBuilder = "";

    	        if (err) {
    	          callback(err);
    	        }

    	        // update meta properties then continue process by invoking callback
    	        if (doneWithPartition) {
    	          callback(null);
    	        }
    	        else {
    	          self.pageIterator.pageIndex++;
    	          self.saveNextPage(callback);
    	        }
    	      };

    	      if (coll.data.length === 0) {
    	        doneWithPartition = true;
    	      }

    	      while (true) {
    	        if (!doneWithPartition) {
    	          // serialize object
    	          serializedObject = JSON.stringify(coll.data[this.pageIterator.docIndex]);
    	          pageBuilder += serializedObject;
    	          pageLen += serializedObject.length;

    	          // if no more documents in collection to add, we are done with partition
    	          if (++this.pageIterator.docIndex >= cdlen) doneWithPartition = true;
    	        }
    	        // if our current page is bigger than defined pageSize, we are done with page
    	        if (pageLen >= this.options.pageSize) doneWithPage = true;

    	        // if not done with current page, need delimiter before next item
    	        // if done with partition we also want a delmiter to indicate 'end of pages' final empty row
    	        if (!doneWithPage || doneWithPartition) {
    	          pageBuilder += this.options.delimiter;
    	          pageLen += delimlen;
    	        }

    	        // if we are done with page save it and pass off to next recursive call or callback
    	        if (doneWithPartition || doneWithPage) {
    	          this.adapter.saveDatabase(keyname, pageBuilder, pageSaveCallback);
    	          return;
    	        }
    	      }
    	    };

    	    /**
    	     * A loki persistence adapter which persists using node fs module
    	     * @constructor LokiFsAdapter
    	     */
    	    function LokiFsAdapter() {
    	      try {
    	        this.fs = require$$1;
    	      } catch (e) {
    	        this.fs = null;
    	      }
    	    }

    	    /**
    	     * loadDatabase() - Load data from file, will throw an error if the file does not exist
    	     * @param {string} dbname - the filename of the database to load
    	     * @param {function} callback - the callback to handle the result
    	     * @memberof LokiFsAdapter
    	     */
    	    LokiFsAdapter.prototype.loadDatabase = function loadDatabase(dbname, callback) {
    	      var self = this;

    	      this.fs.stat(dbname, function (err, stats) {
    	        if (!err && stats.isFile()) {
    	          self.fs.readFile(dbname, {
    	            encoding: 'utf8'
    	          }, function readFileCallback(err, data) {
    	            if (err) {
    	              callback(new Error(err));
    	            } else {
    	              callback(data);
    	            }
    	          });
    	        }
    	        else {
    	          callback(null);
    	        }
    	      });
    	    };

    	    /**
    	     * saveDatabase() - save data to file, will throw an error if the file can't be saved
    	     * might want to expand this to avoid dataloss on partial save
    	     * @param {string} dbname - the filename of the database to load
    	     * @param {function} callback - the callback to handle the result
    	     * @memberof LokiFsAdapter
    	     */
    	    LokiFsAdapter.prototype.saveDatabase = function saveDatabase(dbname, dbstring, callback) {
    	      var self = this;
    	      var tmpdbname = dbname + '~';
    	      this.fs.writeFile(tmpdbname, dbstring, function writeFileCallback(err) {
    	        if (err) {
    	          callback(new Error(err));
    	        } else {
    	          self.fs.rename(tmpdbname, dbname, callback);
    	        }
    	      });
    	    };

    	    /**
    	     * deleteDatabase() - delete the database file, will throw an error if the
    	     * file can't be deleted
    	     * @param {string} dbname - the filename of the database to delete
    	     * @param {function} callback - the callback to handle the result
    	     * @memberof LokiFsAdapter
    	     */
    	    LokiFsAdapter.prototype.deleteDatabase = function deleteDatabase(dbname, callback) {
    	      this.fs.unlink(dbname, function deleteDatabaseCallback(err) {
    	        if (err) {
    	          callback(new Error(err));
    	        } else {
    	          callback();
    	        }
    	      });
    	    };


    	    /**
    	     * A loki persistence adapter which persists to web browser's local storage object
    	     * @constructor LokiLocalStorageAdapter
    	     */
    	    function LokiLocalStorageAdapter() { }

    	    /**
    	     * loadDatabase() - Load data from localstorage
    	     * @param {string} dbname - the name of the database to load
    	     * @param {function} callback - the callback to handle the result
    	     * @memberof LokiLocalStorageAdapter
    	     */
    	    LokiLocalStorageAdapter.prototype.loadDatabase = function loadDatabase(dbname, callback) {
    	      if (localStorageAvailable()) {
    	        callback(localStorage.getItem(dbname));
    	      } else {
    	        callback(new Error('localStorage is not available'));
    	      }
    	    };

    	    /**
    	     * saveDatabase() - save data to localstorage, will throw an error if the file can't be saved
    	     * might want to expand this to avoid dataloss on partial save
    	     * @param {string} dbname - the filename of the database to load
    	     * @param {function} callback - the callback to handle the result
    	     * @memberof LokiLocalStorageAdapter
    	     */
    	    LokiLocalStorageAdapter.prototype.saveDatabase = function saveDatabase(dbname, dbstring, callback) {
    	      if (localStorageAvailable()) {
    	        localStorage.setItem(dbname, dbstring);
    	        callback(null);
    	      } else {
    	        callback(new Error('localStorage is not available'));
    	      }
    	    };

    	    /**
    	     * deleteDatabase() - delete the database from localstorage, will throw an error if it
    	     * can't be deleted
    	     * @param {string} dbname - the filename of the database to delete
    	     * @param {function} callback - the callback to handle the result
    	     * @memberof LokiLocalStorageAdapter
    	     */
    	    LokiLocalStorageAdapter.prototype.deleteDatabase = function deleteDatabase(dbname, callback) {
    	      if (localStorageAvailable()) {
    	        localStorage.removeItem(dbname);
    	        callback(null);
    	      } else {
    	        callback(new Error('localStorage is not available'));
    	      }
    	    };

    	    /**
    	     * Wait for throttledSaves to complete and invoke your callback when drained or duration is met.
    	     *
    	     * @param {function} callback - callback to fire when save queue is drained, it is passed a sucess parameter value
    	     * @param {object=} options - configuration options
    	     * @param {boolean} options.recursiveWait - (default: true) if after queue is drained, another save was kicked off, wait for it
    	     * @param {bool} options.recursiveWaitLimit - (default: false) limit our recursive waiting to a duration
    	     * @param {int} options.recursiveWaitLimitDelay - (default: 2000) cutoff in ms to stop recursively re-draining
    	     * @memberof Loki
    	     */
    	    Loki.prototype.throttledSaveDrain = function (callback, options) {
    	      var self = this;
    	      var now = (new Date()).getTime();

    	      if (!this.throttledSaves) {
    	        callback(true);
    	      }

    	      options = options || {};
    	      if (!options.hasOwnProperty('recursiveWait')) {
    	        options.recursiveWait = true;
    	      }
    	      if (!options.hasOwnProperty('recursiveWaitLimit')) {
    	        options.recursiveWaitLimit = false;
    	      }
    	      if (!options.hasOwnProperty('recursiveWaitLimitDuration')) {
    	        options.recursiveWaitLimitDuration = 2000;
    	      }
    	      if (!options.hasOwnProperty('started')) {
    	        options.started = (new Date()).getTime();
    	      }

    	      // if save is pending
    	      if (this.throttledSaves && this.throttledSavePending) {
    	        // if we want to wait until we are in a state where there are no pending saves at all
    	        if (options.recursiveWait) {
    	          // queue the following meta callback for when it completes
    	          this.throttledCallbacks.push(function () {
    	            // if there is now another save pending...
    	            if (self.throttledSavePending) {
    	              // if we wish to wait only so long and we have exceeded limit of our waiting, callback with false success value
    	              if (options.recursiveWaitLimit && (now - options.started > options.recursiveWaitLimitDuration)) {
    	                callback(false);
    	                return;
    	              }
    	              // it must be ok to wait on next queue drain
    	              self.throttledSaveDrain(callback, options);
    	              return;
    	            }
    	            // no pending saves so callback with true success
    	            else {
    	              callback(true);
    	              return;
    	            }
    	          });
    	        }
    	        // just notify when current queue is depleted
    	        else {
    	          this.throttledCallbacks.push(callback);
    	          return;
    	        }
    	      }
    	      // no save pending, just callback
    	      else {
    	        callback(true);
    	      }
    	    };

    	    /**
    	     * Internal load logic, decoupled from throttling/contention logic
    	     *
    	     * @param {object} options - not currently used (remove or allow overrides?)
    	     * @param {function=} callback - (Optional) user supplied async callback / error handler
    	     */
    	    Loki.prototype.loadDatabaseInternal = function (options, callback) {
    	      var cFun = callback || function (err, data) {
    	        if (err) {
    	          throw err;
    	        }
    	      },
    	        self = this;

    	      // the persistenceAdapter should be present if all is ok, but check to be sure.
    	      if (this.persistenceAdapter !== null) {

    	        this.persistenceAdapter.loadDatabase(this.filename, function loadDatabaseCallback(dbString) {
    	          if (typeof (dbString) === 'string') {
    	            var parseSuccess = false;
    	            try {
    	              self.loadJSON(dbString, options || {});
    	              parseSuccess = true;
    	            } catch (err) {
    	              cFun(err);
    	            }
    	            if (parseSuccess) {
    	              cFun(null);
    	              self.emit('loaded', 'database ' + self.filename + ' loaded');
    	            }
    	          } else {
    	            // falsy result means new database
    	            if (!dbString) {
    	              cFun(null);
    	              self.emit('loaded', 'empty database ' + self.filename + ' loaded');
    	              return;
    	            }

    	            // instanceof error means load faulted
    	            if (dbString instanceof Error) {
    	              cFun(dbString);
    	              return;
    	            }

    	            // if adapter has returned an js object (other than null or error) attempt to load from JSON object
    	            if (typeof (dbString) === "object") {
    	              self.loadJSONObject(dbString, options || {});
    	              cFun(null); // return null on success
    	              self.emit('loaded', 'database ' + self.filename + ' loaded');
    	              return;
    	            }

    	            cFun("unexpected adapter response : " + dbString);
    	          }
    	        });

    	      } else {
    	        cFun(new Error('persistenceAdapter not configured'));
    	      }
    	    };

    	    /**
    	     * Handles manually loading from file system, local storage, or adapter (such as indexeddb)
    	     *    This method utilizes loki configuration options (if provided) to determine which
    	     *    persistence method to use, or environment detection (if configuration was not provided).
    	     *    To avoid contention with any throttledSaves, we will drain the save queue first.
    	     *
    	     * If you are configured with autosave, you do not need to call this method yourself.
    	     *
    	     * @param {object} options - if throttling saves and loads, this controls how we drain save queue before loading
    	     * @param {boolean} options.recursiveWait - (default: true) wait recursively until no saves are queued
    	     * @param {bool} options.recursiveWaitLimit - (default: false) limit our recursive waiting to a duration
    	     * @param {int} options.recursiveWaitLimitDelay - (default: 2000) cutoff in ms to stop recursively re-draining
    	     * @param {function=} callback - (Optional) user supplied async callback / error handler
    	     * @memberof Loki
    	     * @example
    	     * db.loadDatabase({}, function(err) {
    	     *   if (err) {
    	     *     console.log("error : " + err);
    	     *   }
    	     *   else {
    	     *     console.log("database loaded.");
    	     *   }
    	     * });
    	     */
    	    Loki.prototype.loadDatabase = function (options, callback) {
    	      var self = this;

    	      // if throttling disabled, just call internal
    	      if (!this.throttledSaves) {
    	        this.loadDatabaseInternal(options, callback);
    	        return;
    	      }

    	      // try to drain any pending saves in the queue to lock it for loading
    	      this.throttledSaveDrain(function (success) {
    	        if (success) {
    	          // pause/throttle saving until loading is done
    	          self.throttledSavePending = true;

    	          self.loadDatabaseInternal(options, function (err) {
    	            // now that we are finished loading, if no saves were throttled, disable flag
    	            if (self.throttledCallbacks.length === 0) {
    	              self.throttledSavePending = false;
    	            }
    	            // if saves requests came in while loading, kick off new save to kick off resume saves
    	            else {
    	              self.saveDatabase();
    	            }

    	            if (typeof callback === 'function') {
    	              callback(err);
    	            }
    	          });
    	          return;
    	        }
    	        else {
    	          if (typeof callback === 'function') {
    	            callback(new Error("Unable to pause save throttling long enough to read database"));
    	          }
    	        }
    	      }, options);
    	    };

    	    /**
    	     * Internal save logic, decoupled from save throttling logic
    	     */
    	    Loki.prototype.saveDatabaseInternal = function (callback) {
    	      var cFun = callback || function (err) {
    	        if (err) {
    	          throw err;
    	        }
    	        return;
    	      };
    	      var self = this;

    	      // the persistenceAdapter should be present if all is ok, but check to be sure.
    	      if (!this.persistenceAdapter) {
    	        cFun(new Error('persistenceAdapter not configured'));
    	        return;
    	      }

    	      // run incremental, reference, or normal mode adapters, depending on what's available
    	      if (this.persistenceAdapter.mode === "incremental") {
    	        var cachedDirty;
    	        // ignore autosave until we copy loki (only then we can clear dirty flags,
    	        // but if we don't do it now, autosave will be triggered a lot unnecessarily)
    	        this.ignoreAutosave = true;
    	        this.persistenceAdapter.saveDatabase(
    	          this.filename,
    	          function getLokiCopy() {
    	            self.ignoreAutosave = false;
    	            if (cachedDirty) {
    	              cFun(new Error('adapter error - getLokiCopy called more than once'));
    	              return;
    	            }
    	            var lokiCopy = self.copy({ removeNonSerializable: true });

    	            // remember and clear dirty ids -- we must do it before the save so that if
    	            // and update occurs between here and callback, it will get saved later
    	            cachedDirty = self.collections.map(function (collection) {
    	              return [collection.dirty, collection.dirtyIds];
    	            });
    	            self.collections.forEach(function (col) {
    	              col.dirty = false;
    	              col.dirtyIds = [];
    	            });
    	            return lokiCopy;
    	          },
    	          function exportDatabaseCallback(err) {
    	            self.ignoreAutosave = false;
    	            if (err && cachedDirty) {
    	              // roll back dirty IDs to be saved later
    	              self.collections.forEach(function (col, i) {
    	                var cached = cachedDirty[i];
    	                col.dirty = col.dirty || cached[0];
    	                col.dirtyIds = col.dirtyIds.concat(cached[1]);
    	              });
    	            }
    	            cFun(err);
    	          });
    	      } else if (this.persistenceAdapter.mode === "reference" && typeof this.persistenceAdapter.exportDatabase === "function") {
    	        // TODO: dirty should be cleared here
    	        // filename may seem redundant but loadDatabase will need to expect this same filename
    	        this.persistenceAdapter.exportDatabase(this.filename, this.copy({ removeNonSerializable: true }), function exportDatabaseCallback(err) {
    	          self.autosaveClearFlags();
    	          cFun(err);
    	        });
    	      }
    	      // otherwise just pass the serialized database to adapter
    	      else {
    	        // persistenceAdapter might be asynchronous, so we must clear `dirty` immediately
    	        // or autosave won't work if an update occurs between here and the callback
    	        // TODO: This should be stored and rolled back in case of DB save failure
    	        this.autosaveClearFlags();
    	        this.persistenceAdapter.saveDatabase(this.filename, this.serialize(), function saveDatabasecallback(err) {
    	          cFun(err);
    	        });
    	      }
    	    };

    	    /**
    	     * Handles manually saving to file system, local storage, or adapter (such as indexeddb)
    	     *    This method utilizes loki configuration options (if provided) to determine which
    	     *    persistence method to use, or environment detection (if configuration was not provided).
    	     *
    	     * If you are configured with autosave, you do not need to call this method yourself.
    	     *
    	     * @param {function=} callback - (Optional) user supplied async callback / error handler
    	     * @memberof Loki
    	     * @example
    	     * db.saveDatabase(function(err) {
    	     *   if (err) {
    	     *     console.log("error : " + err);
    	     *   }
    	     *   else {
    	     *     console.log("database saved.");
    	     *   }
    	     * });
    	     */
    	    Loki.prototype.saveDatabase = function (callback) {
    	      if (!this.throttledSaves) {
    	        this.saveDatabaseInternal(callback);
    	        return;
    	      }

    	      if (this.throttledSavePending) {
    	        this.throttledCallbacks.push(callback);
    	        return;
    	      }

    	      var localCallbacks = this.throttledCallbacks;
    	      this.throttledCallbacks = [];
    	      localCallbacks.unshift(callback);
    	      this.throttledSavePending = true;

    	      var self = this;
    	      this.saveDatabaseInternal(function (err) {
    	        self.throttledSavePending = false;
    	        localCallbacks.forEach(function (pcb) {
    	          if (typeof pcb === 'function') {
    	            // Queue the callbacks so we first finish this method execution
    	            setTimeout(function () {
    	              pcb(err);
    	            }, 1);
    	          }
    	        });

    	        // since this is called async, future requests may have come in, if so.. kick off next save
    	        if (self.throttledCallbacks.length > 0) {
    	          self.saveDatabase();
    	        }
    	      });
    	    };

    	    // alias
    	    Loki.prototype.save = Loki.prototype.saveDatabase;

    	    /**
    	     * Handles deleting a database from file system, local
    	     *    storage, or adapter (indexeddb)
    	     *    This method utilizes loki configuration options (if provided) to determine which
    	     *    persistence method to use, or environment detection (if configuration was not provided).
    	     *
    	     * @param {function=} callback - (Optional) user supplied async callback / error handler
    	     * @memberof Loki
    	     */
    	    Loki.prototype.deleteDatabase = function (options, callback) {
    	      var cFun = callback || function (err, data) {
    	        if (err) {
    	          throw err;
    	        }
    	      };

    	      // we aren't even using options, so we will support syntax where
    	      // callback is passed as first and only argument
    	      if (typeof options === 'function' && !callback) {
    	        cFun = options;
    	      }

    	      // the persistenceAdapter should be present if all is ok, but check to be sure.
    	      if (this.persistenceAdapter !== null) {
    	        this.persistenceAdapter.deleteDatabase(this.filename, function deleteDatabaseCallback(err) {
    	          cFun(err);
    	        });
    	      } else {
    	        cFun(new Error('persistenceAdapter not configured'));
    	      }
    	    };

    	    /**
    	     * autosaveDirty - check whether any collections are 'dirty' meaning we need to save (entire) database
    	     *
    	     * @returns {boolean} - true if database has changed since last autosave, false if not.
    	     */
    	    Loki.prototype.autosaveDirty = function () {
    	      for (var idx = 0; idx < this.collections.length; idx++) {
    	        if (this.collections[idx].dirty) {
    	          return true;
    	        }
    	      }

    	      return false;
    	    };

    	    /**
    	     * autosaveClearFlags - resets dirty flags on all collections.
    	     *    Called from saveDatabase() after db is saved.
    	     *
    	     */
    	    Loki.prototype.autosaveClearFlags = function () {
    	      for (var idx = 0; idx < this.collections.length; idx++) {
    	        this.collections[idx].dirty = false;
    	      }
    	    };

    	    /**
    	     * autosaveEnable - begin a javascript interval to periodically save the database.
    	     *
    	     * @param {object} options - not currently used (remove or allow overrides?)
    	     * @param {function=} callback - (Optional) user supplied async callback
    	     */
    	    Loki.prototype.autosaveEnable = function (options, callback) {
    	      this.autosave = true;

    	      var delay = 5000,
    	        self = this;

    	      if (typeof (this.autosaveInterval) !== 'undefined' && this.autosaveInterval !== null) {
    	        delay = this.autosaveInterval;
    	      }

    	      this.autosaveHandle = setInterval(function autosaveHandleInterval() {
    	        // use of dirty flag will need to be hierarchical since mods are done at collection level with no visibility of 'db'
    	        // so next step will be to implement collection level dirty flags set on insert/update/remove
    	        // along with loki level isdirty() function which iterates all collections to see if any are dirty

    	        if (self.autosaveDirty() && !self.ignoreAutosave) {
    	          self.saveDatabase(callback);
    	        }
    	      }, delay);
    	    };

    	    /**
    	     * autosaveDisable - stop the autosave interval timer.
    	     *
    	     */
    	    Loki.prototype.autosaveDisable = function () {
    	      if (typeof (this.autosaveHandle) !== 'undefined' && this.autosaveHandle !== null) {
    	        clearInterval(this.autosaveHandle);
    	        this.autosaveHandle = null;
    	      }
    	    };


    	    /**
    	     * Resultset class allowing chainable queries.  Intended to be instanced internally.
    	     *    Collection.find(), Collection.where(), and Collection.chain() instantiate this.
    	     *
    	     * @example
    	     *    mycollection.chain()
    	     *      .find({ 'doors' : 4 })
    	     *      .where(function(obj) { return obj.name === 'Toyota' })
    	     *      .data();
    	     *
    	     * @constructor Resultset
    	     * @param {Collection} collection - The collection which this Resultset will query against.
    	     */
    	    function Resultset(collection, options) {

    	      // retain reference to collection we are querying against
    	      this.collection = collection;
    	      this.filteredrows = [];
    	      this.filterInitialized = false;

    	      return this;
    	    }

    	    /**
    	     * reset() - Reset the resultset to its initial state.
    	     *
    	     * @returns {Resultset} Reference to this resultset, for future chain operations.
    	     */
    	    Resultset.prototype.reset = function () {
    	      if (this.filteredrows.length > 0) {
    	        this.filteredrows = [];
    	      }
    	      this.filterInitialized = false;
    	      return this;
    	    };

    	    /**
    	     * toJSON() - Override of toJSON to avoid circular references
    	     *
    	     */
    	    Resultset.prototype.toJSON = function () {
    	      var copy = this.copy();
    	      copy.collection = null;
    	      return copy;
    	    };

    	    /**
    	     * Allows you to limit the number of documents passed to next chain operation.
    	     *    A resultset copy() is made to avoid altering original resultset.
    	     *
    	     * @param {int} qty - The number of documents to return.
    	     * @returns {Resultset} Returns a copy of the resultset, limited by qty, for subsequent chain ops.
    	     * @memberof Resultset
    	     * // find the two oldest users
    	     * var result = users.chain().simplesort("age", true).limit(2).data();
    	     */
    	    Resultset.prototype.limit = function (qty) {
    	      // if this has no filters applied, we need to populate filteredrows first
    	      if (!this.filterInitialized && this.filteredrows.length === 0) {
    	        this.filteredrows = this.collection.prepareFullDocIndex();
    	      }

    	      var rscopy = new Resultset(this.collection);
    	      rscopy.filteredrows = this.filteredrows.slice(0, qty);
    	      rscopy.filterInitialized = true;
    	      return rscopy;
    	    };

    	    /**
    	     * Used for skipping 'pos' number of documents in the resultset.
    	     *
    	     * @param {int} pos - Number of documents to skip; all preceding documents are filtered out.
    	     * @returns {Resultset} Returns a copy of the resultset, containing docs starting at 'pos' for subsequent chain ops.
    	     * @memberof Resultset
    	     * // find everyone but the two oldest users
    	     * var result = users.chain().simplesort("age", true).offset(2).data();
    	     */
    	    Resultset.prototype.offset = function (pos) {
    	      // if this has no filters applied, we need to populate filteredrows first
    	      if (!this.filterInitialized && this.filteredrows.length === 0) {
    	        this.filteredrows = this.collection.prepareFullDocIndex();
    	      }

    	      var rscopy = new Resultset(this.collection);
    	      rscopy.filteredrows = this.filteredrows.slice(pos);
    	      rscopy.filterInitialized = true;
    	      return rscopy;
    	    };

    	    /**
    	     * copy() - To support reuse of resultset in branched query situations.
    	     *
    	     * @returns {Resultset} Returns a copy of the resultset (set) but the underlying document references will be the same.
    	     * @memberof Resultset
    	     */
    	    Resultset.prototype.copy = function () {
    	      var result = new Resultset(this.collection);

    	      if (this.filteredrows.length > 0) {
    	        result.filteredrows = this.filteredrows.slice();
    	      }
    	      result.filterInitialized = this.filterInitialized;

    	      return result;
    	    };

    	    /**
    	     * Alias of copy()
    	     * @memberof Resultset
    	     */
    	    Resultset.prototype.branch = Resultset.prototype.copy;

    	    /**
    	     * transform() - executes a named collection transform or raw array of transform steps against the resultset.
    	     *
    	     * @param transform {(string|array)} - name of collection transform or raw transform array
    	     * @param parameters {object=} - (Optional) object property hash of parameters, if the transform requires them.
    	     * @returns {Resultset} either (this) resultset or a clone of of this resultset (depending on steps)
    	     * @memberof Resultset
    	     * @example
    	     * users.addTransform('CountryFilter', [
    	     *   {
    	     *     type: 'find',
    	     *     value: {
    	     *       'country': { $eq: '[%lktxp]Country' }
    	     *     }
    	     *   },
    	     *   {
    	     *     type: 'simplesort',
    	     *     property: 'age',
    	     *     options: { desc: false}
    	     *   }
    	     * ]);
    	     * var results = users.chain().transform("CountryFilter", { Country: 'fr' }).data();
    	     */
    	    Resultset.prototype.transform = function (transform, parameters) {
    	      var idx,
    	        step,
    	        rs = this;

    	      // if transform is name, then do lookup first
    	      if (typeof transform === 'string') {
    	        if (this.collection.transforms.hasOwnProperty(transform)) {
    	          transform = this.collection.transforms[transform];
    	        }
    	      }

    	      // either they passed in raw transform array or we looked it up, so process
    	      if (typeof transform !== 'object' || !Array.isArray(transform)) {
    	        throw new Error("Invalid transform");
    	      }

    	      if (typeof parameters !== 'undefined') {
    	        transform = Utils.resolveTransformParams(transform, parameters);
    	      }

    	      for (idx = 0; idx < transform.length; idx++) {
    	        step = transform[idx];

    	        switch (step.type) {
    	          case "find":
    	            rs.find(step.value);
    	            break;
    	          case "where":
    	            rs.where(step.value);
    	            break;
    	          case "simplesort":
    	            rs.simplesort(step.property, step.desc || step.options);
    	            break;
    	          case "compoundsort":
    	            rs.compoundsort(step.value);
    	            break;
    	          case "sort":
    	            rs.sort(step.value);
    	            break;
    	          case "limit":
    	            rs = rs.limit(step.value);
    	            break; // limit makes copy so update reference
    	          case "offset":
    	            rs = rs.offset(step.value);
    	            break; // offset makes copy so update reference
    	          case "map":
    	            rs = rs.map(step.value, step.dataOptions);
    	            break;
    	          case "eqJoin":
    	            rs = rs.eqJoin(step.joinData, step.leftJoinKey, step.rightJoinKey, step.mapFun, step.dataOptions);
    	            break;
    	          // following cases break chain by returning array data so make any of these last in transform steps
    	          case "mapReduce":
    	            rs = rs.mapReduce(step.mapFunction, step.reduceFunction);
    	            break;
    	          // following cases update documents in current filtered resultset (use carefully)
    	          case "update":
    	            rs.update(step.value);
    	            break;
    	          case "remove":
    	            rs.remove();
    	            break;
    	        }
    	      }

    	      return rs;
    	    };

    	    /**
    	     * User supplied compare function is provided two documents to compare. (chainable)
    	     * @example
    	     *    rslt.sort(function(obj1, obj2) {
    	     *      if (obj1.name === obj2.name) return 0;
    	     *      if (obj1.name > obj2.name) return 1;
    	     *      if (obj1.name < obj2.name) return -1;
    	     *    });
    	     *
    	     * @param {function} comparefun - A javascript compare function used for sorting.
    	     * @returns {Resultset} Reference to this resultset, sorted, for future chain operations.
    	     * @memberof Resultset
    	     */
    	    Resultset.prototype.sort = function (comparefun) {
    	      // if this has no filters applied, just we need to populate filteredrows first
    	      if (!this.filterInitialized && this.filteredrows.length === 0) {
    	        this.filteredrows = this.collection.prepareFullDocIndex();
    	      }

    	      var wrappedComparer =
    	        (function (userComparer, data) {
    	          return function (a, b) {
    	            return userComparer(data[a], data[b]);
    	          };
    	        })(comparefun, this.collection.data);

    	      this.filteredrows.sort(wrappedComparer);

    	      return this;
    	    };

    	    /**
    	     * Simpler, loose evaluation for user to sort based on a property name. (chainable).
    	     *    Sorting based on the same lt/gt helper functions used for binary indices.
    	     *
    	     * @param {string} propname - name of property to sort by.
    	     * @param {object|bool=} options - boolean to specify if isdescending, or options object
    	     * @param {boolean} [options.desc=false] - whether to sort descending
    	     * @param {boolean} [options.disableIndexIntersect=false] - whether we should explicity not use array intersection.
    	     * @param {boolean} [options.forceIndexIntersect=false] - force array intersection (if binary index exists).
    	     * @param {boolean} [options.useJavascriptSorting=false] - whether results are sorted via basic javascript sort.
    	     * @returns {Resultset} Reference to this resultset, sorted, for future chain operations.
    	     * @memberof Resultset
    	     * @example
    	     * var results = users.chain().simplesort('age').data();
    	     */
    	    Resultset.prototype.simplesort = function (propname, options) {
    	      var eff,
    	        targetEff = 10,
    	        dc = this.collection.data.length,
    	        frl = this.filteredrows.length,
    	        hasBinaryIndex = this.collection.binaryIndices.hasOwnProperty(propname);

    	      if (typeof (options) === 'undefined' || options === false) {
    	        options = { desc: false };
    	      }
    	      if (options === true) {
    	        options = { desc: true };
    	      }

    	      // if nothing in filtered rows array...
    	      if (frl === 0) {
    	        // if the filter is initialized to be empty resultset, do nothing
    	        if (this.filterInitialized) {
    	          return this;
    	        }

    	        // otherwise no filters applied implies all documents, so we need to populate filteredrows first

    	        // if we have a binary index, we can just use that instead of sorting (again)
    	        if (this.collection.binaryIndices.hasOwnProperty(propname)) {
    	          // make sure index is up-to-date
    	          this.collection.ensureIndex(propname);
    	          // copy index values into filteredrows
    	          this.filteredrows = this.collection.binaryIndices[propname].values.slice(0);

    	          if (options.desc) {
    	            this.filteredrows.reverse();
    	          }

    	          // we are done, return this (resultset) for further chain ops
    	          return this;
    	        }
    	        // otherwise initialize array for sort below
    	        else {
    	          // build full document index (to be sorted subsequently)
    	          this.filteredrows = this.collection.prepareFullDocIndex();
    	        }
    	      }
    	      // otherwise we had results to begin with, see if we qualify for index intercept optimization
    	      else {

    	        // If already filtered, but we want to leverage binary index on sort.
    	        // This will use custom array intection algorithm.
    	        if (!options.disableIndexIntersect && hasBinaryIndex) {

    	          // calculate filter efficiency
    	          eff = dc / frl;

    	          // when javascript sort fallback is enabled, you generally need more than ~17% of total docs in resultset
    	          // before array intersect is determined to be the faster algorithm, otherwise leave at 10% for loki sort.
    	          if (options.useJavascriptSorting) {
    	            targetEff = 6;
    	          }

    	          // anything more than ratio of 10:1 (total documents/current results) should use old sort code path
    	          // So we will only use array intersection if you have more than 10% of total docs in your current resultset.
    	          if (eff <= targetEff || options.forceIndexIntersect) {
    	            var idx, fr = this.filteredrows;
    	            var io = {};
    	            // set up hashobject for simple 'inclusion test' with existing (filtered) results
    	            for (idx = 0; idx < frl; idx++) {
    	              io[fr[idx]] = true;
    	            }
    	            // grab full sorted binary index array
    	            var pv = this.collection.binaryIndices[propname].values;

    	            // filter by existing results
    	            this.filteredrows = pv.filter(function (n) { return io[n]; });

    	            if (options.desc) {
    	              this.filteredrows.reverse();
    	            }

    	            return this;
    	          }
    	        }
    	      }

    	      // at this point, we will not be able to leverage binary index so we will have to do an array sort

    	      // if we have opted to use simplified javascript comparison function...
    	      if (options.useJavascriptSorting) {
    	        return this.sort(function (obj1, obj2) {
    	          if (obj1[propname] === obj2[propname]) return 0;
    	          if (obj1[propname] > obj2[propname]) return 1;
    	          if (obj1[propname] < obj2[propname]) return -1;
    	        });
    	      }

    	      // otherwise use loki sort which will return same results if column is indexed or not
    	      var wrappedComparer =
    	        (function (prop, desc, data) {
    	          var val1, val2, arr;
    	          return function (a, b) {
    	            if (~prop.indexOf('.')) {
    	              arr = prop.split('.');
    	              val1 = Utils.getIn(data[a], arr, true);
    	              val2 = Utils.getIn(data[b], arr, true);
    	            } else {
    	              val1 = data[a][prop];
    	              val2 = data[b][prop];
    	            }
    	            return sortHelper(val1, val2, desc);
    	          };
    	        })(propname, options.desc, this.collection.data);

    	      this.filteredrows.sort(wrappedComparer);

    	      return this;
    	    };

    	    /**
    	     * Allows sorting a resultset based on multiple columns.
    	     * @example
    	     * // to sort by age and then name (both ascending)
    	     * rs.compoundsort(['age', 'name']);
    	     * // to sort by age (ascending) and then by name (descending)
    	     * rs.compoundsort(['age', ['name', true]]);
    	     *
    	     * @param {array} properties - array of property names or subarray of [propertyname, isdesc] used evaluate sort order
    	     * @returns {Resultset} Reference to this resultset, sorted, for future chain operations.
    	     * @memberof Resultset
    	     */
    	    Resultset.prototype.compoundsort = function (properties) {
    	      if (properties.length === 0) {
    	        throw new Error("Invalid call to compoundsort, need at least one property");
    	      }

    	      var prop;
    	      if (properties.length === 1) {
    	        prop = properties[0];
    	        if (Array.isArray(prop)) {
    	          return this.simplesort(prop[0], prop[1]);
    	        }
    	        return this.simplesort(prop, false);
    	      }

    	      // unify the structure of 'properties' to avoid checking it repeatedly while sorting
    	      for (var i = 0, len = properties.length; i < len; i += 1) {
    	        prop = properties[i];
    	        if (!Array.isArray(prop)) {
    	          properties[i] = [prop, false];
    	        }
    	      }

    	      // if this has no filters applied, just we need to populate filteredrows first
    	      if (!this.filterInitialized && this.filteredrows.length === 0) {
    	        this.filteredrows = this.collection.prepareFullDocIndex();
    	      }

    	      var wrappedComparer =
    	        (function (props, data) {
    	          return function (a, b) {
    	            return compoundeval(props, data[a], data[b]);
    	          };
    	        })(properties, this.collection.data);

    	      this.filteredrows.sort(wrappedComparer);

    	      return this;
    	    };

    	    /**
    	     * findOr() - oversee the operation of OR'ed query expressions.
    	     *    OR'ed expression evaluation runs each expression individually against the full collection,
    	     *    and finally does a set OR on each expression's results.
    	     *    Each evaluation can utilize a binary index to prevent multiple linear array scans.
    	     *
    	     * @param {array} expressionArray - array of expressions
    	     * @returns {Resultset} this resultset for further chain ops.
    	     */
    	    Resultset.prototype.findOr = function (expressionArray) {
    	      var fr = null,
    	        fri = 0,
    	        frlen = 0,
    	        docset = [],
    	        idxset = [],
    	        idx = 0;
    	        this.count();

    	      // If filter is already initialized, then we query against only those items already in filter.
    	      // This means no index utilization for fields, so hopefully its filtered to a smallish filteredrows.
    	      for (var ei = 0, elen = expressionArray.length; ei < elen; ei++) {
    	        // we need to branch existing query to run each filter separately and combine results
    	        fr = this.branch().find(expressionArray[ei]).filteredrows;
    	        frlen = fr.length;

    	        // add any document 'hits'
    	        for (fri = 0; fri < frlen; fri++) {
    	          idx = fr[fri];
    	          if (idxset[idx] === undefined) {
    	            idxset[idx] = true;
    	            docset.push(idx);
    	          }
    	        }
    	      }

    	      this.filteredrows = docset;
    	      this.filterInitialized = true;

    	      return this;
    	    };
    	    Resultset.prototype.$or = Resultset.prototype.findOr;

    	    // precompile recursively
    	    function precompileQuery(operator, value) {
    	      // for regex ops, precompile
    	      if (operator === '$regex') {
    	        if (Array.isArray(value)) {
    	          value = new RegExp(value[0], value[1]);
    	        } else if (!(value instanceof RegExp)) {
    	          value = new RegExp(value);
    	        }
    	      }
    	      else if (typeof value === 'object') {
    	        for (var key in value) {
    	          if (key === '$regex' || typeof value[key] === 'object') {
    	            value[key] = precompileQuery(key, value[key]);
    	          }
    	        }
    	      }

    	      return value;
    	    }

    	    /**
    	     * findAnd() - oversee the operation of AND'ed query expressions.
    	     *    AND'ed expression evaluation runs each expression progressively against the full collection,
    	     *    internally utilizing existing chained resultset functionality.
    	     *    Only the first filter can utilize a binary index.
    	     *
    	     * @param {array} expressionArray - array of expressions
    	     * @returns {Resultset} this resultset for further chain ops.
    	     */
    	    Resultset.prototype.findAnd = function (expressionArray) {
    	      // we have already implementing method chaining in this (our Resultset class)
    	      // so lets just progressively apply user supplied and filters
    	      for (var i = 0, len = expressionArray.length; i < len; i++) {
    	        if (this.count() === 0) {
    	          return this;
    	        }
    	        this.find(expressionArray[i]);
    	      }
    	      return this;
    	    };
    	    Resultset.prototype.$and = Resultset.prototype.findAnd;

    	    /**
    	     * Used for querying via a mongo-style query object.
    	     *
    	     * @param {object} query - A mongo-style query object used for filtering current results.
    	     * @param {boolean=} firstOnly - (Optional) Used by collection.findOne()
    	     * @returns {Resultset} this resultset for further chain ops.
    	     * @memberof Resultset
    	     * @example
    	     * var over30 = users.chain().find({ age: { $gte: 30 } }).data();
    	     */
    	    Resultset.prototype.find = function (query, firstOnly) {
    	      if (this.collection.data.length === 0) {
    	        this.filteredrows = [];
    	        this.filterInitialized = true;
    	        return this;
    	      }

    	      var queryObject = query || 'getAll',
    	        p,
    	        property,
    	        queryObjectOp,
    	        obj,
    	        operator,
    	        value,
    	        key,
    	        searchByIndex = false,
    	        result = [],
    	        filters = [],
    	        index = null;

    	      // flag if this was invoked via findOne()
    	      firstOnly = firstOnly || false;

    	      if (typeof queryObject === 'object') {
    	        for (p in queryObject) {
    	          obj = {};
    	          obj[p] = queryObject[p];
    	          filters.push(obj);

    	          if (hasOwnProperty.call(queryObject, p)) {
    	            property = p;
    	            queryObjectOp = queryObject[p];
    	          }
    	        }
    	        // if more than one expression in single query object,
    	        // convert implicit $and to explicit $and
    	        if (filters.length > 1) {
    	          return this.find({ '$and': filters }, firstOnly);
    	        }
    	      }

    	      // apply no filters if they want all
    	      if (!property || queryObject === 'getAll') {
    	        if (firstOnly) {
    	          if (this.filterInitialized) {
    	            this.filteredrows = this.filteredrows.slice(0, 1);
    	          } else {
    	            this.filteredrows = (this.collection.data.length > 0) ? [0] : [];
    	            this.filterInitialized = true;
    	          }
    	        }

    	        return this;
    	      }

    	      // injecting $and and $or expression tree evaluation here.
    	      if (property === '$and' || property === '$or') {
    	        this[property](queryObjectOp);

    	        // for chained find with firstonly,
    	        if (firstOnly && this.filteredrows.length > 1) {
    	          this.filteredrows = this.filteredrows.slice(0, 1);
    	        }

    	        return this;
    	      }

    	      // see if query object is in shorthand mode (assuming eq operator)
    	      if (queryObjectOp === null || (typeof queryObjectOp !== 'object' || queryObjectOp instanceof Date)) {
    	        operator = '$eq';
    	        value = queryObjectOp;
    	      } else if (typeof queryObjectOp === 'object') {
    	        for (key in queryObjectOp) {
    	          if (hasOwnProperty.call(queryObjectOp, key)) {
    	            operator = key;
    	            value = queryObjectOp[key];
    	            break;
    	          }
    	        }
    	      } else {
    	        throw new Error('Do not know what you want to do.');
    	      }

    	      if (operator === '$regex' || typeof value === 'object') {
    	        value = precompileQuery(operator, value);
    	      }

    	      // if user is deep querying the object such as find('name.first': 'odin')
    	      var usingDotNotation = (property.indexOf('.') !== -1);

    	      // if an index exists for the property being queried against, use it
    	      // for now only enabling where it is the first filter applied and prop is indexed
    	      var doIndexCheck = !this.filterInitialized;

    	      if (doIndexCheck && this.collection.binaryIndices[property] && indexedOps[operator]) {
    	        // this is where our lazy index rebuilding will take place
    	        // basically we will leave all indexes dirty until we need them
    	        // so here we will rebuild only the index tied to this property
    	        // ensureIndex() will only rebuild if flagged as dirty since we are not passing force=true param
    	        if (this.collection.adaptiveBinaryIndices !== true) {
    	          this.collection.ensureIndex(property);
    	        }

    	        searchByIndex = true;
    	        index = this.collection.binaryIndices[property];
    	      }

    	      // opportunistically speed up $in searches from O(n*m) to O(n*log m)
    	      if (!searchByIndex && operator === '$in' && Array.isArray(value) && typeof Set !== 'undefined') {
    	        value = new Set(value);
    	        operator = '$inSet';
    	      }

    	      // the comparison function
    	      var fun = LokiOps[operator];

    	      // "shortcut" for collection data
    	      var t = this.collection.data;
    	      // filter data length
    	      var i = 0,
    	        len = 0;

    	      // Query executed differently depending on :
    	      //    - whether the property being queried has an index defined
    	      //    - if chained, we handle first pass differently for initial filteredrows[] population
    	      //
    	      // For performance reasons, each case has its own if block to minimize in-loop calculations

    	      var filter, rowIdx = 0, record;

    	      // If the filteredrows[] is already initialized, use it
    	      if (this.filterInitialized) {
    	        filter = this.filteredrows;
    	        len = filter.length;

    	        // currently supporting dot notation for non-indexed conditions only
    	        if (usingDotNotation) {
    	          property = property.split('.');
    	          for (i = 0; i < len; i++) {
    	            rowIdx = filter[i];
    	            record = t[rowIdx];
    	            if (dotSubScan(record, property, fun, value, record)) {
    	              result.push(rowIdx);
    	              if (firstOnly) {
    	                this.filteredrows = result;
    	                return this;
    	              }
    	            }
    	          }
    	        } else {
    	          for (i = 0; i < len; i++) {
    	            rowIdx = filter[i];
    	            record = t[rowIdx];
    	            if (fun(record[property], value, record)) {
    	              result.push(rowIdx);
    	              if (firstOnly) {
    	                this.filteredrows = result;
    	                return this;
    	              }
    	            }
    	          }
    	        }
    	      }
    	      // first chained query so work against data[] but put results in filteredrows
    	      else {
    	        // if not searching by index
    	        if (!searchByIndex) {
    	          len = t.length;

    	          if (usingDotNotation) {
    	            property = property.split('.');
    	            for (i = 0; i < len; i++) {
    	              record = t[i];
    	              if (dotSubScan(record, property, fun, value, record)) {
    	                result.push(i);
    	                if (firstOnly) {
    	                  this.filteredrows = result;
    	                  this.filterInitialized = true;
    	                  return this;
    	                }
    	              }
    	            }
    	          } else {
    	            for (i = 0; i < len; i++) {
    	              record = t[i];
    	              if (fun(record[property], value, record)) {
    	                result.push(i);
    	                if (firstOnly) {
    	                  this.filteredrows = result;
    	                  this.filterInitialized = true;
    	                  return this;
    	                }
    	              }
    	            }
    	          }
    	        } else {
    	          // search by index
    	          var segm = this.collection.calculateRange(operator, property, value);

    	          if (operator !== '$in') {
    	            for (i = segm[0]; i <= segm[1]; i++) {
    	              if (indexedOps[operator] !== true) {
    	                // must be a function, implying 2nd phase filtering of results from calculateRange
    	                if (indexedOps[operator](Utils.getIn(t[index.values[i]], property, usingDotNotation), value)) {
    	                  result.push(index.values[i]);
    	                  if (firstOnly) {
    	                    this.filteredrows = result;
    	                    this.filterInitialized = true;
    	                    return this;
    	                  }
    	                }
    	              }
    	              else {
    	                result.push(index.values[i]);
    	                if (firstOnly) {
    	                  this.filteredrows = result;
    	                  this.filterInitialized = true;
    	                  return this;
    	                }
    	              }
    	            }
    	          } else {
    	            for (i = 0, len = segm.length; i < len; i++) {
    	              result.push(index.values[segm[i]]);
    	              if (firstOnly) {
    	                this.filteredrows = result;
    	                this.filterInitialized = true;
    	                return this;
    	              }
    	            }
    	          }
    	        }

    	      }

    	      this.filteredrows = result;
    	      this.filterInitialized = true; // next time work against filteredrows[]
    	      return this;
    	    };


    	    /**
    	     * where() - Used for filtering via a javascript filter function.
    	     *
    	     * @param {function} fun - A javascript function used for filtering current results by.
    	     * @returns {Resultset} this resultset for further chain ops.
    	     * @memberof Resultset
    	     * @example
    	     * var over30 = users.chain().where(function(obj) { return obj.age >= 30; }.data();
    	     */
    	    Resultset.prototype.where = function (fun) {
    	      var viewFunction,
    	        result = [];

    	      if ('function' === typeof fun) {
    	        viewFunction = fun;
    	      } else {
    	        throw new TypeError('Argument is not a stored view or a function');
    	      }
    	      try {
    	        // If the filteredrows[] is already initialized, use it
    	        if (this.filterInitialized) {
    	          var j = this.filteredrows.length;

    	          while (j--) {
    	            if (viewFunction(this.collection.data[this.filteredrows[j]]) === true) {
    	              result.push(this.filteredrows[j]);
    	            }
    	          }

    	          this.filteredrows = result;

    	          return this;
    	        }
    	        // otherwise this is initial chained op, work against data, push into filteredrows[]
    	        else {
    	          var k = this.collection.data.length;

    	          while (k--) {
    	            if (viewFunction(this.collection.data[k]) === true) {
    	              result.push(k);
    	            }
    	          }

    	          this.filteredrows = result;
    	          this.filterInitialized = true;

    	          return this;
    	        }
    	      } catch (err) {
    	        throw err;
    	      }
    	    };

    	    /**
    	     * count() - returns the number of documents in the resultset.
    	     *
    	     * @returns {number} The number of documents in the resultset.
    	     * @memberof Resultset
    	     * @example
    	     * var over30Count = users.chain().find({ age: { $gte: 30 } }).count();
    	     */
    	    Resultset.prototype.count = function () {
    	      if (this.filterInitialized) {
    	        return this.filteredrows.length;
    	      }
    	      return this.collection.count();
    	    };

    	    /**
    	     * Terminates the chain and returns array of filtered documents
    	     *
    	     * @param {object=} options - allows specifying 'forceClones' and 'forceCloneMethod' options.
    	     * @param {boolean} options.forceClones - Allows forcing the return of cloned objects even when
    	     *        the collection is not configured for clone object.
    	     * @param {string} options.forceCloneMethod - Allows overriding the default or collection specified cloning method.
    	     *        Possible values include 'parse-stringify', 'jquery-extend-deep', 'shallow', 'shallow-assign'
    	     * @param {bool} options.removeMeta - Will force clones and strip $loki and meta properties from documents
    	     *
    	     * @returns {array} Array of documents in the resultset
    	     * @memberof Resultset
    	     * @example
    	     * var resutls = users.chain().find({ age: 34 }).data();
    	     */
    	    Resultset.prototype.data = function (options) {
    	      var result = [],
    	        data = this.collection.data,
    	        obj,
    	        len,
    	        i,
    	        method;

    	      options = options || {};

    	      // if user opts to strip meta, then force clones and use 'shallow' if 'force' options are not present
    	      if (options.removeMeta && !options.forceClones) {
    	        options.forceClones = true;
    	        options.forceCloneMethod = options.forceCloneMethod || 'shallow';
    	      }

    	      // if collection has delta changes active, then force clones and use 'parse-stringify' for effective change tracking of nested objects
    	      // if collection is immutable freeze and unFreeze takes care of cloning
    	      if (!this.collection.disableDeltaChangesApi && this.collection.disableFreeze) {
    	        options.forceClones = true;
    	        options.forceCloneMethod = 'parse-stringify';
    	      }

    	      // if this has no filters applied, just return collection.data
    	      if (!this.filterInitialized) {
    	        if (this.filteredrows.length === 0) {
    	          // determine whether we need to clone objects or not
    	          if (this.collection.cloneObjects || options.forceClones) {
    	            len = data.length;
    	            method = options.forceCloneMethod || this.collection.cloneMethod;
    	            for (i = 0; i < len; i++) {
    	              obj = clone(data[i], method);
    	              if (options.removeMeta) {
    	                delete obj.$loki;
    	                delete obj.meta;
    	              }
    	              result.push(obj);
    	            }
    	            return result;
    	          }
    	          // otherwise we are not cloning so return sliced array with same object references
    	          else {
    	            return data.slice();
    	          }
    	        } else {
    	          // filteredrows must have been set manually, so use it
    	          this.filterInitialized = true;
    	        }
    	      }

    	      var fr = this.filteredrows;
    	      len = fr.length;

    	      if (this.collection.cloneObjects || options.forceClones) {
    	        method = options.forceCloneMethod || this.collection.cloneMethod;
    	        for (i = 0; i < len; i++) {
    	          obj = clone(data[fr[i]], method);
    	          if (options.removeMeta) {
    	            delete obj.$loki;
    	            delete obj.meta;
    	          }
    	          result.push(obj);
    	        }
    	      } else {
    	        for (i = 0; i < len; i++) {
    	          result.push(data[fr[i]]);
    	        }
    	      }
    	      return result;
    	    };

    	    /**
    	     * Used to run an update operation on all documents currently in the resultset.
    	     *
    	     * @param {function} updateFunction - User supplied updateFunction(obj) will be executed for each document object.
    	     * @returns {Resultset} this resultset for further chain ops.
    	     * @memberof Resultset
    	     * @example
    	     * users.chain().find({ country: 'de' }).update(function(user) {
    	     *   user.phoneFormat = "+49 AAAA BBBBBB";
    	     * });
    	     */
    	    Resultset.prototype.update = function (updateFunction) {

    	      if (typeof (updateFunction) !== "function") {
    	        throw new TypeError('Argument is not a function');
    	      }

    	      // if this has no filters applied, we need to populate filteredrows first
    	      if (!this.filterInitialized && this.filteredrows.length === 0) {
    	        this.filteredrows = this.collection.prepareFullDocIndex();
    	      }

    	      var obj, len = this.filteredrows.length,
    	        rcd = this.collection.data;

    	      // pass in each document object currently in resultset to user supplied updateFunction
    	      for (var idx = 0; idx < len; idx++) {
    	        // if we have cloning option specified or are doing differential delta changes, clone object first
    	        if (!this.disableFreeze || this.collection.cloneObjects || !this.collection.disableDeltaChangesApi) {
    	          obj = clone(rcd[this.filteredrows[idx]], this.collection.cloneMethod);
    	          updateFunction(obj);
    	          this.collection.update(obj);
    	        }
    	        else {
    	          // no need to clone, so just perform update on collection data object instance
    	          updateFunction(rcd[this.filteredrows[idx]]);
    	          this.collection.update(rcd[this.filteredrows[idx]]);
    	        }
    	      }

    	      return this;
    	    };

    	    /**
    	     * Removes all document objects which are currently in resultset from collection (as well as resultset)
    	     *
    	     * @returns {Resultset} this (empty) resultset for further chain ops.
    	     * @memberof Resultset
    	     * @example
    	     * // remove users inactive since 1/1/2001
    	     * users.chain().find({ lastActive: { $lte: new Date("1/1/2001").getTime() } }).remove();
    	     */
    	    Resultset.prototype.remove = function () {

    	      // if this has no filters applied, we need to populate filteredrows first
    	      if (!this.filterInitialized && this.filteredrows.length === 0) {
    	        this.filteredrows = this.collection.prepareFullDocIndex();
    	      }

    	      this.collection.removeBatchByPositions(this.filteredrows);

    	      this.filteredrows = [];

    	      return this;
    	    };

    	    /**
    	     * data transformation via user supplied functions
    	     *
    	     * @param {function} mapFunction - this function accepts a single document for you to transform and return
    	     * @param {function} reduceFunction - this function accepts many (array of map outputs) and returns single value
    	     * @returns {value} The output of your reduceFunction
    	     * @memberof Resultset
    	     * @example
    	     * var db = new loki("order.db");
    	     * var orders = db.addCollection("orders");
    	     * orders.insert([{ qty: 4, unitCost: 100.00 }, { qty: 10, unitCost: 999.99 }, { qty: 2, unitCost: 49.99 }]);
    	     *
    	     * function mapfun (obj) { return obj.qty*obj.unitCost };
    	     * function reducefun(array) {
    	     *   var grandTotal=0;
    	     *   array.forEach(function(orderTotal) { grandTotal += orderTotal; });
    	     *   return grandTotal;
    	     * }
    	     * var grandOrderTotal = orders.chain().mapReduce(mapfun, reducefun);
    	     * console.log(grandOrderTotal);
    	     */
    	    Resultset.prototype.mapReduce = function (mapFunction, reduceFunction) {
    	      try {
    	        return reduceFunction(this.data().map(mapFunction));
    	      } catch (err) {
    	        throw err;
    	      }
    	    };

    	    /**
    	     * eqJoin() - Left joining two sets of data. Join keys can be defined or calculated properties
    	     * eqJoin expects the right join key values to be unique.  Otherwise left data will be joined on the last joinData object with that key
    	     * @param {Array|Resultset|Collection} joinData - Data array to join to.
    	     * @param {(string|function)} leftJoinKey - Property name in this result set to join on or a function to produce a value to join on
    	     * @param {(string|function)} rightJoinKey - Property name in the joinData to join on or a function to produce a value to join on
    	     * @param {function=} mapFun - (Optional) A function that receives each matching pair and maps them into output objects - function(left,right){return joinedObject}
    	     * @param {object=} dataOptions - options to data() before input to your map function
    	     * @param {bool} dataOptions.removeMeta - allows removing meta before calling mapFun
    	     * @param {boolean} dataOptions.forceClones - forcing the return of cloned objects to your map object
    	     * @param {string} dataOptions.forceCloneMethod - Allows overriding the default or collection specified cloning method.
    	     * @returns {Resultset} A resultset with data in the format [{left: leftObj, right: rightObj}]
    	     * @memberof Resultset
    	     * @example
    	     * var db = new loki('sandbox.db');
    	     *
    	     * var products = db.addCollection('products');
    	     * var orders = db.addCollection('orders');
    	     *
    	     * products.insert({ productId: "100234", name: "flywheel energy storage", unitCost: 19999.99 });
    	     * products.insert({ productId: "140491", name: "300F super capacitor", unitCost: 129.99 });
    	     * products.insert({ productId: "271941", name: "fuel cell", unitCost: 3999.99 });
    	     * products.insert({ productId: "174592", name: "390V 3AH lithium bank", unitCost: 4999.99 });
    	     *
    	     * orders.insert({ orderDate : new Date("12/1/2017").getTime(), prodId: "174592", qty: 2, customerId: 2 });
    	     * orders.insert({ orderDate : new Date("4/15/2016").getTime(), prodId: "271941", qty: 1, customerId: 1 });
    	     * orders.insert({ orderDate : new Date("3/12/2017").getTime(), prodId: "140491", qty: 4, customerId: 4 });
    	     * orders.insert({ orderDate : new Date("7/31/2017").getTime(), prodId: "100234", qty: 7, customerId: 3 });
    	     * orders.insert({ orderDate : new Date("8/3/2016").getTime(), prodId: "174592", qty: 3, customerId: 5 });
    	     *
    	     * var mapfun = function(left, right) {
    	     *   return {
    	     *     orderId: left.$loki,
    	     *     orderDate: new Date(left.orderDate) + '',
    	     *     customerId: left.customerId,
    	     *     qty: left.qty,
    	     *     productId: left.prodId,
    	     *     prodName: right.name,
    	     *     prodCost: right.unitCost,
    	     *     orderTotal: +((right.unitCost * left.qty).toFixed(2))
    	     *   };
    	     * };
    	     *
    	     * // join orders with relevant product info via eqJoin
    	     * var orderSummary = orders.chain().eqJoin(products, "prodId", "productId", mapfun).data();
    	     *
    	     * console.log(orderSummary);
    	     */
    	    Resultset.prototype.eqJoin = function (joinData, leftJoinKey, rightJoinKey, mapFun, dataOptions) {

    	      var leftData = [],
    	        leftDataLength,
    	        rightData = [],
    	        rightDataLength,
    	        key,
    	        result = [],
    	        leftKeyisFunction = typeof leftJoinKey === 'function',
    	        rightKeyisFunction = typeof rightJoinKey === 'function',
    	        joinMap = {};

    	      //get the left data
    	      leftData = this.data(dataOptions);
    	      leftDataLength = leftData.length;

    	      //get the right data
    	      if (joinData instanceof Collection) {
    	        rightData = joinData.chain().data(dataOptions);
    	      } else if (joinData instanceof Resultset) {
    	        rightData = joinData.data(dataOptions);
    	      } else if (Array.isArray(joinData)) {
    	        rightData = joinData;
    	      } else {
    	        throw new TypeError('joinData needs to be an array or result set');
    	      }
    	      rightDataLength = rightData.length;

    	      //construct a lookup table

    	      for (var i = 0; i < rightDataLength; i++) {
    	        key = rightKeyisFunction ? rightJoinKey(rightData[i]) : rightData[i][rightJoinKey];
    	        joinMap[key] = rightData[i];
    	      }

    	      if (!mapFun) {
    	        mapFun = function (left, right) {
    	          return {
    	            left: left,
    	            right: right
    	          };
    	        };
    	      }

    	      //Run map function over each object in the resultset
    	      for (var j = 0; j < leftDataLength; j++) {
    	        key = leftKeyisFunction ? leftJoinKey(leftData[j]) : leftData[j][leftJoinKey];
    	        result.push(mapFun(leftData[j], joinMap[key] || {}));
    	      }

    	      //return return a new resultset with no filters
    	      this.collection = new Collection('joinData');
    	      this.collection.insert(result);
    	      this.filteredrows = [];
    	      this.filterInitialized = false;

    	      return this;
    	    };

    	    /**
    	     * Applies a map function into a new collection for further chaining.
    	     * @param {function} mapFun - javascript map function
    	     * @param {object=} dataOptions - options to data() before input to your map function
    	     * @param {bool} dataOptions.removeMeta - allows removing meta before calling mapFun
    	     * @param {boolean} dataOptions.forceClones - forcing the return of cloned objects to your map object
    	     * @param {string} dataOptions.forceCloneMethod - Allows overriding the default or collection specified cloning method.
    	     * @memberof Resultset
    	     * @example
    	     * var orders.chain().find({ productId: 32 }).map(function(obj) {
    	     *   return {
    	     *     orderId: $loki,
    	     *     productId: productId,
    	     *     quantity: qty
    	     *   };
    	     * });
    	     */
    	    Resultset.prototype.map = function (mapFun, dataOptions) {
    	      var data = this.data(dataOptions).map(mapFun);
    	      //return return a new resultset with no filters
    	      this.collection = new Collection('mappedData');
    	      this.collection.insert(data);
    	      this.filteredrows = [];
    	      this.filterInitialized = false;

    	      return this;
    	    };

    	    /**
    	     * DynamicView class is a versatile 'live' view class which can have filters and sorts applied.
    	     *    Collection.addDynamicView(name) instantiates this DynamicView object and notifies it
    	     *    whenever documents are add/updated/removed so it can remain up-to-date. (chainable)
    	     *
    	     * @example
    	     * var mydv = mycollection.addDynamicView('test');  // default is non-persistent
    	     * mydv.applyFind({ 'doors' : 4 });
    	     * mydv.applyWhere(function(obj) { return obj.name === 'Toyota'; });
    	     * var results = mydv.data();
    	     *
    	     * @constructor DynamicView
    	     * @implements LokiEventEmitter
    	     * @param {Collection} collection - A reference to the collection to work against
    	     * @param {string} name - The name of this dynamic view
    	     * @param {object=} options - (Optional) Pass in object with 'persistent' and/or 'sortPriority' options.
    	     * @param {boolean} [options.persistent=false] - indicates if view is to main internal results array in 'resultdata'
    	     * @param {string} [options.sortPriority='passive'] - 'passive' (sorts performed on call to data) or 'active' (after updates)
    	     * @param {number} options.minRebuildInterval - minimum rebuild interval (need clarification to docs here)
    	     * @see {@link Collection#addDynamicView} to construct instances of DynamicView
    	     */
    	    function DynamicView(collection, name, options) {
    	      this.collection = collection;
    	      this.name = name;
    	      this.rebuildPending = false;
    	      this.options = options || {};

    	      if (!this.options.hasOwnProperty('persistent')) {
    	        this.options.persistent = false;
    	      }

    	      // 'persistentSortPriority':
    	      // 'passive' will defer the sort phase until they call data(). (most efficient overall)
    	      // 'active' will sort async whenever next idle. (prioritizes read speeds)
    	      if (!this.options.hasOwnProperty('sortPriority')) {
    	        this.options.sortPriority = 'passive';
    	      }

    	      if (!this.options.hasOwnProperty('minRebuildInterval')) {
    	        this.options.minRebuildInterval = 1;
    	      }

    	      this.resultset = new Resultset(collection);
    	      this.resultdata = [];
    	      this.resultsdirty = false;

    	      this.cachedresultset = null;

    	      // keep ordered filter pipeline
    	      this.filterPipeline = [];
    	      if (!this.collection.disableFreeze) {
    	        Object.freeze(this.filterPipeline);
    	      }

    	      // sorting member variables
    	      // we only support one active search, applied using applySort() or applySimpleSort()
    	      this.sortFunction = null;
    	      this.sortCriteria = null;
    	      this.sortCriteriaSimple = null;
    	      this.sortDirty = false;

    	      // for now just have 1 event for when we finally rebuilt lazy view
    	      // once we refactor transactions, i will tie in certain transactional events

    	      this.events = {
    	        'rebuild': [],
    	        'filter': [],
    	        'sort': []
    	      };
    	    }

    	    DynamicView.prototype = new LokiEventEmitter();
    	    DynamicView.prototype.constructor = DynamicView;

    	    /**
    	     * getSort() - used to get the current sort
    	     *
    	     * @returns function (sortFunction) or array (sortCriteria) or object (sortCriteriaSimple)
    	     */
    	    DynamicView.prototype.getSort = function () {
    	      return this.sortFunction || this.sortCriteria || this.sortCriteriaSimple;
    	    };

    	    /**
    	     * rematerialize() - internally used immediately after deserialization (loading)
    	     *    This will clear out and reapply filterPipeline ops, recreating the view.
    	     *    Since where filters do not persist correctly, this method allows
    	     *    restoring the view to state where user can re-apply those where filters.
    	     *
    	     * @param {Object=} options - (Optional) allows specification of 'removeWhereFilters' option
    	     * @returns {DynamicView} This dynamic view for further chained ops.
    	     * @memberof DynamicView
    	     * @fires DynamicView.rebuild
    	     */
    	    DynamicView.prototype.rematerialize = function (options) {
    	      var fpl,
    	        fpi,
    	        idx;

    	      options = options || {};

    	      this.resultdata = [];
    	      this.resultsdirty = true;
    	      this.resultset = new Resultset(this.collection);

    	      if (this.sortFunction || this.sortCriteria || this.sortCriteriaSimple) {
    	        this.sortDirty = true;
    	      }

    	      var wasFrozen = Object.isFrozen(this.filterPipeline);
    	      if (options.hasOwnProperty('removeWhereFilters')) {
    	        // for each view see if it had any where filters applied... since they don't
    	        // serialize those functions lets remove those invalid filters
    	        if (wasFrozen) {
    	          this.filterPipeline = this.filterPipeline.slice();
    	        }
    	        fpl = this.filterPipeline.length;
    	        fpi = fpl;
    	        while (fpi--) {
    	          if (this.filterPipeline[fpi].type === 'where') {
    	            if (fpi !== this.filterPipeline.length - 1) {
    	              this.filterPipeline[fpi] = this.filterPipeline[this.filterPipeline.length - 1];
    	            }
    	            this.filterPipeline.length--;
    	          }
    	        }
    	      }

    	      // back up old filter pipeline, clear filter pipeline, and reapply pipeline ops
    	      var ofp = this.filterPipeline;
    	      this.filterPipeline = [];

    	      // now re-apply 'find' filterPipeline ops
    	      fpl = ofp.length;
    	      for (idx = 0; idx < fpl; idx++) {
    	        this.applyFind(ofp[idx].val, ofp[idx].uid);
    	      }
    	      if (wasFrozen) {
    	        Object.freeze(this.filterPipeline);
    	      }

    	      // during creation of unit tests, i will remove this forced refresh and leave lazy
    	      this.data();

    	      // emit rebuild event in case user wants to be notified
    	      this.emit('rebuild', this);

    	      return this;
    	    };

    	    /**
    	     * branchResultset() - Makes a copy of the internal resultset for branched queries.
    	     *    Unlike this dynamic view, the branched resultset will not be 'live' updated,
    	     *    so your branched query should be immediately resolved and not held for future evaluation.
    	     *
    	     * @param {(string|array=)} transform - Optional name of collection transform, or an array of transform steps
    	     * @param {object=} parameters - optional parameters (if optional transform requires them)
    	     * @returns {Resultset} A copy of the internal resultset for branched queries.
    	     * @memberof DynamicView
    	     * @example
    	     * var db = new loki('test');
    	     * var coll = db.addCollection('mydocs');
    	     * var dv = coll.addDynamicView('myview');
    	     * var tx = [
    	     *   {
    	     *     type: 'offset',
    	     *     value: '[%lktxp]pageStart'
    	     *   },
    	     *   {
    	     *     type: 'limit',
    	     *     value: '[%lktxp]pageSize'
    	     *   }
    	     * ];
    	     * coll.addTransform('viewPaging', tx);
    	     *
    	     * // add some records
    	     *
    	     * var results = dv.branchResultset('viewPaging', { pageStart: 10, pageSize: 10 }).data();
    	     */
    	    DynamicView.prototype.branchResultset = function (transform, parameters) {
    	      var rs = this.resultset.branch();

    	      if (typeof transform === 'undefined') {
    	        return rs;
    	      }

    	      return rs.transform(transform, parameters);
    	    };

    	    /**
    	     * toJSON() - Override of toJSON to avoid circular references
    	     *
    	     */
    	    DynamicView.prototype.toJSON = function () {
    	      var copy = new DynamicView(this.collection, this.name, this.options);
    	      copy.resultset = this.resultset;
    	      copy.resultdata = []; // let's not save data (copy) to minimize size
    	      copy.resultsdirty = true;
    	      copy.filterPipeline = this.filterPipeline;
    	      copy.sortFunction = this.sortFunction;
    	      copy.sortCriteria = this.sortCriteria;
    	      copy.sortCriteriaSimple = this.sortCriteriaSimple || null;
    	      copy.sortDirty = this.sortDirty;

    	      // avoid circular reference, reapply in db.loadJSON()
    	      copy.collection = null;

    	      return copy;
    	    };

    	    /**
    	     * removeFilters() - Used to clear pipeline and reset dynamic view to initial state.
    	     *     Existing options should be retained.
    	     * @param {object=} options - configure removeFilter behavior
    	     * @param {boolean=} options.queueSortPhase - (default: false) if true we will async rebuild view (maybe set default to true in future?)
    	     * @memberof DynamicView
    	     */
    	    DynamicView.prototype.removeFilters = function (options) {
    	      options = options || {};

    	      this.rebuildPending = false;
    	      this.resultset.reset();
    	      this.resultdata = [];
    	      this.resultsdirty = true;

    	      this.cachedresultset = null;

    	      var wasFrozen = Object.isFrozen(this.filterPipeline);
    	      var filterChanged = this.filterPipeline.length > 0;
    	      // keep ordered filter pipeline
    	      this.filterPipeline = [];
    	      if (wasFrozen) {
    	        Object.freeze(this.filterPipeline);
    	      }

    	      // sorting member variables
    	      // we only support one active search, applied using applySort() or applySimpleSort()
    	      this.sortFunction = null;
    	      this.sortCriteria = null;
    	      this.sortCriteriaSimple = null;
    	      this.sortDirty = false;

    	      if (options.queueSortPhase === true) {
    	        this.queueSortPhase();
    	      }

    	      if (filterChanged) {
    	        this.emit('filter');
    	      }
    	    };

    	    /**
    	     * applySort() - Used to apply a sort to the dynamic view
    	     * @example
    	     * dv.applySort(function(obj1, obj2) {
    	     *   if (obj1.name === obj2.name) return 0;
    	     *   if (obj1.name > obj2.name) return 1;
    	     *   if (obj1.name < obj2.name) return -1;
    	     * });
    	     *
    	     * @param {function} comparefun - a javascript compare function used for sorting
    	     * @returns {DynamicView} this DynamicView object, for further chain ops.
    	     * @memberof DynamicView
    	     */
    	    DynamicView.prototype.applySort = function (comparefun) {
    	      this.sortFunction = comparefun;
    	      this.sortCriteria = null;
    	      this.sortCriteriaSimple = null;

    	      this.queueSortPhase();
    	      this.emit('sort');

    	      return this;
    	    };

    	    /**
    	     * applySimpleSort() - Used to specify a property used for view translation.
    	     * @example
    	     * dv.applySimpleSort("name");
    	     *
    	     * @param {string} propname - Name of property by which to sort.
    	     * @param {object|boolean=} options - boolean for sort descending or options object
    	     * @param {boolean} [options.desc=false] - whether we should sort descending.
    	     * @param {boolean} [options.disableIndexIntersect=false] - whether we should explicity not use array intersection.
    	     * @param {boolean} [options.forceIndexIntersect=false] - force array intersection (if binary index exists).
    	     * @param {boolean} [options.useJavascriptSorting=false] - whether results are sorted via basic javascript sort.
    	     * @returns {DynamicView} this DynamicView object, for further chain ops.
    	     * @memberof DynamicView
    	     */
    	    DynamicView.prototype.applySimpleSort = function (propname, options) {
    	      this.sortCriteriaSimple = { propname: propname, options: options || false };
    	      if (!this.collection.disableFreeze) {
    	        deepFreeze(this.sortCriteriaSimple);
    	      }
    	      this.sortCriteria = null;
    	      this.sortFunction = null;

    	      this.queueSortPhase();
    	      this.emit('sort');

    	      return this;
    	    };

    	    /**
    	     * applySortCriteria() - Allows sorting a resultset based on multiple columns.
    	     * @example
    	     * // to sort by age and then name (both ascending)
    	     * dv.applySortCriteria(['age', 'name']);
    	     * // to sort by age (ascending) and then by name (descending)
    	     * dv.applySortCriteria(['age', ['name', true]);
    	     * // to sort by age (descending) and then by name (descending)
    	     * dv.applySortCriteria(['age', true], ['name', true]);
    	     *
    	     * @param {array} properties - array of property names or subarray of [propertyname, isdesc] used evaluate sort order
    	     * @returns {DynamicView} Reference to this DynamicView, sorted, for future chain operations.
    	     * @memberof DynamicView
    	     */
    	    DynamicView.prototype.applySortCriteria = function (criteria) {
    	      this.sortCriteria = criteria;
    	      if (!this.collection.disableFreeze) {
    	        deepFreeze(this.sortCriteria);
    	      }
    	      this.sortCriteriaSimple = null;
    	      this.sortFunction = null;

    	      this.queueSortPhase();
    	      this.emit('sort');
    	      return this;
    	    };

    	    /**
    	     * startTransaction() - marks the beginning of a transaction.
    	     *
    	     * @returns {DynamicView} this DynamicView object, for further chain ops.
    	     */
    	    DynamicView.prototype.startTransaction = function () {
    	      this.cachedresultset = this.resultset.copy();

    	      return this;
    	    };

    	    /**
    	     * commit() - commits a transaction.
    	     *
    	     * @returns {DynamicView} this DynamicView object, for further chain ops.
    	     */
    	    DynamicView.prototype.commit = function () {
    	      this.cachedresultset = null;

    	      return this;
    	    };

    	    /**
    	     * rollback() - rolls back a transaction.
    	     *
    	     * @returns {DynamicView} this DynamicView object, for further chain ops.
    	     */
    	    DynamicView.prototype.rollback = function () {
    	      this.resultset = this.cachedresultset;

    	      if (this.options.persistent) {
    	        // for now just rebuild the persistent dynamic view data in this worst case scenario
    	        // (a persistent view utilizing transactions which get rolled back), we already know the filter so not too bad.
    	        this.resultdata = this.resultset.data();

    	        this.emit('rebuild', this);
    	      }

    	      return this;
    	    };


    	    /**
    	     * Implementation detail.
    	     * _indexOfFilterWithId() - Find the index of a filter in the pipeline, by that filter's ID.
    	     *
    	     * @param {(string|number)} uid - The unique ID of the filter.
    	     * @returns {number}: index of the referenced filter in the pipeline; -1 if not found.
    	     */
    	    DynamicView.prototype._indexOfFilterWithId = function (uid) {
    	      if (typeof uid === 'string' || typeof uid === 'number') {
    	        for (var idx = 0, len = this.filterPipeline.length; idx < len; idx += 1) {
    	          if (uid === this.filterPipeline[idx].uid) {
    	            return idx;
    	          }
    	        }
    	      }
    	      return -1;
    	    };

    	    /**
    	     * Implementation detail.
    	     * _addFilter() - Add the filter object to the end of view's filter pipeline and apply the filter to the resultset.
    	     *
    	     * @param {object} filter - The filter object. Refer to applyFilter() for extra details.
    	     */
    	    DynamicView.prototype._addFilter = function (filter) {
    	      var wasFrozen = Object.isFrozen(this.filterPipeline);
    	      if (wasFrozen) {
    	        this.filterPipeline = this.filterPipeline.slice();
    	      }
    	      if (!this.collection.disableFreeze) {
    	        deepFreeze(filter);
    	      }
    	      this.filterPipeline.push(filter);
    	      if (wasFrozen) {
    	        Object.freeze(this.filterPipeline);
    	      }
    	      this.resultset[filter.type](filter.val);
    	    };

    	    /**
    	     * reapplyFilters() - Reapply all the filters in the current pipeline.
    	     *
    	     * @returns {DynamicView} this DynamicView object, for further chain ops.
    	     */
    	    DynamicView.prototype.reapplyFilters = function () {
    	      this.resultset.reset();

    	      this.cachedresultset = null;
    	      if (this.options.persistent) {
    	        this.resultdata = [];
    	        this.resultsdirty = true;
    	      }

    	      var filters = this.filterPipeline;
    	      var wasFrozen = Object.isFrozen(filters);
    	      this.filterPipeline = [];

    	      for (var idx = 0, len = filters.length; idx < len; idx += 1) {
    	        this._addFilter(filters[idx]);
    	      }
    	      if (wasFrozen) {
    	        Object.freeze(this.filterPipeline);
    	      }

    	      if (this.sortFunction || this.sortCriteria || this.sortCriteriaSimple) {
    	        this.queueSortPhase();
    	      } else {
    	        this.queueRebuildEvent();
    	      }
    	      this.emit('filter');
    	      return this;
    	    };

    	    /**
    	     * applyFilter() - Adds or updates a filter in the DynamicView filter pipeline
    	     *
    	     * @param {object} filter - A filter object to add to the pipeline.
    	     *    The object is in the format { 'type': filter_type, 'val', filter_param, 'uid', optional_filter_id }
    	     * @returns {DynamicView} this DynamicView object, for further chain ops.
    	     * @memberof DynamicView
    	     */
    	    DynamicView.prototype.applyFilter = function (filter) {
    	      var idx = this._indexOfFilterWithId(filter.uid);
    	      if (idx >= 0) {
    	        var wasFrozen = Object.isFrozen(this.filterPipeline);
    	        if (wasFrozen) {
    	          this.filterPipeline = this.filterPipeline.slice();
    	        }
    	        this.filterPipeline[idx] = filter;
    	        if (wasFrozen) {
    	          freeze(filter);
    	          Object.freeze(this.filterPipeline);
    	        }
    	        return this.reapplyFilters();
    	      }

    	      this.cachedresultset = null;
    	      if (this.options.persistent) {
    	        this.resultdata = [];
    	        this.resultsdirty = true;
    	      }

    	      this._addFilter(filter);

    	      if (this.sortFunction || this.sortCriteria || this.sortCriteriaSimple) {
    	        this.queueSortPhase();
    	      } else {
    	        this.queueRebuildEvent();
    	      }

    	      this.emit('filter');
    	      return this;
    	    };

    	    /**
    	     * applyFind() - Adds or updates a mongo-style query option in the DynamicView filter pipeline
    	     *
    	     * @param {object} query - A mongo-style query object to apply to pipeline
    	     * @param {(string|number)=} uid - Optional: The unique ID of this filter, to reference it in the future.
    	     * @returns {DynamicView} this DynamicView object, for further chain ops.
    	     * @memberof DynamicView
    	     */
    	    DynamicView.prototype.applyFind = function (query, uid) {
    	      this.applyFilter({
    	        type: 'find',
    	        val: query,
    	        uid: uid
    	      });
    	      return this;
    	    };

    	    /**
    	     * applyWhere() - Adds or updates a javascript filter function in the DynamicView filter pipeline
    	     *
    	     * @param {function} fun - A javascript filter function to apply to pipeline
    	     * @param {(string|number)=} uid - Optional: The unique ID of this filter, to reference it in the future.
    	     * @returns {DynamicView} this DynamicView object, for further chain ops.
    	     * @memberof DynamicView
    	     */
    	    DynamicView.prototype.applyWhere = function (fun, uid) {
    	      this.applyFilter({
    	        type: 'where',
    	        val: fun,
    	        uid: uid
    	      });
    	      return this;
    	    };

    	    /**
    	     * removeFilter() - Remove the specified filter from the DynamicView filter pipeline
    	     *
    	     * @param {(string|number)} uid - The unique ID of the filter to be removed.
    	     * @returns {DynamicView} this DynamicView object, for further chain ops.
    	     * @memberof DynamicView
    	     */
    	    DynamicView.prototype.removeFilter = function (uid) {
    	      var idx = this._indexOfFilterWithId(uid);
    	      if (idx < 0) {
    	        throw new Error("Dynamic view does not contain a filter with ID: " + uid);
    	      }
    	      var wasFrozen = Object.isFrozen(this.filterPipeline);
    	      if (wasFrozen) {
    	        this.filterPipeline = this.filterPipeline.slice();
    	      }
    	      this.filterPipeline.splice(idx, 1);
    	      if (wasFrozen) {
    	        Object.freeze(this.filterPipeline);
    	      }
    	      this.reapplyFilters();
    	      return this;
    	    };

    	    /**
    	     * count() - returns the number of documents representing the current DynamicView contents.
    	     *
    	     * @returns {number} The number of documents representing the current DynamicView contents.
    	     * @memberof DynamicView
    	     */
    	    DynamicView.prototype.count = function () {
    	      // in order to be accurate we will pay the minimum cost (and not alter dv state management)
    	      // recurring resultset data resolutions should know internally its already up to date.
    	      // for persistent data this will not update resultdata nor fire rebuild event.
    	      if (this.resultsdirty) {
    	        this.resultdata = this.resultset.data();
    	      }

    	      return this.resultset.count();
    	    };

    	    /**
    	     * data() - resolves and pending filtering and sorting, then returns document array as result.
    	     *
    	     * @param {object=} options - optional parameters to pass to resultset.data() if non-persistent
    	     * @param {boolean} options.forceClones - Allows forcing the return of cloned objects even when
    	     *        the collection is not configured for clone object.
    	     * @param {string} options.forceCloneMethod - Allows overriding the default or collection specified cloning method.
    	     *        Possible values include 'parse-stringify', 'jquery-extend-deep', 'shallow', 'shallow-assign'
    	     * @param {bool} options.removeMeta - Will force clones and strip $loki and meta properties from documents
    	     * @returns {array} An array of documents representing the current DynamicView contents.
    	     * @memberof DynamicView
    	     */
    	    DynamicView.prototype.data = function (options) {
    	      // using final sort phase as 'catch all' for a few use cases which require full rebuild
    	      if (this.sortDirty || this.resultsdirty) {
    	        this.performSortPhase({
    	          suppressRebuildEvent: true
    	        });
    	      }
    	      return (this.options.persistent) ? (this.resultdata) : (this.resultset.data(options));
    	    };

    	    /**
    	     * queueRebuildEvent() - When the view is not sorted we may still wish to be notified of rebuild events.
    	     *     This event will throttle and queue a single rebuild event when batches of updates affect the view.
    	     */
    	    DynamicView.prototype.queueRebuildEvent = function () {
    	      if (this.rebuildPending) {
    	        return;
    	      }
    	      this.rebuildPending = true;

    	      var self = this;
    	      setTimeout(function () {
    	        if (self.rebuildPending) {
    	          self.rebuildPending = false;
    	          self.emit('rebuild', self);
    	        }
    	      }, this.options.minRebuildInterval);
    	    };

    	    /**
    	     * queueSortPhase : If the view is sorted we will throttle sorting to either :
    	     *    (1) passive - when the user calls data(), or
    	     *    (2) active - once they stop updating and yield js thread control
    	     */
    	    DynamicView.prototype.queueSortPhase = function () {
    	      // already queued? exit without queuing again
    	      if (this.sortDirty) {
    	        return;
    	      }
    	      this.sortDirty = true;

    	      var self = this;
    	      if (this.options.sortPriority === "active") {
    	        // active sorting... once they are done and yield js thread, run async performSortPhase()
    	        setTimeout(function () {
    	          self.performSortPhase();
    	        }, this.options.minRebuildInterval);
    	      } else {
    	        // must be passive sorting... since not calling performSortPhase (until data call), lets use queueRebuildEvent to
    	        // potentially notify user that data has changed.
    	        this.queueRebuildEvent();
    	      }
    	    };

    	    /**
    	     * performSortPhase() - invoked synchronously or asynchronously to perform final sort phase (if needed)
    	     *
    	     */
    	    DynamicView.prototype.performSortPhase = function (options) {
    	      // async call to this may have been pre-empted by synchronous call to data before async could fire
    	      if (!this.sortDirty && !this.resultsdirty) {
    	        return;
    	      }

    	      options = options || {};

    	      if (this.sortDirty) {
    	        if (this.sortFunction) {
    	          this.resultset.sort(this.sortFunction);
    	        } else if (this.sortCriteria) {
    	          this.resultset.compoundsort(this.sortCriteria);
    	        } else if (this.sortCriteriaSimple) {
    	          this.resultset.simplesort(this.sortCriteriaSimple.propname, this.sortCriteriaSimple.options);
    	        }

    	        this.sortDirty = false;
    	      }

    	      if (this.options.persistent) {
    	        // persistent view, rebuild local resultdata array
    	        this.resultdata = this.resultset.data();
    	        this.resultsdirty = false;
    	      }

    	      if (!options.suppressRebuildEvent) {
    	        this.emit('rebuild', this);
    	      }
    	    };

    	    /**
    	     * evaluateDocument() - internal method for (re)evaluating document inclusion.
    	     *    Called by : collection.insert() and collection.update().
    	     *
    	     * @param {int} objIndex - index of document to (re)run through filter pipeline.
    	     * @param {bool} isNew - true if the document was just added to the collection.
    	     */
    	    DynamicView.prototype.evaluateDocument = function (objIndex, isNew) {
    	      // if no filter applied yet, the result 'set' should remain 'everything'
    	      if (!this.resultset.filterInitialized) {
    	        if (this.options.persistent) {
    	          this.resultdata = this.resultset.data();
    	        }
    	        // need to re-sort to sort new document
    	        if (this.sortFunction || this.sortCriteria || this.sortCriteriaSimple) {
    	          this.queueSortPhase();
    	        } else {
    	          this.queueRebuildEvent();
    	        }
    	        return;
    	      }

    	      var ofr = this.resultset.filteredrows;
    	      var oldPos = (isNew) ? (-1) : (ofr.indexOf(+objIndex));
    	      var oldlen = ofr.length;

    	      // creating a 1-element resultset to run filter chain ops on to see if that doc passes filters;
    	      // mostly efficient algorithm, slight stack overhead price (this function is called on inserts and updates)
    	      var evalResultset = new Resultset(this.collection);
    	      evalResultset.filteredrows = [objIndex];
    	      evalResultset.filterInitialized = true;
    	      var filter;
    	      for (var idx = 0, len = this.filterPipeline.length; idx < len; idx++) {
    	        filter = this.filterPipeline[idx];
    	        evalResultset[filter.type](filter.val);
    	      }

    	      // not a true position, but -1 if not pass our filter(s), 0 if passed filter(s)
    	      var newPos = (evalResultset.filteredrows.length === 0) ? -1 : 0;

    	      // wasn't in old, shouldn't be now... do nothing
    	      if (oldPos === -1 && newPos === -1) return;

    	      // wasn't in resultset, should be now... add
    	      if (oldPos === -1 && newPos !== -1) {
    	        ofr.push(objIndex);

    	        if (this.options.persistent) {
    	          this.resultdata.push(this.collection.data[objIndex]);
    	        }

    	        // need to re-sort to sort new document
    	        if (this.sortFunction || this.sortCriteria || this.sortCriteriaSimple) {
    	          this.queueSortPhase();
    	        } else {
    	          this.queueRebuildEvent();
    	        }

    	        return;
    	      }

    	      // was in resultset, shouldn't be now... delete
    	      if (oldPos !== -1 && newPos === -1) {
    	        if (oldPos < oldlen - 1) {
    	          ofr.splice(oldPos, 1);

    	          if (this.options.persistent) {
    	            this.resultdata.splice(oldPos, 1);
    	          }
    	        } else {
    	          ofr.length = oldlen - 1;

    	          if (this.options.persistent) {
    	            this.resultdata.length = oldlen - 1;
    	          }
    	        }

    	        // in case changes to data altered a sort column
    	        if (this.sortFunction || this.sortCriteria || this.sortCriteriaSimple) {
    	          this.queueSortPhase();
    	        } else {
    	          this.queueRebuildEvent();
    	        }

    	        return;
    	      }

    	      // was in resultset, should still be now... (update persistent only?)
    	      if (oldPos !== -1 && newPos !== -1) {
    	        if (this.options.persistent) {
    	          // in case document changed, replace persistent view data with the latest collection.data document
    	          this.resultdata[oldPos] = this.collection.data[objIndex];
    	        }

    	        // in case changes to data altered a sort column
    	        if (this.sortFunction || this.sortCriteria || this.sortCriteriaSimple) {
    	          this.queueSortPhase();
    	        } else {
    	          this.queueRebuildEvent();
    	        }

    	        return;
    	      }
    	    };

    	    /**
    	     * removeDocument() - internal function called on collection.delete()
    	     * @param {number|number[]} objIndex - index of document to (re)run through filter pipeline.
    	     */
    	    DynamicView.prototype.removeDocument = function (objIndex) {
    	      var idx, rmidx, rmlen, rxo = {}, fxo = {};
    	      var adjels = [];
    	      var drs = this.resultset;
    	      var fr = this.resultset.filteredrows;
    	      var frlen = fr.length;

    	      // if no filter applied yet, the result 'set' should remain 'everything'
    	      if (!this.resultset.filterInitialized) {
    	        if (this.options.persistent) {
    	          this.resultdata = this.resultset.data();
    	        }
    	        // in case changes to data altered a sort column
    	        if (this.sortFunction || this.sortCriteria || this.sortCriteriaSimple) {
    	          this.queueSortPhase();
    	        } else {
    	          this.queueRebuildEvent();
    	        }
    	        return;
    	      }

    	      // if passed single index, wrap in array
    	      if (!Array.isArray(objIndex)) {
    	        objIndex = [objIndex];
    	      }

    	      rmlen = objIndex.length;
    	      // create intersection object of data indices to remove
    	      for (rmidx = 0; rmidx < rmlen; rmidx++) {
    	        rxo[objIndex[rmidx]] = true;
    	      }

    	      // pivot remove data indices into remove filteredrows indices and dump in hashobject
    	      for (idx = 0; idx < frlen; idx++) {
    	        if (rxo[fr[idx]]) fxo[idx] = true;
    	      }

    	      // if any of the removed items were in our filteredrows...
    	      if (Object.keys(fxo).length > 0) {
    	        // remove them from filtered rows
    	        this.resultset.filteredrows = this.resultset.filteredrows.filter(function (di, idx) { return !fxo[idx]; });
    	        // if persistent...
    	        if (this.options.persistent) {
    	          // remove from resultdata
    	          this.resultdata = this.resultdata.filter(function (obj, idx) { return !fxo[idx]; });
    	        }

    	        // and queue sorts
    	        if (this.sortFunction || this.sortCriteria || this.sortCriteriaSimple) {
    	          this.queueSortPhase();
    	        } else {
    	          this.queueRebuildEvent();
    	        }
    	      }

    	      // to remove holes, we need to 'shift down' indices, this filter function finds number of positions to shift
    	      var filt = function (idx) { return function (di) { return di < drs.filteredrows[idx]; }; };

    	      frlen = drs.filteredrows.length;
    	      for (idx = 0; idx < frlen; idx++) {
    	        // grab subset of removed elements where data index is less than current filtered row data index;
    	        // use this to determine how many positions iterated remaining data index needs to be 'shifted down'
    	        adjels = objIndex.filter(filt(idx));
    	        drs.filteredrows[idx] -= adjels.length;
    	      }
    	    };

    	    /**
    	     * mapReduce() - data transformation via user supplied functions
    	     *
    	     * @param {function} mapFunction - this function accepts a single document for you to transform and return
    	     * @param {function} reduceFunction - this function accepts many (array of map outputs) and returns single value
    	     * @returns The output of your reduceFunction
    	     * @memberof DynamicView
    	     */
    	    DynamicView.prototype.mapReduce = function (mapFunction, reduceFunction) {
    	      try {
    	        return reduceFunction(this.data().map(mapFunction));
    	      } catch (err) {
    	        throw err;
    	      }
    	    };


    	    /**
    	     * Collection class that handles documents of same type
    	     * @constructor Collection
    	     * @implements LokiEventEmitter
    	     * @param {string} name - collection name
    	     * @param {(array|object)=} options - (optional) array of property names to be indicized OR a configuration object
    	     * @param {array=} [options.unique=[]] - array of property names to define unique constraints for
    	     * @param {array=} [options.exact=[]] - array of property names to define exact constraints for
    	     * @param {array=} [options.indices=[]] - array property names to define binary indexes for
    	     * @param {boolean} [options.adaptiveBinaryIndices=true] - collection indices will be actively rebuilt rather than lazily
    	     * @param {boolean} [options.asyncListeners=false] - whether listeners are invoked asynchronously
    	     * @param {boolean} [options.disableMeta=false] - set to true to disable meta property on documents
    	     * @param {boolean} [options.disableChangesApi=true] - set to false to enable Changes API
    	     * @param {boolean} [options.disableDeltaChangesApi=true] - set to false to enable Delta Changes API (requires Changes API, forces cloning)
    	     * @param {boolean} [options.autoupdate=false] - use Object.observe to update objects automatically
    	     * @param {boolean} [options.clone=false] - specify whether inserts and queries clone to/from user
    	     * @param {boolean} [options.serializableIndices=true[]] - converts date values on binary indexed properties to epoch time
    	     * @param {boolean} [options.disableFreeze=true] - when false all docs are frozen
    	     * @param {string} [options.cloneMethod='parse-stringify'] - 'parse-stringify', 'jquery-extend-deep', 'shallow', 'shallow-assign'
    	     * @param {int=} options.ttl - age of document (in ms.) before document is considered aged/stale.
    	     * @param {int=} options.ttlInterval - time interval for clearing out 'aged' documents; not set by default.
    	     * @see {@link Loki#addCollection} for normal creation of collections
    	     */
    	    function Collection(name, options) {
    	      // the name of the collection

    	      this.name = name;
    	      // the data held by the collection
    	      this.data = [];
    	      this.idIndex = null; // position->$loki index (built lazily)
    	      this.binaryIndices = {}; // user defined indexes
    	      this.constraints = {
    	        unique: {},
    	        exact: {}
    	      };

    	      // unique contraints contain duplicate object references, so they are not persisted.
    	      // we will keep track of properties which have unique contraint applied here, and regenerate lazily
    	      this.uniqueNames = [];

    	      // transforms will be used to store frequently used query chains as a series of steps
    	      // which itself can be stored along with the database.
    	      this.transforms = {};

    	      // the object type of the collection
    	      this.objType = name;

    	      // in autosave scenarios we will use collection level dirty flags to determine whether save is needed.
    	      // currently, if any collection is dirty we will autosave the whole database if autosave is configured.
    	      // defaulting to true since this is called from addCollection and adding a collection should trigger save
    	      this.dirty = true;

    	      // private holders for cached data
    	      this.cachedIndex = null;
    	      this.cachedBinaryIndex = null;
    	      this.cachedData = null;
    	      var self = this;

    	      /* OPTIONS */
    	      options = options || {};

    	      // exact match and unique constraints
    	      if (options.hasOwnProperty('unique')) {
    	        if (!Array.isArray(options.unique)) {
    	          options.unique = [options.unique];
    	        }
    	        // save names; actual index is built lazily
    	        options.unique.forEach(function (prop) {
    	          self.uniqueNames.push(prop);
    	        });
    	      }

    	      if (options.hasOwnProperty('exact')) {
    	        options.exact.forEach(function (prop) {
    	          self.constraints.exact[prop] = new ExactIndex(prop);
    	        });
    	      }

    	      // if set to true we will optimally keep indices 'fresh' during insert/update/remove ops (never dirty/never needs rebuild)
    	      // if you frequently intersperse insert/update/remove ops between find ops this will likely be significantly faster option.
    	      this.adaptiveBinaryIndices = options.hasOwnProperty('adaptiveBinaryIndices') ? options.adaptiveBinaryIndices : true;

    	      // is collection transactional
    	      this.transactional = options.hasOwnProperty('transactional') ? options.transactional : false;

    	      // options to clone objects when inserting them
    	      this.cloneObjects = options.hasOwnProperty('clone') ? options.clone : false;

    	      // default clone method (if enabled) is parse-stringify
    	      this.cloneMethod = options.hasOwnProperty('cloneMethod') ? options.cloneMethod : "parse-stringify";

    	      // option to make event listeners async, default is sync
    	      this.asyncListeners = options.hasOwnProperty('asyncListeners') ? options.asyncListeners : false;

    	      // if set to true we will not maintain a meta property for a document
    	      this.disableMeta = options.hasOwnProperty('disableMeta') ? options.disableMeta : false;

    	      // disable track changes
    	      this.disableChangesApi = options.hasOwnProperty('disableChangesApi') ? options.disableChangesApi : true;

    	      // disable delta update object style on changes
    	      this.disableDeltaChangesApi = options.hasOwnProperty('disableDeltaChangesApi') ? options.disableDeltaChangesApi : true;
    	      if (this.disableChangesApi) { this.disableDeltaChangesApi = true; }

    	      // option to observe objects and update them automatically, ignored if Object.observe is not supported
    	      this.autoupdate = options.hasOwnProperty('autoupdate') ? options.autoupdate : false;

    	      // by default, if you insert a document into a collection with binary indices, if those indexed properties contain
    	      // a DateTime we will convert to epoch time format so that (across serializations) its value position will be the
    	      // same 'after' serialization as it was 'before'.
    	      this.serializableIndices = options.hasOwnProperty('serializableIndices') ? options.serializableIndices : true;

    	      // option to deep freeze all documents
    	      this.disableFreeze = options.hasOwnProperty('disableFreeze') ? options.disableFreeze : true;

    	      //option to activate a cleaner daemon - clears "aged" documents at set intervals.
    	      this.ttl = {
    	        age: null,
    	        ttlInterval: null,
    	        daemon: null
    	      };
    	      this.setTTL(options.ttl || -1, options.ttlInterval);

    	      // currentMaxId - change manually at your own peril!
    	      this.maxId = 0;

    	      this.DynamicViews = [];

    	      // events
    	      this.events = {
    	        'insert': [],
    	        'update': [],
    	        'pre-insert': [],
    	        'pre-update': [],
    	        'close': [],
    	        'flushbuffer': [],
    	        'error': [],
    	        'delete': [],
    	        'warning': []
    	      };

    	      // changes are tracked by collection and aggregated by the db
    	      this.changes = [];

    	      // lightweight changes tracking (loki IDs only) for optimized db saving
    	      this.dirtyIds = [];

    	      // initialize optional user-supplied indices array ['age', 'lname', 'zip']
    	      var indices = [];
    	      if (options && options.indices) {
    	        if (Object.prototype.toString.call(options.indices) === '[object Array]') {
    	          indices = options.indices;
    	        } else if (typeof options.indices === 'string') {
    	          indices = [options.indices];
    	        } else {
    	          throw new TypeError('Indices needs to be a string or an array of strings');
    	        }
    	      }

    	      for (var idx = 0; idx < indices.length; idx++) {
    	        this.ensureIndex(indices[idx]);
    	      }

    	      function observerCallback(changes) {

    	        var changedObjects = typeof Set === 'function' ? new Set() : [];

    	        if (!changedObjects.add)
    	          changedObjects.add = function (object) {
    	            if (this.indexOf(object) === -1)
    	              this.push(object);
    	            return this;
    	          };

    	        changes.forEach(function (change) {
    	          changedObjects.add(change.object);
    	        });

    	        changedObjects.forEach(function (object) {
    	          if (!hasOwnProperty.call(object, '$loki'))
    	            return self.removeAutoUpdateObserver(object);
    	          try {
    	            self.update(object);
    	          } catch (err) { }
    	        });
    	      }

    	      this.observerCallback = observerCallback;

    	      //Compare changed object (which is a forced clone) with existing object and return the delta
    	      function getChangeDelta(obj, old) {
    	        if (old) {
    	          return getObjectDelta(old, obj);
    	        }
    	        else {
    	          return JSON.parse(JSON.stringify(obj));
    	        }
    	      }

    	      this.getChangeDelta = getChangeDelta;

    	      function getObjectDelta(oldObject, newObject) {
    	        var propertyNames = newObject !== null && typeof newObject === 'object' ? Object.keys(newObject) : null;
    	        if (propertyNames && propertyNames.length && ['string', 'boolean', 'number'].indexOf(typeof (newObject)) < 0) {
    	          var delta = {};
    	          for (var i = 0; i < propertyNames.length; i++) {
    	            var propertyName = propertyNames[i];
    	            if (newObject.hasOwnProperty(propertyName)) {
    	              if (!oldObject.hasOwnProperty(propertyName) || self.uniqueNames.indexOf(propertyName) >= 0 || propertyName == '$loki' || propertyName == 'meta') {
    	                delta[propertyName] = newObject[propertyName];
    	              }
    	              else {
    	                var propertyDelta = getObjectDelta(oldObject[propertyName], newObject[propertyName]);
    	                if (typeof propertyDelta !== "undefined" && propertyDelta != {}) {
    	                  delta[propertyName] = propertyDelta;
    	                }
    	              }
    	            }
    	          }
    	          return Object.keys(delta).length === 0 ? undefined : delta;
    	        }
    	        else {
    	          return oldObject === newObject ? undefined : newObject;
    	        }
    	      }

    	      this.getObjectDelta = getObjectDelta;

    	      // clear all the changes
    	      function flushChanges() {
    	        self.changes = [];
    	      }

    	      this.getChanges = function () {
    	        return self.changes;
    	      };

    	      this.flushChanges = flushChanges;

    	      this.setChangesApi = function (enabled) {
    	        self.disableChangesApi = !enabled;
    	        if (!enabled) { self.disableDeltaChangesApi = false; }
    	      };

    	      this.on('delete', function deleteCallback(obj) {
    	        if (!self.disableChangesApi) {
    	          self.createChange(self.name, 'R', obj);
    	        }
    	      });

    	      this.on('warning', function (warning) {
    	        self.lokiConsoleWrapper.warn(warning);
    	      });
    	      // for de-serialization purposes
    	      flushChanges();
    	    }

    	    Collection.prototype = new LokiEventEmitter();
    	    Collection.prototype.contructor = Collection;

    	    /*
    	      * For ChangeAPI default to clone entire object, for delta changes create object with only differences (+ $loki and meta)
    	      */
    	    Collection.prototype.createChange = function (name, op, obj, old) {
    	      this.changes.push({
    	        name: name,
    	        operation: op,
    	        obj: op == 'U' && !this.disableDeltaChangesApi ? this.getChangeDelta(obj, old) : JSON.parse(JSON.stringify(obj))
    	      });
    	    };

    	    Collection.prototype.insertMeta = function (obj) {
    	      var len, idx;

    	      if (this.disableMeta || !obj) {
    	        return;
    	      }

    	      // if batch insert
    	      if (Array.isArray(obj)) {
    	        len = obj.length;

    	        for (idx = 0; idx < len; idx++) {
    	          if (!obj[idx].hasOwnProperty('meta')) {
    	            obj[idx].meta = {};
    	          }

    	          obj[idx].meta.created = (new Date()).getTime();
    	          obj[idx].meta.revision = 0;
    	        }

    	        return;
    	      }

    	      // single object
    	      if (!obj.meta) {
    	        obj.meta = {};
    	      }

    	      obj.meta.created = (new Date()).getTime();
    	      obj.meta.revision = 0;
    	    };

    	    Collection.prototype.updateMeta = function (obj) {
    	      if (this.disableMeta || !obj) {
    	        return obj;
    	      }
    	      if (!this.disableFreeze) {
    	        obj = unFreeze(obj);
    	        obj.meta = unFreeze(obj.meta);
    	      }
    	      obj.meta.updated = (new Date()).getTime();
    	      obj.meta.revision += 1;
    	      return obj;
    	    };

    	    Collection.prototype.createInsertChange = function (obj) {
    	      this.createChange(this.name, 'I', obj);
    	    };

    	    Collection.prototype.createUpdateChange = function (obj, old) {
    	      this.createChange(this.name, 'U', obj, old);
    	    };

    	    Collection.prototype.insertMetaWithChange = function (obj) {
    	      this.insertMeta(obj);
    	      this.createInsertChange(obj);
    	    };

    	    Collection.prototype.updateMetaWithChange = function (obj, old, objFrozen) {
    	      obj = this.updateMeta(obj, objFrozen);
    	      this.createUpdateChange(obj, old);
    	      return obj;
    	    };

    	    Collection.prototype.lokiConsoleWrapper = {
    	      log: function () { },
    	      warn: function () { },
    	      error: function () { },
    	    };

    	    Collection.prototype.addAutoUpdateObserver = function (object) {
    	      if (!this.autoupdate || typeof Object.observe !== 'function')
    	        return;

    	      Object.observe(object, this.observerCallback, ['add', 'update', 'delete', 'reconfigure', 'setPrototype']);
    	    };

    	    Collection.prototype.removeAutoUpdateObserver = function (object) {
    	      if (!this.autoupdate || typeof Object.observe !== 'function')
    	        return;

    	      Object.unobserve(object, this.observerCallback);
    	    };

    	    /**
    	     * Adds a named collection transform to the collection
    	     * @param {string} name - name to associate with transform
    	     * @param {array} transform - an array of transformation 'step' objects to save into the collection
    	     * @memberof Collection
    	     * @example
    	     * users.addTransform('progeny', [
    	     *   {
    	     *     type: 'find',
    	     *     value: {
    	     *       'age': {'$lte': 40}
    	     *     }
    	     *   }
    	     * ]);
    	     *
    	     * var results = users.chain('progeny').data();
    	     */
    	    Collection.prototype.addTransform = function (name, transform) {
    	      if (this.transforms.hasOwnProperty(name)) {
    	        throw new Error("a transform by that name already exists");
    	      }

    	      this.transforms[name] = transform;
    	    };

    	    /**
    	     * Retrieves a named transform from the collection.
    	     * @param {string} name - name of the transform to lookup.
    	     * @memberof Collection
    	     */
    	    Collection.prototype.getTransform = function (name) {
    	      return this.transforms[name];
    	    };

    	    /**
    	     * Updates a named collection transform to the collection
    	     * @param {string} name - name to associate with transform
    	     * @param {object} transform - a transformation object to save into collection
    	     * @memberof Collection
    	     */
    	    Collection.prototype.setTransform = function (name, transform) {
    	      this.transforms[name] = transform;
    	    };

    	    /**
    	     * Removes a named collection transform from the collection
    	     * @param {string} name - name of collection transform to remove
    	     * @memberof Collection
    	     */
    	    Collection.prototype.removeTransform = function (name) {
    	      delete this.transforms[name];
    	    };

    	    Collection.prototype.byExample = function (template) {
    	      var k, obj, query;
    	      query = [];
    	      for (k in template) {
    	        if (!template.hasOwnProperty(k)) continue;
    	        query.push((
    	          obj = {},
    	          obj[k] = template[k],
    	          obj
    	        ));
    	      }
    	      return {
    	        '$and': query
    	      };
    	    };

    	    Collection.prototype.findObject = function (template) {
    	      return this.findOne(this.byExample(template));
    	    };

    	    Collection.prototype.findObjects = function (template) {
    	      return this.find(this.byExample(template));
    	    };

    	    /*----------------------------+
    	    | TTL daemon                  |
    	    +----------------------------*/
    	    Collection.prototype.ttlDaemonFuncGen = function () {
    	      var collection = this;
    	      var age = this.ttl.age;
    	      return function ttlDaemon() {
    	        var now = Date.now();
    	        var toRemove = collection.chain().where(function daemonFilter(member) {
    	          var timestamp = member.meta.updated || member.meta.created;
    	          var diff = now - timestamp;
    	          return age < diff;
    	        });
    	        toRemove.remove();
    	      };
    	    };

    	    /**
    	     * Updates or applies collection TTL settings.
    	     * @param {int} age - age (in ms) to expire document from collection
    	     * @param {int} interval - time (in ms) to clear collection of aged documents.
    	     * @memberof Collection
    	     */
    	    Collection.prototype.setTTL = function (age, interval) {
    	      if (age < 0) {
    	        clearInterval(this.ttl.daemon);
    	      } else {
    	        this.ttl.age = age;
    	        this.ttl.ttlInterval = interval;
    	        this.ttl.daemon = setInterval(this.ttlDaemonFuncGen(), interval);
    	      }
    	    };

    	    /*----------------------------+
    	    | INDEXING                    |
    	    +----------------------------*/

    	    /**
    	     * create a row filter that covers all documents in the collection
    	     */
    	    Collection.prototype.prepareFullDocIndex = function () {
    	      var len = this.data.length;
    	      var indexes = new Array(len);
    	      for (var i = 0; i < len; i += 1) {
    	        indexes[i] = i;
    	      }
    	      return indexes;
    	    };

    	    /**
    	     * Will allow reconfiguring certain collection options.
    	     * @param {boolean} options.adaptiveBinaryIndices - collection indices will be actively rebuilt rather than lazily
    	     * @memberof Collection
    	     */
    	    Collection.prototype.configureOptions = function (options) {
    	      options = options || {};

    	      if (options.hasOwnProperty('adaptiveBinaryIndices')) {
    	        this.adaptiveBinaryIndices = options.adaptiveBinaryIndices;

    	        // if switching to adaptive binary indices, make sure none are 'dirty'
    	        if (this.adaptiveBinaryIndices) {
    	          this.ensureAllIndexes();
    	        }
    	      }
    	    };

    	    /**
    	     * Ensure binary index on a certain field
    	     * @param {string} property - name of property to create binary index on
    	     * @param {boolean=} force - (Optional) flag indicating whether to construct index immediately
    	     * @memberof Collection
    	     */
    	    Collection.prototype.ensureIndex = function (property, force) {
    	      // optional parameter to force rebuild whether flagged as dirty or not
    	      if (typeof (force) === 'undefined') {
    	        force = false;
    	      }

    	      if (property === null || property === undefined) {
    	        throw new Error('Attempting to set index without an associated property');
    	      }

    	      if (this.binaryIndices[property] && !force) {
    	        if (!this.binaryIndices[property].dirty) return;
    	      }

    	      // if the index is already defined and we are using adaptiveBinaryIndices and we are not forcing a rebuild, return.
    	      if (this.adaptiveBinaryIndices === true && this.binaryIndices.hasOwnProperty(property) && !force) {
    	        return;
    	      }

    	      var index = {
    	        'name': property,
    	        'dirty': true,
    	        'values': this.prepareFullDocIndex()
    	      };
    	      this.binaryIndices[property] = index;

    	      var wrappedComparer =
    	        (function (prop, data) {
    	          var val1, val2;
    	          var propPath = ~prop.indexOf('.') ? prop.split('.') : false;
    	          return function (a, b) {
    	            if (propPath) {
    	              val1 = Utils.getIn(data[a], propPath, true);
    	              val2 = Utils.getIn(data[b], propPath, true);
    	            } else {
    	              val1 = data[a][prop];
    	              val2 = data[b][prop];
    	            }

    	            if (val1 !== val2) {
    	              if (Comparators.lt(val1, val2, false)) return -1;
    	              if (Comparators.gt(val1, val2, false)) return 1;
    	            }
    	            return 0;
    	          };
    	        })(property, this.data);

    	      index.values.sort(wrappedComparer);
    	      index.dirty = false;

    	      this.dirty = true; // for autosave scenarios
    	    };

    	    /**
    	     * Perform checks to determine validity/consistency of all binary indices
    	     * @param {object=} options - optional configuration object
    	     * @param {boolean} [options.randomSampling=false] - whether (faster) random sampling should be used
    	     * @param {number} [options.randomSamplingFactor=0.10] - percentage of total rows to randomly sample
    	     * @param {boolean} [options.repair=false] - whether to fix problems if they are encountered
    	     * @returns {string[]} array of index names where problems were found.
    	     * @memberof Collection
    	     * @example
    	     * // check all indices on a collection, returns array of invalid index names
    	     * var result = coll.checkAllIndexes({ repair: true, randomSampling: true, randomSamplingFactor: 0.15 });
    	     * if (result.length > 0) {
    	     *   results.forEach(function(name) {
    	     *     console.log('problem encountered with index : ' + name);
    	     *   });
    	     * }
    	     */
    	    Collection.prototype.checkAllIndexes = function (options) {
    	      var key, bIndices = this.binaryIndices;
    	      var results = [], result;

    	      for (key in bIndices) {
    	        if (hasOwnProperty.call(bIndices, key)) {
    	          result = this.checkIndex(key, options);
    	          if (!result) {
    	            results.push(key);
    	          }
    	        }
    	      }

    	      return results;
    	    };

    	    /**
    	     * Perform checks to determine validity/consistency of a binary index
    	     * @param {string} property - name of the binary-indexed property to check
    	     * @param {object=} options - optional configuration object
    	     * @param {boolean} [options.randomSampling=false] - whether (faster) random sampling should be used
    	     * @param {number} [options.randomSamplingFactor=0.10] - percentage of total rows to randomly sample
    	     * @param {boolean} [options.repair=false] - whether to fix problems if they are encountered
    	     * @returns {boolean} whether the index was found to be valid (before optional correcting).
    	     * @memberof Collection
    	     * @example
    	     * // full test
    	     * var valid = coll.checkIndex('name');
    	     * // full test with repair (if issues found)
    	     * valid = coll.checkIndex('name', { repair: true });
    	     * // random sampling (default is 10% of total document count)
    	     * valid = coll.checkIndex('name', { randomSampling: true });
    	     * // random sampling (sample 20% of total document count)
    	     * valid = coll.checkIndex('name', { randomSampling: true, randomSamplingFactor: 0.20 });
    	     * // random sampling (implied boolean)
    	     * valid = coll.checkIndex('name', { randomSamplingFactor: 0.20 });
    	     * // random sampling with repair (if issues found)
    	     * valid = coll.checkIndex('name', { repair: true, randomSampling: true });
    	     */
    	    Collection.prototype.checkIndex = function (property, options) {
    	      options = options || {};
    	      // if 'randomSamplingFactor' specified but not 'randomSampling', assume true
    	      if (options.randomSamplingFactor && options.randomSampling !== false) {
    	        options.randomSampling = true;
    	      }
    	      options.randomSamplingFactor = options.randomSamplingFactor || 0.1;
    	      if (options.randomSamplingFactor < 0 || options.randomSamplingFactor > 1) {
    	        options.randomSamplingFactor = 0.1;
    	      }

    	      var valid = true, idx, iter, pos, len, biv;

    	      // make sure we are passed a valid binary index name
    	      if (!this.binaryIndices.hasOwnProperty(property)) {
    	        throw new Error("called checkIndex on property without an index: " + property);
    	      }

    	      // if lazy indexing, rebuild only if flagged as dirty
    	      if (!this.adaptiveBinaryIndices) {
    	        this.ensureIndex(property);
    	      }

    	      biv = this.binaryIndices[property].values;
    	      len = biv.length;

    	      // if the index has an incorrect number of values
    	      if (len !== this.data.length) {
    	        if (options.repair) {
    	          this.ensureIndex(property, true);
    	        }
    	        return false;
    	      }

    	      if (len === 0) {
    	        return true;
    	      }

    	      var usingDotNotation = (property.indexOf('.') !== -1);

    	      if (len === 1) {
    	        valid = (biv[0] === 0);
    	      }
    	      else {
    	        if (options.randomSampling) {
    	          // validate first and last
    	          if (!LokiOps.$lte(Utils.getIn(this.data[biv[0]], property, usingDotNotation),
    	            Utils.getIn(this.data[biv[1]], property, usingDotNotation))) {
    	            valid = false;
    	          }
    	          if (!LokiOps.$lte(Utils.getIn(this.data[biv[len - 2]], property, usingDotNotation),
    	            Utils.getIn(this.data[biv[len - 1]], property, usingDotNotation))) {
    	            valid = false;
    	          }

    	          // if first and last positions are sorted correctly with their nearest neighbor,
    	          // continue onto random sampling phase...
    	          if (valid) {
    	            // # random samplings = total count * sampling factor
    	            iter = Math.floor((len - 1) * options.randomSamplingFactor);

    	            // for each random sampling, validate that the binary index is sequenced properly
    	            // with next higher value.
    	            for (idx = 0; idx < iter - 1; idx++) {
    	              // calculate random position
    	              pos = Math.floor(Math.random() * (len - 1));
    	              if (!LokiOps.$lte(Utils.getIn(this.data[biv[pos]], property, usingDotNotation),
    	                Utils.getIn(this.data[biv[pos + 1]], property, usingDotNotation))) {
    	                valid = false;
    	                break;
    	              }
    	            }
    	          }
    	        }
    	        else {
    	          // validate that the binary index is sequenced properly
    	          for (idx = 0; idx < len - 1; idx++) {
    	            if (!LokiOps.$lte(Utils.getIn(this.data[biv[idx]], property, usingDotNotation),
    	              Utils.getIn(this.data[biv[idx + 1]], property, usingDotNotation))) {
    	              valid = false;
    	              break;
    	            }
    	          }
    	        }
    	      }

    	      // if incorrectly sequenced and we are to fix problems, rebuild index
    	      if (!valid && options.repair) {
    	        this.ensureIndex(property, true);
    	      }

    	      return valid;
    	    };

    	    Collection.prototype.getBinaryIndexValues = function (property) {
    	      var idx, idxvals = this.binaryIndices[property].values;
    	      var result = [];

    	      for (idx = 0; idx < idxvals.length; idx++) {
    	        result.push(Utils.getIn(this.data[idxvals[idx]], property, true));
    	      }

    	      return result;
    	    };

    	    /**
    	     * Returns a named unique index
    	     * @param {string} field - indexed field name
    	     * @param {boolean} force - if `true`, will rebuild index; otherwise, function may return null
    	     */
    	    Collection.prototype.getUniqueIndex = function (field, force) {
    	      var index = this.constraints.unique[field];
    	      if (!index && force) {
    	        return this.ensureUniqueIndex(field);
    	      }
    	      return index;
    	    };

    	    Collection.prototype.ensureUniqueIndex = function (field) {
    	      var index = this.constraints.unique[field];
    	      if (!index) {
    	        // keep track of new unique index for regenerate after database (re)load.
    	        if (this.uniqueNames.indexOf(field) == -1) {
    	          this.uniqueNames.push(field);
    	        }
    	      }

    	      // if index already existed, (re)loading it will likely cause collisions, rebuild always
    	      this.constraints.unique[field] = index = new UniqueIndex(field);
    	      this.data.forEach(function (obj) {
    	        index.set(obj);
    	      });
    	      return index;
    	    };

    	    /**
    	     * Ensure all binary indices
    	     * @param {boolean} force - whether to force rebuild of existing lazy binary indices
    	     * @memberof Collection
    	     */
    	    Collection.prototype.ensureAllIndexes = function (force) {
    	      var key, bIndices = this.binaryIndices;
    	      for (key in bIndices) {
    	        if (hasOwnProperty.call(bIndices, key)) {
    	          this.ensureIndex(key, force);
    	        }
    	      }
    	    };

    	    /**
    	     * Internal method used to flag all lazy index as dirty
    	     */
    	    Collection.prototype.flagBinaryIndexesDirty = function () {
    	      var key, bIndices = this.binaryIndices;
    	      for (key in bIndices) {
    	        if (hasOwnProperty.call(bIndices, key)) {
    	          bIndices[key].dirty = true;
    	        }
    	      }
    	    };

    	    /**
    	     * Internal method used to flag a lazy index as dirty
    	     */
    	    Collection.prototype.flagBinaryIndexDirty = function (index) {
    	      if (this.binaryIndices[index])
    	        this.binaryIndices[index].dirty = true;
    	    };

    	    /**
    	     * Quickly determine number of documents in collection (or query)
    	     * @param {object=} query - (optional) query object to count results of
    	     * @returns {number} number of documents in the collection
    	     * @memberof Collection
    	     */
    	    Collection.prototype.count = function (query) {
    	      if (!query) {
    	        return this.data.length;
    	      }

    	      return this.chain().find(query).filteredrows.length;
    	    };

    	    /**
    	     * Rebuild idIndex
    	     */
    	    Collection.prototype.ensureId = function () {
    	      if (this.idIndex) {
    	        return;
    	      }
    	      var data = this.data,
    	        i = 0;
    	      var len = data.length;
    	      var index = new Array(len);
    	      for (i; i < len; i++) {
    	        index[i] = data[i].$loki;
    	      }
    	      this.idIndex = index;
    	    };

    	    /**
    	     * Rebuild idIndex async with callback - useful for background syncing with a remote server
    	     */
    	    Collection.prototype.ensureIdAsync = function (callback) {
    	      this.async(function () {
    	        this.ensureId();
    	      }, callback);
    	    };

    	    /**
    	     * Add a dynamic view to the collection
    	     * @param {string} name - name of dynamic view to add
    	     * @param {object=} options - options to configure dynamic view with
    	     * @param {boolean} [options.persistent=false] - indicates if view is to main internal results array in 'resultdata'
    	     * @param {string} [options.sortPriority='passive'] - 'passive' (sorts performed on call to data) or 'active' (after updates)
    	     * @param {number} options.minRebuildInterval - minimum rebuild interval (need clarification to docs here)
    	     * @returns {DynamicView} reference to the dynamic view added
    	     * @memberof Collection
    	     * @example
    	     * var pview = users.addDynamicView('progeny');
    	     * pview.applyFind({'age': {'$lte': 40}});
    	     * pview.applySimpleSort('name');
    	     *
    	     * var results = pview.data();
    	     **/

    	    Collection.prototype.addDynamicView = function (name, options) {
    	      var dv = new DynamicView(this, name, options);
    	      this.DynamicViews.push(dv);

    	      return dv;
    	    };

    	    /**
    	     * Remove a dynamic view from the collection
    	     * @param {string} name - name of dynamic view to remove
    	     * @memberof Collection
    	     **/
    	    Collection.prototype.removeDynamicView = function (name) {
    	      this.DynamicViews =
    	        this.DynamicViews.filter(function (dv) { return dv.name !== name; });
    	    };

    	    /**
    	     * Look up dynamic view reference from within the collection
    	     * @param {string} name - name of dynamic view to retrieve reference of
    	     * @returns {DynamicView} A reference to the dynamic view with that name
    	     * @memberof Collection
    	     **/
    	    Collection.prototype.getDynamicView = function (name) {
    	      for (var idx = 0; idx < this.DynamicViews.length; idx++) {
    	        if (this.DynamicViews[idx].name === name) {
    	          return this.DynamicViews[idx];
    	        }
    	      }

    	      return null;
    	    };

    	    /**
    	     * Applies a 'mongo-like' find query object and passes all results to an update function.
    	     * For filter function querying you should migrate to [updateWhere()]{@link Collection#updateWhere}.
    	     *
    	     * @param {object|function} filterObject - 'mongo-like' query object (or deprecated filterFunction mode)
    	     * @param {function} updateFunction - update function to run against filtered documents
    	     * @memberof Collection
    	     */
    	    Collection.prototype.findAndUpdate = function (filterObject, updateFunction) {
    	      if (typeof (filterObject) === "function") {
    	        this.updateWhere(filterObject, updateFunction);
    	      }
    	      else {
    	        this.chain().find(filterObject).update(updateFunction);
    	      }
    	    };

    	    /**
    	     * Applies a 'mongo-like' find query object removes all documents which match that filter.
    	     *
    	     * @param {object} filterObject - 'mongo-like' query object
    	     * @memberof Collection
    	     */
    	    Collection.prototype.findAndRemove = function (filterObject) {
    	      this.chain().find(filterObject).remove();
    	    };

    	    /**
    	     * Adds object(s) to collection, ensure object(s) have meta properties, clone it if necessary, etc.
    	     * @param {(object|array)} doc - the document (or array of documents) to be inserted
    	     * @param {boolean=} overrideAdaptiveIndices - (optional) if `true`, adaptive indicies will be
    	     *   temporarily disabled and then fully rebuilt after batch. This will be faster for
    	     *   large inserts, but slower for small/medium inserts in large collections
    	     * @returns {(object|array)} document or documents inserted
    	     * @memberof Collection
    	     * @example
    	     * users.insert({
    	     *     name: 'Odin',
    	     *     age: 50,
    	     *     address: 'Asgard'
    	     * });
    	     *
    	     * // alternatively, insert array of documents
    	     * users.insert([{ name: 'Thor', age: 35}, { name: 'Loki', age: 30}]);
    	     */
    	    Collection.prototype.insert = function (doc, overrideAdaptiveIndices) {
    	      if (!Array.isArray(doc)) {
    	        return this.insertOne(doc);
    	      }

    	      // holder to the clone of the object inserted if collections is set to clone objects
    	      var obj;
    	      var results = [];

    	      // if not cloning, disable adaptive binary indices for the duration of the batch insert,
    	      // followed by lazy rebuild and re-enabling adaptive indices after batch insert.
    	      var adaptiveBatchOverride = overrideAdaptiveIndices && !this.cloneObjects &&
    	        this.adaptiveBinaryIndices && Object.keys(this.binaryIndices).length > 0;

    	      if (adaptiveBatchOverride) {
    	        this.adaptiveBinaryIndices = false;
    	      }

    	      try {
    	        this.emit('pre-insert', doc);
    	        for (var i = 0, len = doc.length; i < len; i++) {
    	          obj = this.insertOne(doc[i], true);
    	          if (!obj) {
    	            return undefined;
    	          }
    	          results.push(obj);
    	        }
    	      } finally {
    	        if (adaptiveBatchOverride) {
    	          this.ensureAllIndexes();
    	          this.adaptiveBinaryIndices = true;
    	        }
    	      }

    	      // at the 'batch' level, if clone option is true then emitted docs are clones
    	      this.emit('insert', results);

    	      // if clone option is set, clone return values
    	      results = this.cloneObjects ? clone(results, this.cloneMethod) : results;

    	      return results.length === 1 ? results[0] : results;
    	    };

    	    /**
    	     * Adds a single object, ensures it has meta properties, clone it if necessary, etc.
    	     * @param {object} doc - the document to be inserted
    	     * @param {boolean} bulkInsert - quiet pre-insert and insert event emits
    	     * @returns {object} document or 'undefined' if there was a problem inserting it
    	     */
    	    Collection.prototype.insertOne = function (doc, bulkInsert) {
    	      var err = null;
    	      var returnObj;

    	      if (typeof doc !== 'object') {
    	        err = new TypeError('Document needs to be an object');
    	      } else if (doc === null) {
    	        err = new TypeError('Object cannot be null');
    	      }

    	      if (err !== null) {
    	        this.emit('error', err);
    	        throw err;
    	      }

    	      // if configured to clone, do so now... otherwise just use same obj reference
    	      var obj = this.cloneObjects ? clone(doc, this.cloneMethod) : doc;
    	      if (!this.disableFreeze) {
    	        obj = unFreeze(obj);
    	      }

    	      if (!this.disableMeta) {
    	        if (typeof obj.meta === 'undefined') {
    	          obj.meta = {
    	            revision: 0,
    	            created: 0
    	          };
    	        } else if (!this.disableFreeze) {
    	          obj.meta = unFreeze(obj.meta);
    	        }
    	      }

    	      // both 'pre-insert' and 'insert' events are passed internal data reference even when cloning
    	      // insert needs internal reference because that is where loki itself listens to add meta
    	      if (!bulkInsert) {
    	        this.emit('pre-insert', obj);
    	      }
    	      if (!this.add(obj)) {
    	        return undefined;
    	      }

    	      // update meta and store changes if ChangesAPI is enabled
    	      // (moved from "insert" event listener to allow internal reference to be used)
    	      if (this.disableChangesApi) {
    	        this.insertMeta(obj);
    	      } else {
    	        this.insertMetaWithChange(obj);
    	      }

    	      if (!this.disableFreeze) {
    	        deepFreeze(obj);
    	      }

    	      // if cloning is enabled, emit insert event with clone of new object
    	      returnObj = this.cloneObjects ? clone(obj, this.cloneMethod) : obj;

    	      if (!bulkInsert) {
    	        this.emit('insert', returnObj);
    	      }

    	      this.addAutoUpdateObserver(returnObj);

    	      return returnObj;
    	    };

    	    /**
    	     * Empties the collection.
    	     * @param {object=} options - configure clear behavior
    	     * @param {bool=} [options.removeIndices=false] - whether to remove indices in addition to data
    	     * @memberof Collection
    	     */
    	    Collection.prototype.clear = function (options) {
    	      var self = this;

    	      options = options || {};

    	      this.data = [];
    	      this.idIndex = null;
    	      this.cachedIndex = null;
    	      this.cachedBinaryIndex = null;
    	      this.cachedData = null;
    	      this.maxId = 0;
    	      this.DynamicViews = [];
    	      this.dirty = true;
    	      this.constraints = {
    	        unique: {},
    	        exact: {}
    	      };

    	      // if removing indices entirely
    	      if (options.removeIndices === true) {
    	        this.binaryIndices = {};
    	        this.uniqueNames = [];
    	      }
    	      // clear indices but leave definitions in place
    	      else {
    	        // clear binary indices
    	        var keys = Object.keys(this.binaryIndices);
    	        keys.forEach(function (biname) {
    	          self.binaryIndices[biname].dirty = false;
    	          self.binaryIndices[biname].values = [];
    	        });
    	      }
    	    };

    	    /**
    	     * Updates an object and notifies collection that the document has changed.
    	     * @param {object} doc - document to update within the collection
    	     * @memberof Collection
    	     */
    	    Collection.prototype.update = function (doc) {
    	      var adaptiveBatchOverride, k, len;

    	      if (Array.isArray(doc)) {
    	        len = doc.length;

    	        // if not cloning, disable adaptive binary indices for the duration of the batch update,
    	        // followed by lazy rebuild and re-enabling adaptive indices after batch update.
    	        adaptiveBatchOverride = !this.cloneObjects &&
    	          this.adaptiveBinaryIndices && Object.keys(this.binaryIndices).length > 0;

    	        if (adaptiveBatchOverride) {
    	          this.adaptiveBinaryIndices = false;
    	        }

    	        try {
    	          for (k = 0; k < len; k += 1) {
    	            this.update(doc[k]);
    	          }
    	        }
    	        finally {
    	          if (adaptiveBatchOverride) {
    	            this.ensureAllIndexes();
    	            this.adaptiveBinaryIndices = true;
    	          }
    	        }

    	        return;
    	      }

    	      // verify object is a properly formed document
    	      if (!hasOwnProperty.call(doc, '$loki')) {
    	        throw new Error('Trying to update unsynced document. Please save the document first by using insert() or addMany()');
    	      }
    	      try {
    	        this.startTransaction();
    	        var arr = this.get(doc.$loki, true),
    	          oldInternal,   // ref to existing obj
    	          newInternal, // ref to new internal obj
    	          position,
    	          self = this;

    	        if (!arr) {
    	          throw new Error('Trying to update a document not in collection.');
    	        }

    	        oldInternal = arr[0]; // -internal- obj ref
    	        position = arr[1]; // position in data array

    	        // if configured to clone, do so now... otherwise just use same obj reference
    	        newInternal = this.cloneObjects || (!this.disableDeltaChangesApi && this.disableFreeze) ? clone(doc, this.cloneMethod) : doc;

    	        this.emit('pre-update', doc);

    	        this.uniqueNames.forEach(function (key) {
    	          self.getUniqueIndex(key, true).update(oldInternal, newInternal);
    	        });

    	        // operate the update
    	        this.data[position] = newInternal;

    	        if (newInternal !== doc) {
    	          this.addAutoUpdateObserver(doc);
    	        }

    	        // now that we can efficiently determine the data[] position of newly added document,
    	        // submit it for all registered DynamicViews to evaluate for inclusion/exclusion
    	        for (var idx = 0; idx < this.DynamicViews.length; idx++) {
    	          this.DynamicViews[idx].evaluateDocument(position, false);
    	        }

    	        var key;
    	        if (this.adaptiveBinaryIndices) {
    	          // for each binary index defined in collection, immediately update rather than flag for lazy rebuild
    	          var bIndices = this.binaryIndices;
    	          for (key in bIndices) {
    	            this.adaptiveBinaryIndexUpdate(position, key);
    	          }
    	        }
    	        else {
    	          this.flagBinaryIndexesDirty();
    	        }

    	        this.idIndex[position] = newInternal.$loki;
    	        //this.flagBinaryIndexesDirty();

    	        if (this.isIncremental) {
    	          this.dirtyIds.push(newInternal.$loki);
    	        }

    	        this.commit();
    	        this.dirty = true; // for autosave scenarios

    	        // update meta and store changes if ChangesAPI is enabled
    	        if (this.disableChangesApi) {
    	          newInternal = this.updateMeta(newInternal);
    	        } else {
    	          newInternal = this.updateMetaWithChange(newInternal, oldInternal);
    	        }

    	        if (!this.disableFreeze) {
    	          deepFreeze(newInternal);
    	        }

    	        var returnObj;

    	        // if cloning is enabled, emit 'update' event and return with clone of new object
    	        if (this.cloneObjects) {
    	          returnObj = clone(newInternal, this.cloneMethod);
    	        }
    	        else {
    	          returnObj = newInternal;
    	        }

    	        this.emit('update', returnObj, oldInternal);
    	        return returnObj;
    	      } catch (err) {
    	        this.rollback();
    	        this.lokiConsoleWrapper.error(err.message);
    	        this.emit('error', err);
    	        throw (err); // re-throw error so user does not think it succeeded
    	      }
    	    };

    	    /**
    	     * Add object to collection
    	     */
    	    Collection.prototype.add = function (obj) {
    	      // if parameter isn't object exit with throw
    	      if ('object' !== typeof obj) {
    	        throw new TypeError('Object being added needs to be an object');
    	      }
    	      // if object you are adding already has id column it is either already in the collection
    	      // or the object is carrying its own 'id' property.  If it also has a meta property,
    	      // then this is already in collection so throw error, otherwise rename to originalId and continue adding.
    	      if (typeof (obj.$loki) !== 'undefined') {
    	        throw new Error('Document is already in collection, please use update()');
    	      }

    	      /*
    	       * try adding object to collection
    	       */
    	      try {
    	        this.startTransaction();
    	        this.maxId++;

    	        if (isNaN(this.maxId)) {
    	          this.maxId = (this.data[this.data.length - 1].$loki + 1);
    	        }

    	        var newId = this.maxId;
    	        obj.$loki = newId;

    	        if (!this.disableMeta) {
    	          obj.meta.version = 0;
    	        }

    	        for (var i = 0, len = this.uniqueNames.length; i < len; i ++) {
    	          this.getUniqueIndex(this.uniqueNames[i], true).set(obj);
    	        }

    	        if (this.idIndex) {
    	          this.idIndex.push(newId);
    	        }

    	        if (this.isIncremental) {
    	          this.dirtyIds.push(newId);
    	        }

    	        // add the object
    	        this.data.push(obj);

    	        var addedPos = this.data.length - 1;

    	        // now that we can efficiently determine the data[] position of newly added document,
    	        // submit it for all registered DynamicViews to evaluate for inclusion/exclusion
    	        var dvlen = this.DynamicViews.length;
    	        for (i = 0; i < dvlen; i++) {
    	          this.DynamicViews[i].evaluateDocument(addedPos, true);
    	        }

    	        if (this.adaptiveBinaryIndices) {
    	          // for each binary index defined in collection, immediately update rather than flag for lazy rebuild
    	          var bIndices = this.binaryIndices;
    	          for (var key in bIndices) {
    	            this.adaptiveBinaryIndexInsert(addedPos, key);
    	          }
    	        }
    	        else {
    	          this.flagBinaryIndexesDirty();
    	        }

    	        this.commit();
    	        this.dirty = true; // for autosave scenarios

    	        return (this.cloneObjects) ? (clone(obj, this.cloneMethod)) : (obj);
    	      } catch (err) {
    	        this.rollback();
    	        this.lokiConsoleWrapper.error(err.message);
    	        this.emit('error', err);
    	        throw (err); // re-throw error so user does not think it succeeded
    	      }
    	    };

    	    /**
    	     * Applies a filter function and passes all results to an update function.
    	     *
    	     * @param {function} filterFunction - filter function whose results will execute update
    	     * @param {function} updateFunction - update function to run against filtered documents
    	     * @memberof Collection
    	     */
    	    Collection.prototype.updateWhere = function (filterFunction, updateFunction) {
    	      var results = this.where(filterFunction),
    	        i = 0,
    	        obj;
    	      try {
    	        for (i; i < results.length; i++) {
    	          obj = updateFunction(results[i]);
    	          this.update(obj);
    	        }

    	      } catch (err) {
    	        this.rollback();
    	        this.lokiConsoleWrapper.error(err.message);
    	      }
    	    };

    	    /**
    	     * Remove all documents matching supplied filter function.
    	     * For 'mongo-like' querying you should migrate to [findAndRemove()]{@link Collection#findAndRemove}.
    	     * @param {function|object} query - query object to filter on
    	     * @memberof Collection
    	     */
    	    Collection.prototype.removeWhere = function (query) {
    	      var list;
    	      if (typeof query === 'function') {
    	        list = this.data.filter(query);
    	        this.remove(list);
    	      } else {
    	        this.chain().find(query).remove();
    	      }
    	    };

    	    Collection.prototype.removeDataOnly = function () {
    	      this.remove(this.data.slice());
    	    };

    	    /**
    	     * Internal method to remove a batch of documents from the collection.
    	     * @param {number[]} positions - data/idIndex positions to remove
    	     */
    	    Collection.prototype.removeBatchByPositions = function (positions) {
    	      var len = positions.length;
    	      var xo = {};
    	      var dlen, didx, idx;
    	      var bic = Object.keys(this.binaryIndices).length;
    	      var uic = Object.keys(this.constraints.unique).length;
    	      var adaptiveOverride = this.adaptiveBinaryIndices && Object.keys(this.binaryIndices).length > 0;
    	      var doc, self = this;

    	      try {
    	        this.startTransaction();

    	        // create hashobject for positional removal inclusion tests...
    	        // all keys defined in this hashobject represent $loki ids of the documents to remove.
    	        this.ensureId();
    	        for (idx = 0; idx < len; idx++) {
    	          xo[this.idIndex[positions[idx]]] = true;
    	        }

    	        // if we will need to notify dynamic views and/or binary indices to update themselves...
    	        dlen = this.DynamicViews.length;
    	        if ((dlen > 0) || (bic > 0) || (uic > 0)) {
    	          if (dlen > 0) {
    	            // notify dynamic views to remove relevant documents at data positions
    	            for (didx = 0; didx < dlen; didx++) {
    	              // notify dv of remove (passing batch/array of positions)
    	              this.DynamicViews[didx].removeDocument(positions);
    	            }
    	          }

    	          // notify binary indices to update
    	          if (this.adaptiveBinaryIndices && !adaptiveOverride) {
    	            // for each binary index defined in collection, immediately update rather than flag for lazy rebuild
    	            var key, bIndices = this.binaryIndices;

    	            for (key in bIndices) {
    	              this.adaptiveBinaryIndexRemove(positions, key);
    	            }
    	          }
    	          else {
    	            this.flagBinaryIndexesDirty();
    	          }

    	          if (uic) {
    	            this.uniqueNames.forEach(function (key) {
    	              var index = self.getUniqueIndex(key);
    	              if (index) {
    	                for (idx = 0; idx < len; idx++) {
    	                  doc = self.data[positions[idx]];
    	                  if (doc[key] !== null && doc[key] !== undefined) {
    	                    index.remove(doc[key]);
    	                  }
    	                }
    	              }
    	            });
    	          }
    	        }

    	        // emit 'delete' events only of listeners are attached.
    	        // since data not removed yet, in future we can emit single delete event with array...
    	        // for now that might be breaking change to put in potential 1.6 or LokiDB (lokijs2) version
    	        if (!this.disableChangesApi || this.events.delete.length > 1) {
    	          for (idx = 0; idx < len; idx++) {
    	            this.emit('delete', this.data[positions[idx]]);
    	          }
    	        }

    	        // remove from data[] :
    	        // filter collection data for items not in inclusion hashobject
    	        this.data = this.data.filter(function (obj) {
    	          return !xo[obj.$loki];
    	        });

    	        if (this.isIncremental) {
    	          for(idx=0; idx < len; idx++) {
    	            this.dirtyIds.push(this.idIndex[positions[idx]]);
    	          }
    	        }

    	        // remove from idIndex[] :
    	        // filter idIndex for items not in inclusion hashobject
    	        this.idIndex = this.idIndex.filter(function (id) {
    	          return !xo[id];
    	        });

    	        if (this.adaptiveBinaryIndices && adaptiveOverride) {
    	          this.adaptiveBinaryIndices = false;
    	          this.ensureAllIndexes(true);
    	          this.adaptiveBinaryIndices = true;
    	        }

    	        this.commit();

    	        // flag collection as dirty for autosave
    	        this.dirty = true;
    	      }
    	      catch (err) {
    	        this.rollback();
    	        if (adaptiveOverride) {
    	          this.adaptiveBinaryIndices = true;
    	        }
    	        this.lokiConsoleWrapper.error(err.message);
    	        this.emit('error', err);
    	        return null;
    	      }
    	    };

    	    /**
    	     *  Internal method called by remove()
    	     * @param {object[]|number[]} batch - array of documents or $loki ids to remove
    	     */
    	    Collection.prototype.removeBatch = function (batch) {
    	      var len = batch.length,
    	        dlen = this.data.length,
    	        idx;
    	      var xlt = {};
    	      var posx = [];

    	      // create lookup hashobject to translate $loki id to position
    	      for (idx = 0; idx < dlen; idx++) {
    	        xlt[this.data[idx].$loki] = idx;
    	      }

    	      // iterate the batch
    	      for (idx = 0; idx < len; idx++) {
    	        if (typeof (batch[idx]) === 'object') {
    	          posx.push(xlt[batch[idx].$loki]);
    	        }
    	        else {
    	          posx.push(xlt[batch[idx]]);
    	        }
    	      }

    	      this.removeBatchByPositions(posx);
    	    };

    	    /**
    	     * Remove a document from the collection
    	     * @param {object} doc - document to remove from collection
    	     * @memberof Collection
    	     */
    	    Collection.prototype.remove = function (doc) {

    	      if (typeof doc === 'number') {
    	        doc = this.get(doc);
    	      }

    	      if ('object' !== typeof doc) {
    	        throw new Error('Parameter is not an object');
    	      }
    	      if (Array.isArray(doc)) {
    	        this.removeBatch(doc);
    	        return;
    	      }

    	      if (!hasOwnProperty.call(doc, '$loki')) {
    	        throw new Error('Object is not a document stored in the collection');
    	      }

    	      try {
    	        this.startTransaction();
    	        var arr = this.get(doc.$loki, true),
    	          // obj = arr[0],
    	          position = arr[1];
    	        var self = this;
    	        this.uniqueNames.forEach(function (key) {
    	          if (doc[key] !== null && typeof doc[key] !== 'undefined') {
    	            var index = self.getUniqueIndex(key);
    	            if (index) {
    	              index.remove(doc[key]);
    	            }
    	          }
    	        });
    	        // now that we can efficiently determine the data[] position of newly added document,
    	        // submit it for all registered DynamicViews to remove
    	        for (var idx = 0; idx < this.DynamicViews.length; idx++) {
    	          this.DynamicViews[idx].removeDocument(position);
    	        }

    	        if (this.adaptiveBinaryIndices) {
    	          // for each binary index defined in collection, immediately update rather than flag for lazy rebuild
    	          var key, bIndices = this.binaryIndices;
    	          for (key in bIndices) {
    	            this.adaptiveBinaryIndexRemove(position, key);
    	          }
    	        }
    	        else {
    	          this.flagBinaryIndexesDirty();
    	        }

    	        this.data.splice(position, 1);
    	        this.removeAutoUpdateObserver(doc);

    	        // remove id from idIndex
    	        this.idIndex.splice(position, 1);

    	        if (this.isIncremental) {
    	          this.dirtyIds.push(doc.$loki);
    	        }

    	        this.commit();
    	        this.dirty = true; // for autosave scenarios
    	        this.emit('delete', arr[0]);

    	        if (!this.disableFreeze) {
    	          doc = unFreeze(doc);
    	        }
    	        delete doc.$loki;
    	        delete doc.meta;
    	        if (!this.disableFreeze) {
    	          freeze(doc);
    	        }
    	        return doc;

    	      } catch (err) {
    	        this.rollback();
    	        this.lokiConsoleWrapper.error(err.message);
    	        this.emit('error', err);
    	        return null;
    	      }
    	    };

    	    /*---------------------+
    	    | Finding methods     |
    	    +----------------------*/

    	    /**
    	     * Get by Id - faster than other methods because of the searching algorithm
    	     * @param {int} id - $loki id of document you want to retrieve
    	     * @param {boolean} returnPosition - if 'true' we will return [object, position]
    	     * @returns {(object|array|null)} Object reference if document was found, null if not,
    	     *     or an array if 'returnPosition' was passed.
    	     * @memberof Collection
    	     */
    	    Collection.prototype.get = function (id, returnPosition) {
    	      if (!this.idIndex) {
    	        this.ensureId();
    	      }

    	      var retpos = returnPosition || false,
    	        data = this.idIndex,
    	        max = data.length - 1,
    	        min = 0,
    	        mid = (min + max) >> 1;

    	      id = typeof id === 'number' ? id : parseInt(id, 10);

    	      if (isNaN(id)) {
    	        throw new TypeError('Passed id is not an integer');
    	      }

    	      while (data[min] < data[max]) {
    	        mid = (min + max) >> 1;

    	        if (data[mid] < id) {
    	          min = mid + 1;
    	        } else {
    	          max = mid;
    	        }
    	      }

    	      if (max === min && data[min] === id) {
    	        if (retpos) {
    	          return [this.data[min], min];
    	        }
    	        return this.data[min];
    	      }
    	      return null;

    	    };

    	    /**
    	     * Perform binary range lookup for the data[dataPosition][binaryIndexName] property value
    	     *    Since multiple documents may contain the same value (which the index is sorted on),
    	     *    we hone in on range and then linear scan range to find exact index array position.
    	     * @param {int} dataPosition : coll.data array index/position
    	     * @param {string} binaryIndexName : index to search for dataPosition in
    	     */
    	    Collection.prototype.getBinaryIndexPosition = function (dataPosition, binaryIndexName) {
    	      var val = Utils.getIn(this.data[dataPosition], binaryIndexName, true);
    	      var index = this.binaryIndices[binaryIndexName].values;

    	      // i think calculateRange can probably be moved to collection
    	      // as it doesn't seem to need resultset.  need to verify
    	      var range = this.calculateRange("$eq", binaryIndexName, val);

    	      if (range[0] === 0 && range[1] === -1) {
    	        // uhoh didn't find range
    	        return null;
    	      }

    	      var min = range[0];
    	      var max = range[1];

    	      // narrow down the sub-segment of index values
    	      // where the indexed property value exactly matches our
    	      // value and then linear scan to find exact -index- position
    	      for (var idx = min; idx <= max; idx++) {
    	        if (index[idx] === dataPosition) return idx;
    	      }

    	      // uhoh
    	      return null;
    	    };

    	    /**
    	     * Adaptively insert a selected item to the index.
    	     * @param {int} dataPosition : coll.data array index/position
    	     * @param {string} binaryIndexName : index to search for dataPosition in
    	     */
    	    Collection.prototype.adaptiveBinaryIndexInsert = function (dataPosition, binaryIndexName) {
    	      var usingDotNotation = (binaryIndexName.indexOf('.') !== -1);
    	      var index = this.binaryIndices[binaryIndexName].values;
    	      var val = Utils.getIn(this.data[dataPosition], binaryIndexName, usingDotNotation);

    	      // If you are inserting a javascript Date value into a binary index, convert to epoch time
    	      if (this.serializableIndices === true && val instanceof Date) {
    	        this.data[dataPosition][binaryIndexName] = val.getTime();
    	        val = Utils.getIn(this.data[dataPosition], binaryIndexName);
    	      }

    	      var idxPos = (index.length === 0) ? 0 : this.calculateRangeStart(binaryIndexName, val, true, usingDotNotation);

    	      // insert new data index into our binary index at the proper sorted location for relevant property calculated by idxPos.
    	      // doing this after adjusting dataPositions so no clash with previous item at that position.
    	      this.binaryIndices[binaryIndexName].values.splice(idxPos, 0, dataPosition);
    	    };

    	    /**
    	     * Adaptively update a selected item within an index.
    	     * @param {int} dataPosition : coll.data array index/position
    	     * @param {string} binaryIndexName : index to search for dataPosition in
    	     */
    	    Collection.prototype.adaptiveBinaryIndexUpdate = function (dataPosition, binaryIndexName) {
    	      // linear scan needed to find old position within index unless we optimize for clone scenarios later
    	      // within (my) node 5.6.0, the following for() loop with strict compare is -much- faster than indexOf()
    	      var idxPos,
    	        index = this.binaryIndices[binaryIndexName].values,
    	        len = index.length;

    	      for (idxPos = 0; idxPos < len; idxPos++) {
    	        if (index[idxPos] === dataPosition) break;
    	      }

    	      //var idxPos = this.binaryIndices[binaryIndexName].values.indexOf(dataPosition);
    	      this.binaryIndices[binaryIndexName].values.splice(idxPos, 1);

    	      //this.adaptiveBinaryIndexRemove(dataPosition, binaryIndexName, true);
    	      this.adaptiveBinaryIndexInsert(dataPosition, binaryIndexName);
    	    };

    	    /**
    	     * Adaptively remove a selected item from the index.
    	     * @param {number|number[]} dataPosition : coll.data array index/position
    	     * @param {string} binaryIndexName : index to search for dataPosition in
    	     */
    	    Collection.prototype.adaptiveBinaryIndexRemove = function (dataPosition, binaryIndexName, removedFromIndexOnly) {
    	      var bi = this.binaryIndices[binaryIndexName];
    	      var len, idx, rmidx, rmlen, rxo = {};
    	      var curr, shift, idxPos;

    	      if (Array.isArray(dataPosition)) {
    	        // when called from chained remove, and only one document in array,
    	        // it will be faster to use old algorithm
    	        rmlen = dataPosition.length;
    	        if (rmlen === 1) {
    	          dataPosition = dataPosition[0];
    	        }
    	        // we were passed an array (batch) of documents so use this 'batch optimized' algorithm
    	        else {
    	          for (rmidx = 0; rmidx < rmlen; rmidx++) {
    	            rxo[dataPosition[rmidx]] = true;
    	          }

    	          // remove document from index (with filter function)
    	          bi.values = bi.values.filter(function (di) { return !rxo[di]; });

    	          // if we passed this optional flag parameter, we are calling from adaptiveBinaryIndexUpdate,
    	          // in which case data positions stay the same.
    	          if (removedFromIndexOnly === true) {
    	            return;
    	          }

    	          var sortedPositions = dataPosition.slice();
    	          sortedPositions.sort(function (a, b) { return a - b; });

    	          // to remove holes, we need to 'shift down' the index's data array positions
    	          // we need to adjust array positions -1 for each index data positions greater than removed positions
    	          len = bi.values.length;
    	          for (idx = 0; idx < len; idx++) {
    	            curr = bi.values[idx];
    	            shift = 0;
    	            for (rmidx = 0; rmidx < rmlen && curr > sortedPositions[rmidx]; rmidx++) {
    	              shift++;
    	            }
    	            bi.values[idx] -= shift;
    	          }

    	          // batch processed, bail out
    	          return;
    	        }

    	        // not a batch so continue...
    	      }

    	      idxPos = this.getBinaryIndexPosition(dataPosition, binaryIndexName);

    	      if (idxPos === null) {
    	        // throw new Error('unable to determine binary index position');
    	        return null;
    	      }

    	      // remove document from index (with splice)
    	      bi.values.splice(idxPos, 1);

    	      // if we passed this optional flag parameter, we are calling from adaptiveBinaryIndexUpdate,
    	      // in which case data positions stay the same.
    	      if (removedFromIndexOnly === true) {
    	        return;
    	      }

    	      // since index stores data array positions, if we remove a document
    	      // we need to adjust array positions -1 for all document positions greater than removed position
    	      len = bi.values.length;
    	      for (idx = 0; idx < len; idx++) {
    	        if (bi.values[idx] > dataPosition) {
    	          bi.values[idx]--;
    	        }
    	      }
    	    };

    	    /**
    	     * Internal method used for index maintenance and indexed searching.
    	     * Calculates the beginning of an index range for a given value.
    	     * For index maintainance (adaptive:true), we will return a valid index position to insert to.
    	     * For querying (adaptive:false/undefined), we will :
    	     *    return lower bound/index of range of that value (if found)
    	     *    return next lower index position if not found (hole)
    	     * If index is empty it is assumed to be handled at higher level, so
    	     * this method assumes there is at least 1 document in index.
    	     *
    	     * @param {string} prop - name of property which has binary index
    	     * @param {any} val - value to find within index
    	     * @param {bool?} adaptive - if true, we will return insert position
    	     */
    	    Collection.prototype.calculateRangeStart = function (prop, val, adaptive, usingDotNotation) {
    	      var rcd = this.data;
    	      var index = this.binaryIndices[prop].values;
    	      var min = 0;
    	      var max = index.length - 1;
    	      var mid = 0;

    	      if (index.length === 0) {
    	        return -1;
    	      }

    	      Utils.getIn(rcd[index[min]], prop, usingDotNotation);
    	      Utils.getIn(rcd[index[max]], prop, usingDotNotation);

    	      // hone in on start position of value
    	      while (min < max) {
    	        mid = (min + max) >> 1;

    	        if (Comparators.lt(Utils.getIn(rcd[index[mid]], prop, usingDotNotation), val, false)) {
    	          min = mid + 1;
    	        } else {
    	          max = mid;
    	        }
    	      }

    	      var lbound = min;

    	      // found it... return it
    	      if (Comparators.aeq(val, Utils.getIn(rcd[index[lbound]], prop, usingDotNotation))) {
    	        return lbound;
    	      }

    	      // if not in index and our value is less than the found one
    	      if (Comparators.lt(val, Utils.getIn(rcd[index[lbound]], prop, usingDotNotation), false)) {
    	        return adaptive ? lbound : lbound - 1;
    	      }

    	      // not in index and our value is greater than the found one
    	      return adaptive ? lbound + 1 : lbound;
    	    };

    	    /**
    	     * Internal method used for indexed $between.  Given a prop (index name), and a value
    	     * (which may or may not yet exist) this will find the final position of that upper range value.
    	     */
    	    Collection.prototype.calculateRangeEnd = function (prop, val, usingDotNotation) {
    	      var rcd = this.data;
    	      var index = this.binaryIndices[prop].values;
    	      var min = 0;
    	      var max = index.length - 1;
    	      var mid = 0;

    	      if (index.length === 0) {
    	        return -1;
    	      }

    	      Utils.getIn(rcd[index[min]], prop, usingDotNotation);
    	      Utils.getIn(rcd[index[max]], prop, usingDotNotation);

    	      // hone in on start position of value
    	      while (min < max) {
    	        mid = (min + max) >> 1;

    	        if (Comparators.lt(val, Utils.getIn(rcd[index[mid]], prop, usingDotNotation), false)) {
    	          max = mid;
    	        } else {
    	          min = mid + 1;
    	        }
    	      }

    	      var ubound = max;

    	      // only eq if last element in array is our val
    	      if (Comparators.aeq(val, Utils.getIn(rcd[index[ubound]], prop, usingDotNotation))) {
    	        return ubound;
    	      }

    	      // if not in index and our value is less than the found one
    	      if (Comparators.gt(val, Utils.getIn(rcd[index[ubound]], prop, usingDotNotation), false)) {
    	        return ubound + 1;
    	      }

    	      // either hole or first nonmatch
    	      if (Comparators.aeq(val, Utils.getIn(rcd[index[ubound - 1]], prop, usingDotNotation))) {
    	        return ubound - 1;
    	      }

    	      // hole, so ubound if nearest gt than the val we were looking for
    	      return ubound;
    	    };

    	    /**
    	     * calculateRange() - Binary Search utility method to find range/segment of values matching criteria.
    	     *    this is used for collection.find() and first find filter of resultset/dynview
    	     *    slightly different than get() binary search in that get() hones in on 1 value,
    	     *    but we have to hone in on many (range)
    	     * @param {string} op - operation, such as $eq
    	     * @param {string} prop - name of property to calculate range for
    	     * @param {object} val - value to use for range calculation.
    	     * @returns {array} [start, end] index array positions
    	     */
    	    Collection.prototype.calculateRange = function (op, prop, val) {
    	      var rcd = this.data;
    	      var index = this.binaryIndices[prop].values;
    	      var min = 0;
    	      var max = index.length - 1;
    	      var lbound, lval;
    	      var ubound;

    	      // when no documents are in collection, return empty range condition
    	      if (rcd.length === 0) {
    	        return [0, -1];
    	      }

    	      var usingDotNotation = (prop.indexOf('.') !== -1);

    	      var minVal = Utils.getIn(rcd[index[min]], prop, usingDotNotation);
    	      var maxVal = Utils.getIn(rcd[index[max]], prop, usingDotNotation);

    	      // if value falls outside of our range return [0, -1] to designate no results
    	      switch (op) {
    	        case '$eq':
    	        case '$aeq':
    	          if (Comparators.lt(val, minVal, false) || Comparators.gt(val, maxVal, false)) {
    	            return [0, -1];
    	          }
    	          break;
    	        case '$dteq':
    	          if (Comparators.lt(val, minVal, false) || Comparators.gt(val, maxVal, false)) {
    	            return [0, -1];
    	          }
    	          break;
    	        case '$gt':
    	          // none are within range
    	          if (Comparators.gt(val, maxVal, true)) {
    	            return [0, -1];
    	          }
    	          // all are within range
    	          if (Comparators.gt(minVal, val, false)) {
    	            return [min, max];
    	          }
    	          break;
    	        case '$gte':
    	          // none are within range
    	          if (Comparators.gt(val, maxVal, false)) {
    	            return [0, -1];
    	          }
    	          // all are within range
    	          if (Comparators.gt(minVal, val, true)) {
    	            return [min, max];
    	          }
    	          break;
    	        case '$lt':
    	          // none are within range
    	          if (Comparators.lt(val, minVal, true)) {
    	            return [0, -1];
    	          }
    	          // all are within range
    	          if (Comparators.lt(maxVal, val, false)) {
    	            return [min, max];
    	          }
    	          break;
    	        case '$lte':
    	          // none are within range
    	          if (Comparators.lt(val, minVal, false)) {
    	            return [0, -1];
    	          }
    	          // all are within range
    	          if (Comparators.lt(maxVal, val, true)) {
    	            return [min, max];
    	          }
    	          break;
    	        case '$between':
    	          // none are within range (low range is greater)
    	          if (Comparators.gt(val[0], maxVal, false)) {
    	            return [0, -1];
    	          }
    	          // none are within range (high range lower)
    	          if (Comparators.lt(val[1], minVal, false)) {
    	            return [0, -1];
    	          }

    	          lbound = this.calculateRangeStart(prop, val[0], false, usingDotNotation);
    	          ubound = this.calculateRangeEnd(prop, val[1], usingDotNotation);

    	          if (lbound < 0) lbound++;
    	          if (ubound > max) ubound--;

    	          if (!Comparators.gt(Utils.getIn(rcd[index[lbound]], prop, usingDotNotation), val[0], true)) lbound++;
    	          if (!Comparators.lt(Utils.getIn(rcd[index[ubound]], prop, usingDotNotation), val[1], true)) ubound--;

    	          if (ubound < lbound) return [0, -1];

    	          return ([lbound, ubound]);
    	        case '$in':
    	          var idxset = [],
    	            segResult = [];
    	          // query each value '$eq' operator and merge the seqment results.
    	          for (var j = 0, len = val.length; j < len; j++) {
    	            var seg = this.calculateRange('$eq', prop, val[j]);

    	            for (var i = seg[0]; i <= seg[1]; i++) {
    	              if (idxset[i] === undefined) {
    	                idxset[i] = true;
    	                segResult.push(i);
    	              }
    	            }
    	          }
    	          return segResult;
    	      }

    	      // determine lbound where needed
    	      switch (op) {
    	        case '$eq':
    	        case '$aeq':
    	        case '$dteq':
    	        case '$gte':
    	        case '$lt':
    	          lbound = this.calculateRangeStart(prop, val, false, usingDotNotation);
    	          lval = Utils.getIn(rcd[index[lbound]], prop, usingDotNotation);
    	          break;
    	      }

    	      // determine ubound where needed
    	      switch (op) {
    	        case '$eq':
    	        case '$aeq':
    	        case '$dteq':
    	        case '$lte':
    	        case '$gt':
    	          ubound = this.calculateRangeEnd(prop, val, usingDotNotation);
    	          Utils.getIn(rcd[index[ubound]], prop, usingDotNotation);
    	          break;
    	      }


    	      switch (op) {
    	        case '$eq':
    	        case '$aeq':
    	        case '$dteq':
    	          // if hole (not found)
    	          if (!Comparators.aeq(lval, val)) {
    	            return [0, -1];
    	          }

    	          return [lbound, ubound];

    	        case '$gt':
    	          // if hole (not found) ub position is already greater
    	          if (!Comparators.aeq(Utils.getIn(rcd[index[ubound]], prop, usingDotNotation), val)) {
    	            return [ubound, max];
    	          }
    	          // otherwise (found) so ubound is still equal, get next
    	          return [ubound + 1, max];

    	        case '$gte':
    	          // if hole (not found) lb position marks left outside of range
    	          if (!Comparators.aeq(Utils.getIn(rcd[index[lbound]], prop, usingDotNotation), val)) {
    	            return [lbound + 1, max];
    	          }
    	          // otherwise (found) so lb is first position where its equal
    	          return [lbound, max];

    	        case '$lt':
    	          // if hole (not found) position already is less than
    	          if (!Comparators.aeq(Utils.getIn(rcd[index[lbound]], prop, usingDotNotation), val)) {
    	            return [min, lbound];
    	          }
    	          // otherwise (found) so lb marks left inside of eq range, get previous
    	          return [min, lbound - 1];

    	        case '$lte':
    	          // if hole (not found) ub position marks right outside so get previous
    	          if (!Comparators.aeq(Utils.getIn(rcd[index[ubound]], prop, usingDotNotation), val)) {
    	            return [min, ubound - 1];
    	          }
    	          // otherwise (found) so ub is last position where its still equal
    	          return [min, ubound];

    	        default:
    	          return [0, rcd.length - 1];
    	      }
    	    };

    	    /**
    	     * Retrieve doc by Unique index
    	     * @param {string} field - name of uniquely indexed property to use when doing lookup
    	     * @param {value} value - unique value to search for
    	     * @returns {object} document matching the value passed
    	     * @memberof Collection
    	     */
    	    Collection.prototype.by = function (field, value) {
    	      var self;
    	      if (value === undefined) {
    	        self = this;
    	        return function (value) {
    	          return self.by(field, value);
    	        };
    	      }

    	      var result = this.getUniqueIndex(field, true).get(value);
    	      if (!this.cloneObjects) {
    	        return result;
    	      } else {
    	        return clone(result, this.cloneMethod);
    	      }
    	    };

    	    /**
    	     * Find one object by index property, by property equal to value
    	     * @param {object} query - query object used to perform search with
    	     * @returns {(object|null)} First matching document, or null if none
    	     * @memberof Collection
    	     */
    	    Collection.prototype.findOne = function (query) {
    	      query = query || {};

    	      // Instantiate Resultset and exec find op passing firstOnly = true param
    	      var result = this.chain().find(query, true).data();

    	      if (Array.isArray(result) && result.length === 0) {
    	        return null;
    	      } else {
    	        if (!this.cloneObjects) {
    	          return result[0];
    	        } else {
    	          return clone(result[0], this.cloneMethod);
    	        }
    	      }
    	    };

    	    /**
    	     * Chain method, used for beginning a series of chained find() and/or view() operations
    	     * on a collection.
    	     *
    	     * @param {string|array=} transform - named transform or array of transform steps
    	     * @param {object=} parameters - Object containing properties representing parameters to substitute
    	     * @returns {Resultset} (this) resultset, or data array if any map or join functions where called
    	     * @memberof Collection
    	     */
    	    Collection.prototype.chain = function (transform, parameters) {
    	      var rs = new Resultset(this);

    	      if (typeof transform === 'undefined') {
    	        return rs;
    	      }

    	      return rs.transform(transform, parameters);
    	    };

    	    /**
    	     * Find method, api is similar to mongodb.
    	     * for more complex queries use [chain()]{@link Collection#chain} or [where()]{@link Collection#where}.
    	     * @example {@tutorial Query Examples}
    	     * @param {object} query - 'mongo-like' query object
    	     * @returns {array} Array of matching documents
    	     * @memberof Collection
    	     */
    	    Collection.prototype.find = function (query) {
    	      return this.chain().find(query).data();
    	    };

    	    /**
    	     * Find object by unindexed field by property equal to value,
    	     * simply iterates and returns the first element matching the query
    	     */
    	    Collection.prototype.findOneUnindexed = function (prop, value) {
    	      var i = this.data.length,
    	        doc;
    	      while (i--) {
    	        if (Utils.getIn(this.data[i], prop, true) === value) {
    	          doc = this.data[i];
    	          return doc;
    	        }
    	      }
    	      return null;
    	    };

    	    /**
    	     * Transaction methods
    	     */

    	    /** start the transation */
    	    Collection.prototype.startTransaction = function () {
    	      if (this.transactional) {
    	        this.cachedData = clone(this.data, this.cloneMethod);
    	        this.cachedIndex = this.idIndex;
    	        this.cachedBinaryIndex = this.binaryIndices;
    	        this.cachedDirtyIds = this.dirtyIds;

    	        // propagate startTransaction to dynamic views
    	        for (var idx = 0; idx < this.DynamicViews.length; idx++) {
    	          this.DynamicViews[idx].startTransaction();
    	        }
    	      }
    	    };

    	    /** commit the transation */
    	    Collection.prototype.commit = function () {
    	      if (this.transactional) {
    	        this.cachedData = null;
    	        this.cachedIndex = null;
    	        this.cachedBinaryIndex = null;
    	        this.cachedDirtyIds = null;

    	        // propagate commit to dynamic views
    	        for (var idx = 0; idx < this.DynamicViews.length; idx++) {
    	          this.DynamicViews[idx].commit();
    	        }
    	      }
    	    };

    	    /** roll back the transation */
    	    Collection.prototype.rollback = function () {
    	      if (this.transactional) {
    	        if (this.cachedData !== null && this.cachedIndex !== null) {
    	          this.data = this.cachedData;
    	          this.idIndex = this.cachedIndex;
    	          this.binaryIndices = this.cachedBinaryIndex;
    	          this.dirtyIds = this.cachedDirtyIds;
    	        }

    	        // propagate rollback to dynamic views
    	        for (var idx = 0; idx < this.DynamicViews.length; idx++) {
    	          this.DynamicViews[idx].rollback();
    	        }
    	      }
    	    };

    	    // async executor. This is only to enable callbacks at the end of the execution.
    	    Collection.prototype.async = function (fun, callback) {
    	      setTimeout(function () {
    	        if (typeof fun === 'function') {
    	          fun();
    	          callback();
    	        } else {
    	          throw new TypeError('Argument passed for async execution is not a function');
    	        }
    	      }, 0);
    	    };

    	    /**
    	     * Query the collection by supplying a javascript filter function.
    	     * @example
    	     * var results = coll.where(function(obj) {
    	     *   return obj.legs === 8;
    	     * });
    	     *
    	     * @param {function} fun - filter function to run against all collection docs
    	     * @returns {array} all documents which pass your filter function
    	     * @memberof Collection
    	     */
    	    Collection.prototype.where = function (fun) {
    	      return this.chain().where(fun).data();
    	    };

    	    /**
    	     * Map Reduce operation
    	     *
    	     * @param {function} mapFunction - function to use as map function
    	     * @param {function} reduceFunction - function to use as reduce function
    	     * @returns {data} The result of your mapReduce operation
    	     * @memberof Collection
    	     */
    	    Collection.prototype.mapReduce = function (mapFunction, reduceFunction) {
    	      try {
    	        return reduceFunction(this.data.map(mapFunction));
    	      } catch (err) {
    	        throw err;
    	      }
    	    };

    	    /**
    	     * Join two collections on specified properties
    	     *
    	     * @param {array|Resultset|Collection} joinData - array of documents to 'join' to this collection
    	     * @param {string} leftJoinProp - property name in collection
    	     * @param {string} rightJoinProp - property name in joinData
    	     * @param {function=} mapFun - (Optional) map function to use
    	     * @param {object=} dataOptions - options to data() before input to your map function
    	     * @param {bool} dataOptions.removeMeta - allows removing meta before calling mapFun
    	     * @param {boolean} dataOptions.forceClones - forcing the return of cloned objects to your map object
    	     * @param {string} dataOptions.forceCloneMethod - Allows overriding the default or collection specified cloning method.
    	     * @returns {Resultset} Result of the mapping operation
    	     * @memberof Collection
    	     */
    	    Collection.prototype.eqJoin = function (joinData, leftJoinProp, rightJoinProp, mapFun, dataOptions) {
    	      // logic in Resultset class
    	      return new Resultset(this).eqJoin(joinData, leftJoinProp, rightJoinProp, mapFun, dataOptions);
    	    };

    	    /* ------ STAGING API -------- */
    	    /**
    	     * stages: a map of uniquely identified 'stages', which hold copies of objects to be
    	     * manipulated without affecting the data in the original collection
    	     */
    	    Collection.prototype.stages = {};

    	    /**
    	     * (Staging API) create a stage and/or retrieve it
    	     * @memberof Collection
    	     */
    	    Collection.prototype.getStage = function (name) {
    	      if (!this.stages[name]) {
    	        this.stages[name] = {};
    	      }
    	      return this.stages[name];
    	    };
    	    /**
    	     * a collection of objects recording the changes applied through a commmitStage
    	     */
    	    Collection.prototype.commitLog = [];

    	    /**
    	     * (Staging API) create a copy of an object and insert it into a stage
    	     * @memberof Collection
    	     */
    	    Collection.prototype.stage = function (stageName, obj) {
    	      var copy = JSON.parse(JSON.stringify(obj));
    	      this.getStage(stageName)[obj.$loki] = copy;
    	      return copy;
    	    };

    	    /**
    	     * (Staging API) re-attach all objects to the original collection, so indexes and views can be rebuilt
    	     * then create a message to be inserted in the commitlog
    	     * @param {string} stageName - name of stage
    	     * @param {string} message
    	     * @memberof Collection
    	     */
    	    Collection.prototype.commitStage = function (stageName, message) {
    	      var stage = this.getStage(stageName),
    	        prop,
    	        timestamp = new Date().getTime();

    	      for (prop in stage) {

    	        this.update(stage[prop]);
    	        this.commitLog.push({
    	          timestamp: timestamp,
    	          message: message,
    	          data: JSON.parse(JSON.stringify(stage[prop]))
    	        });
    	      }
    	      this.stages[stageName] = {};
    	    };

    	    Collection.prototype.no_op = function () {
    	      return;
    	    };

    	    /**
    	     * @memberof Collection
    	     */
    	    Collection.prototype.extract = function (field) {
    	      var i = 0,
    	        len = this.data.length,
    	        isDotNotation = isDeepProperty(field),
    	        result = [];
    	      for (i; i < len; i += 1) {
    	        result.push(deepProperty(this.data[i], field, isDotNotation));
    	      }
    	      return result;
    	    };

    	    /**
    	     * @memberof Collection
    	     */
    	    Collection.prototype.max = function (field) {
    	      return Math.max.apply(null, this.extract(field));
    	    };

    	    /**
    	     * @memberof Collection
    	     */
    	    Collection.prototype.min = function (field) {
    	      return Math.min.apply(null, this.extract(field));
    	    };

    	    /**
    	     * @memberof Collection
    	     */
    	    Collection.prototype.maxRecord = function (field) {
    	      var i = 0,
    	        len = this.data.length,
    	        deep = isDeepProperty(field),
    	        result = {
    	          index: 0,
    	          value: undefined
    	        },
    	        max;

    	      for (i; i < len; i += 1) {
    	        if (max !== undefined) {
    	          if (max < deepProperty(this.data[i], field, deep)) {
    	            max = deepProperty(this.data[i], field, deep);
    	            result.index = this.data[i].$loki;
    	          }
    	        } else {
    	          max = deepProperty(this.data[i], field, deep);
    	          result.index = this.data[i].$loki;
    	        }
    	      }
    	      result.value = max;
    	      return result;
    	    };

    	    /**
    	     * @memberof Collection
    	     */
    	    Collection.prototype.minRecord = function (field) {
    	      var i = 0,
    	        len = this.data.length,
    	        deep = isDeepProperty(field),
    	        result = {
    	          index: 0,
    	          value: undefined
    	        },
    	        min;

    	      for (i; i < len; i += 1) {
    	        if (min !== undefined) {
    	          if (min > deepProperty(this.data[i], field, deep)) {
    	            min = deepProperty(this.data[i], field, deep);
    	            result.index = this.data[i].$loki;
    	          }
    	        } else {
    	          min = deepProperty(this.data[i], field, deep);
    	          result.index = this.data[i].$loki;
    	        }
    	      }
    	      result.value = min;
    	      return result;
    	    };

    	    /**
    	     * @memberof Collection
    	     */
    	    Collection.prototype.extractNumerical = function (field) {
    	      return this.extract(field).map(parseBase10).filter(Number).filter(function (n) {
    	        return !(isNaN(n));
    	      });
    	    };

    	    /**
    	     * Calculates the average numerical value of a property
    	     *
    	     * @param {string} field - name of property in docs to average
    	     * @returns {number} average of property in all docs in the collection
    	     * @memberof Collection
    	     */
    	    Collection.prototype.avg = function (field) {
    	      return average(this.extractNumerical(field));
    	    };

    	    /**
    	     * Calculate standard deviation of a field
    	     * @memberof Collection
    	     * @param {string} field
    	     */
    	    Collection.prototype.stdDev = function (field) {
    	      return standardDeviation(this.extractNumerical(field));
    	    };

    	    /**
    	     * @memberof Collection
    	     * @param {string} field
    	     */
    	    Collection.prototype.mode = function (field) {
    	      var dict = {},
    	        data = this.extract(field);
    	      data.forEach(function (obj) {
    	        if (dict[obj]) {
    	          dict[obj] += 1;
    	        } else {
    	          dict[obj] = 1;
    	        }
    	      });
    	      var max,
    	        prop, mode;
    	      for (prop in dict) {
    	        if (max) {
    	          if (max < dict[prop]) {
    	            mode = prop;
    	          }
    	        } else {
    	          mode = prop;
    	          max = dict[prop];
    	        }
    	      }
    	      return mode;
    	    };

    	    /**
    	     * @memberof Collection
    	     * @param {string} field - property name
    	     */
    	    Collection.prototype.median = function (field) {
    	      var values = this.extractNumerical(field);
    	      values.sort(sub);

    	      var half = Math.floor(values.length / 2);

    	      if (values.length % 2) {
    	        return values[half];
    	      } else {
    	        return (values[half - 1] + values[half]) / 2.0;
    	      }
    	    };

    	    /**
    	     * General utils, including statistical functions
    	     */
    	    function isDeepProperty(field) {
    	      return field.indexOf('.') !== -1;
    	    }

    	    function parseBase10(num) {
    	      return parseFloat(num, 10);
    	    }

    	    function add(a, b) {
    	      return a + b;
    	    }

    	    function sub(a, b) {
    	      return a - b;
    	    }

    	    function average(array) {
    	      return (array.reduce(add, 0)) / array.length;
    	    }

    	    function standardDeviation(values) {
    	      var avg = average(values);
    	      var squareDiffs = values.map(function (value) {
    	        var diff = value - avg;
    	        var sqrDiff = diff * diff;
    	        return sqrDiff;
    	      });

    	      var avgSquareDiff = average(squareDiffs);

    	      var stdDev = Math.sqrt(avgSquareDiff);
    	      return stdDev;
    	    }

    	    function deepProperty(obj, property, isDeep) {
    	      if (isDeep === false) {
    	        // pass without processing
    	        return obj[property];
    	      }
    	      var pieces = property.split('.'),
    	        root = obj;
    	      while (pieces.length > 0) {
    	        root = root[pieces.shift()];
    	      }
    	      return root;
    	    }

    	    function binarySearch(array, item, fun) {
    	      var lo = 0,
    	        hi = array.length,
    	        compared,
    	        mid;
    	      while (lo < hi) {
    	        mid = (lo + hi) >> 1;
    	        compared = fun.apply(null, [item, array[mid]]);
    	        if (compared === 0) {
    	          return {
    	            found: true,
    	            index: mid
    	          };
    	        } else if (compared < 0) {
    	          hi = mid;
    	        } else {
    	          lo = mid + 1;
    	        }
    	      }
    	      return {
    	        found: false,
    	        index: hi
    	      };
    	    }

    	    function BSonSort(fun) {
    	      return function (array, item) {
    	        return binarySearch(array, item, fun);
    	      };
    	    }

    	    function KeyValueStore() { }

    	    KeyValueStore.prototype = {
    	      keys: [],
    	      values: [],
    	      sort: function (a, b) {
    	        return (a < b) ? -1 : ((a > b) ? 1 : 0);
    	      },
    	      setSort: function (fun) {
    	        this.bs = new BSonSort(fun);
    	      },
    	      bs: function () {
    	        return new BSonSort(this.sort);
    	      },
    	      set: function (key, value) {
    	        var pos = this.bs(this.keys, key);
    	        if (pos.found) {
    	          this.values[pos.index] = value;
    	        } else {
    	          this.keys.splice(pos.index, 0, key);
    	          this.values.splice(pos.index, 0, value);
    	        }
    	      },
    	      get: function (key) {
    	        return this.values[binarySearch(this.keys, key, this.sort).index];
    	      }
    	    };

    	    function UniqueIndex(uniqueField) {
    	      this.field = uniqueField;
    	      this.keyMap = Object.create(null);
    	      this.lokiMap = Object.create(null);
    	    }
    	    UniqueIndex.prototype.keyMap = {};
    	    UniqueIndex.prototype.lokiMap = {};
    	    UniqueIndex.prototype.set = function (obj) {
    	      var fieldValue = obj[this.field];
    	      if (fieldValue !== null && typeof (fieldValue) !== 'undefined') {
    	        if (this.keyMap[fieldValue]) {
    	          throw new Error('Duplicate key for property ' + this.field + ': ' + fieldValue);
    	        } else {
    	          this.keyMap[fieldValue] = obj;
    	          this.lokiMap[obj.$loki] = fieldValue;
    	        }
    	      }
    	    };
    	    UniqueIndex.prototype.get = function (key) {
    	      return this.keyMap[key];
    	    };

    	    UniqueIndex.prototype.byId = function (id) {
    	      return this.keyMap[this.lokiMap[id]];
    	    };
    	    /**
    	     * Updates a document's unique index given an updated object.
    	     * @param  {Object} obj Original document object
    	     * @param  {Object} doc New document object (likely the same as obj)
    	     */
    	    UniqueIndex.prototype.update = function (obj, doc) {
    	      if (this.lokiMap[obj.$loki] !== doc[this.field]) {
    	        var old = this.lokiMap[obj.$loki];
    	        this.set(doc);
    	        // make the old key fail bool test, while avoiding the use of delete (mem-leak prone)
    	        this.keyMap[old] = undefined;
    	      } else {
    	        this.keyMap[obj[this.field]] = doc;
    	      }
    	    };
    	    UniqueIndex.prototype.remove = function (key) {
    	      var obj = this.keyMap[key];
    	      if (obj !== null && typeof obj !== 'undefined') {
    	        // avoid using `delete`
    	        this.keyMap[key] = undefined;
    	        this.lokiMap[obj.$loki] = undefined;
    	      } else {
    	        throw new Error('Key is not in unique index: ' + this.field);
    	      }
    	    };
    	    UniqueIndex.prototype.clear = function () {
    	      this.keyMap = Object.create(null);
    	      this.lokiMap = Object.create(null);
    	    };

    	    function ExactIndex(exactField) {
    	      this.index = Object.create(null);
    	      this.field = exactField;
    	    }

    	    // add the value you want returned to the key in the index
    	    ExactIndex.prototype = {
    	      set: function add(key, val) {
    	        if (this.index[key]) {
    	          this.index[key].push(val);
    	        } else {
    	          this.index[key] = [val];
    	        }
    	      },

    	      // remove the value from the index, if the value was the last one, remove the key
    	      remove: function remove(key, val) {
    	        var idxSet = this.index[key];
    	        for (var i in idxSet) {
    	          if (idxSet[i] == val) {
    	            idxSet.splice(i, 1);
    	          }
    	        }
    	        if (idxSet.length < 1) {
    	          this.index[key] = undefined;
    	        }
    	      },

    	      // get the values related to the key, could be more than one
    	      get: function get(key) {
    	        return this.index[key];
    	      },

    	      // clear will zap the index
    	      clear: function clear(key) {
    	        this.index = {};
    	      }
    	    };

    	    Loki.deepFreeze = deepFreeze;
    	    Loki.freeze = freeze;
    	    Loki.unFreeze = unFreeze;
    	    Loki.LokiOps = LokiOps;
    	    Loki.Collection = Collection;
    	    Loki.DynamicView = DynamicView;
    	    Loki.Resultset = Resultset;
    	    Loki.KeyValueStore = KeyValueStore;
    	    Loki.LokiMemoryAdapter = LokiMemoryAdapter;
    	    Loki.LokiPartitioningAdapter = LokiPartitioningAdapter;
    	    Loki.LokiLocalStorageAdapter = LokiLocalStorageAdapter;
    	    Loki.LokiFsAdapter = LokiFsAdapter;
    	    Loki.persistenceAdapters = {
    	      fs: LokiFsAdapter,
    	      localStorage: LokiLocalStorageAdapter
    	    };
    	    Loki.aeq = aeqHelper;
    	    Loki.lt = ltHelper;
    	    Loki.gt = gtHelper;
    	    Loki.Comparators = Comparators;
    	    return Loki;
    	  }());

    	})); 
    } (lokijs));

    var lokijsExports = lokijs.exports;
    var Loki = /*@__PURE__*/getDefaultExportFromCjs(lokijsExports);

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=} start
     */
    function writable(value, start = noop$1) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop$1) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop$1;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0 && stop) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    let adsCollection = 0;
    let ads = [];
    let adsStore = writable(ads);
    let adsCollectionStore = writable(adsCollection);

    /*! https://mths.be/punycode v1.4.1 by @mathias */


    /** Highest positive signed 32-bit float value */
    var maxInt = 2147483647; // aka. 0x7FFFFFFF or 2^31-1

    /** Bootstring parameters */
    var base = 36;
    var tMin = 1;
    var tMax = 26;
    var skew = 38;
    var damp = 700;
    var initialBias = 72;
    var initialN = 128; // 0x80
    var delimiter$1 = '-'; // '\x2D'
    var regexNonASCII = /[^\x20-\x7E]/; // unprintable ASCII chars + non-ASCII chars
    var regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g; // RFC 3490 separators

    /** Error messages */
    var errors = {
      'overflow': 'Overflow: input needs wider integers to process',
      'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
      'invalid-input': 'Invalid input'
    };

    /** Convenience shortcuts */
    var baseMinusTMin = base - tMin;
    var floor = Math.floor;
    var stringFromCharCode = String.fromCharCode;

    /*--------------------------------------------------------------------------*/

    /**
     * A generic error utility function.
     * @private
     * @param {String} type The error type.
     * @returns {Error} Throws a `RangeError` with the applicable error message.
     */
    function error(type) {
      throw new RangeError(errors[type]);
    }

    /**
     * A generic `Array#map` utility function.
     * @private
     * @param {Array} array The array to iterate over.
     * @param {Function} callback The function that gets called for every array
     * item.
     * @returns {Array} A new array of values returned by the callback function.
     */
    function map$1(array, fn) {
      var length = array.length;
      var result = [];
      while (length--) {
        result[length] = fn(array[length]);
      }
      return result;
    }

    /**
     * A simple `Array#map`-like wrapper to work with domain name strings or email
     * addresses.
     * @private
     * @param {String} domain The domain name or email address.
     * @param {Function} callback The function that gets called for every
     * character.
     * @returns {Array} A new string of characters returned by the callback
     * function.
     */
    function mapDomain(string, fn) {
      var parts = string.split('@');
      var result = '';
      if (parts.length > 1) {
        // In email addresses, only the domain name should be punycoded. Leave
        // the local part (i.e. everything up to `@`) intact.
        result = parts[0] + '@';
        string = parts[1];
      }
      // Avoid `split(regex)` for IE8 compatibility. See #17.
      string = string.replace(regexSeparators, '\x2E');
      var labels = string.split('.');
      var encoded = map$1(labels, fn).join('.');
      return result + encoded;
    }

    /**
     * Creates an array containing the numeric code points of each Unicode
     * character in the string. While JavaScript uses UCS-2 internally,
     * this function will convert a pair of surrogate halves (each of which
     * UCS-2 exposes as separate characters) into a single code point,
     * matching UTF-16.
     * @see `punycode.ucs2.encode`
     * @see <https://mathiasbynens.be/notes/javascript-encoding>
     * @memberOf punycode.ucs2
     * @name decode
     * @param {String} string The Unicode input string (UCS-2).
     * @returns {Array} The new array of code points.
     */
    function ucs2decode(string) {
      var output = [],
        counter = 0,
        length = string.length,
        value,
        extra;
      while (counter < length) {
        value = string.charCodeAt(counter++);
        if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
          // high surrogate, and there is a next character
          extra = string.charCodeAt(counter++);
          if ((extra & 0xFC00) == 0xDC00) { // low surrogate
            output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
          } else {
            // unmatched surrogate; only append this code unit, in case the next
            // code unit is the high surrogate of a surrogate pair
            output.push(value);
            counter--;
          }
        } else {
          output.push(value);
        }
      }
      return output;
    }

    /**
     * Converts a digit/integer into a basic code point.
     * @see `basicToDigit()`
     * @private
     * @param {Number} digit The numeric value of a basic code point.
     * @returns {Number} The basic code point whose value (when used for
     * representing integers) is `digit`, which needs to be in the range
     * `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
     * used; else, the lowercase form is used. The behavior is undefined
     * if `flag` is non-zero and `digit` has no uppercase form.
     */
    function digitToBasic(digit, flag) {
      //  0..25 map to ASCII a..z or A..Z
      // 26..35 map to ASCII 0..9
      return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
    }

    /**
     * Bias adaptation function as per section 3.4 of RFC 3492.
     * https://tools.ietf.org/html/rfc3492#section-3.4
     * @private
     */
    function adapt(delta, numPoints, firstTime) {
      var k = 0;
      delta = firstTime ? floor(delta / damp) : delta >> 1;
      delta += floor(delta / numPoints);
      for ( /* no initialization */ ; delta > baseMinusTMin * tMax >> 1; k += base) {
        delta = floor(delta / baseMinusTMin);
      }
      return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
    }

    /**
     * Converts a string of Unicode symbols (e.g. a domain name label) to a
     * Punycode string of ASCII-only symbols.
     * @memberOf punycode
     * @param {String} input The string of Unicode symbols.
     * @returns {String} The resulting Punycode string of ASCII-only symbols.
     */
    function encode(input) {
      var n,
        delta,
        handledCPCount,
        basicLength,
        bias,
        j,
        m,
        q,
        k,
        t,
        currentValue,
        output = [],
        /** `inputLength` will hold the number of code points in `input`. */
        inputLength,
        /** Cached calculation results */
        handledCPCountPlusOne,
        baseMinusT,
        qMinusT;

      // Convert the input in UCS-2 to Unicode
      input = ucs2decode(input);

      // Cache the length
      inputLength = input.length;

      // Initialize the state
      n = initialN;
      delta = 0;
      bias = initialBias;

      // Handle the basic code points
      for (j = 0; j < inputLength; ++j) {
        currentValue = input[j];
        if (currentValue < 0x80) {
          output.push(stringFromCharCode(currentValue));
        }
      }

      handledCPCount = basicLength = output.length;

      // `handledCPCount` is the number of code points that have been handled;
      // `basicLength` is the number of basic code points.

      // Finish the basic string - if it is not empty - with a delimiter
      if (basicLength) {
        output.push(delimiter$1);
      }

      // Main encoding loop:
      while (handledCPCount < inputLength) {

        // All non-basic code points < n have been handled already. Find the next
        // larger one:
        for (m = maxInt, j = 0; j < inputLength; ++j) {
          currentValue = input[j];
          if (currentValue >= n && currentValue < m) {
            m = currentValue;
          }
        }

        // Increase `delta` enough to advance the decoder's <n,i> state to <m,0>,
        // but guard against overflow
        handledCPCountPlusOne = handledCPCount + 1;
        if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
          error('overflow');
        }

        delta += (m - n) * handledCPCountPlusOne;
        n = m;

        for (j = 0; j < inputLength; ++j) {
          currentValue = input[j];

          if (currentValue < n && ++delta > maxInt) {
            error('overflow');
          }

          if (currentValue == n) {
            // Represent delta as a generalized variable-length integer
            for (q = delta, k = base; /* no condition */ ; k += base) {
              t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
              if (q < t) {
                break;
              }
              qMinusT = q - t;
              baseMinusT = base - t;
              output.push(
                stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0))
              );
              q = floor(qMinusT / baseMinusT);
            }

            output.push(stringFromCharCode(digitToBasic(q, 0)));
            bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
            delta = 0;
            ++handledCPCount;
          }
        }

        ++delta;
        ++n;

      }
      return output.join('');
    }

    /**
     * Converts a Unicode string representing a domain name or an email address to
     * Punycode. Only the non-ASCII parts of the domain name will be converted,
     * i.e. it doesn't matter if you call it with a domain that's already in
     * ASCII.
     * @memberOf punycode
     * @param {String} input The domain name or email address to convert, as a
     * Unicode string.
     * @returns {String} The Punycode representation of the given domain name or
     * email address.
     */
    function toASCII(input) {
      return mapDomain(input, function(string) {
        return regexNonASCII.test(string) ?
          'xn--' + encode(string) :
          string;
      });
    }

    function isNull(arg) {
      return arg === null;
    }

    function isNullOrUndefined(arg) {
      return arg == null;
    }

    function isString(arg) {
      return typeof arg === 'string';
    }

    function isObject(arg) {
      return typeof arg === 'object' && arg !== null;
    }

    // Copyright Joyent, Inc. and other Node contributors.
    //
    // Permission is hereby granted, free of charge, to any person obtaining a
    // copy of this software and associated documentation files (the
    // "Software"), to deal in the Software without restriction, including
    // without limitation the rights to use, copy, modify, merge, publish,
    // distribute, sublicense, and/or sell copies of the Software, and to permit
    // persons to whom the Software is furnished to do so, subject to the
    // following conditions:
    //
    // The above copyright notice and this permission notice shall be included
    // in all copies or substantial portions of the Software.
    //
    // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
    // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
    // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
    // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
    // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
    // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
    // USE OR OTHER DEALINGS IN THE SOFTWARE.


    // If obj.hasOwnProperty has been overridden, then calling
    // obj.hasOwnProperty(prop) will break.
    // See: https://github.com/joyent/node/issues/1707
    function hasOwnProperty(obj, prop) {
      return Object.prototype.hasOwnProperty.call(obj, prop);
    }
    var isArray = Array.isArray || function (xs) {
      return Object.prototype.toString.call(xs) === '[object Array]';
    };
    function stringifyPrimitive(v) {
      switch (typeof v) {
        case 'string':
          return v;

        case 'boolean':
          return v ? 'true' : 'false';

        case 'number':
          return isFinite(v) ? v : '';

        default:
          return '';
      }
    }

    function stringify (obj, sep, eq, name) {
      sep = sep || '&';
      eq = eq || '=';
      if (obj === null) {
        obj = undefined;
      }

      if (typeof obj === 'object') {
        return map(objectKeys(obj), function(k) {
          var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
          if (isArray(obj[k])) {
            return map(obj[k], function(v) {
              return ks + encodeURIComponent(stringifyPrimitive(v));
            }).join(sep);
          } else {
            return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
          }
        }).join(sep);

      }

      if (!name) return '';
      return encodeURIComponent(stringifyPrimitive(name)) + eq +
             encodeURIComponent(stringifyPrimitive(obj));
    }
    function map (xs, f) {
      if (xs.map) return xs.map(f);
      var res = [];
      for (var i = 0; i < xs.length; i++) {
        res.push(f(xs[i], i));
      }
      return res;
    }

    var objectKeys = Object.keys || function (obj) {
      var res = [];
      for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) res.push(key);
      }
      return res;
    };

    function parse$1(qs, sep, eq, options) {
      sep = sep || '&';
      eq = eq || '=';
      var obj = {};

      if (typeof qs !== 'string' || qs.length === 0) {
        return obj;
      }

      var regexp = /\+/g;
      qs = qs.split(sep);

      var maxKeys = 1000;
      if (options && typeof options.maxKeys === 'number') {
        maxKeys = options.maxKeys;
      }

      var len = qs.length;
      // maxKeys <= 0 means that we should not limit keys count
      if (maxKeys > 0 && len > maxKeys) {
        len = maxKeys;
      }

      for (var i = 0; i < len; ++i) {
        var x = qs[i].replace(regexp, '%20'),
            idx = x.indexOf(eq),
            kstr, vstr, k, v;

        if (idx >= 0) {
          kstr = x.substr(0, idx);
          vstr = x.substr(idx + 1);
        } else {
          kstr = x;
          vstr = '';
        }

        k = decodeURIComponent(kstr);
        v = decodeURIComponent(vstr);

        if (!hasOwnProperty(obj, k)) {
          obj[k] = v;
        } else if (isArray(obj[k])) {
          obj[k].push(v);
        } else {
          obj[k] = [obj[k], v];
        }
      }

      return obj;
    }

    function Url() {
      this.protocol = null;
      this.slashes = null;
      this.auth = null;
      this.host = null;
      this.port = null;
      this.hostname = null;
      this.hash = null;
      this.search = null;
      this.query = null;
      this.pathname = null;
      this.path = null;
      this.href = null;
    }

    // Reference: RFC 3986, RFC 1808, RFC 2396

    // define these here so at least they only have to be
    // compiled once on the first module load.
    var protocolPattern = /^([a-z0-9.+-]+:)/i,
      portPattern = /:[0-9]*$/,

      // Special case for a simple path URL
      simplePathPattern = /^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/,

      // RFC 2396: characters reserved for delimiting URLs.
      // We actually just auto-escape these.
      delims = ['<', '>', '"', '`', ' ', '\r', '\n', '\t'],

      // RFC 2396: characters not allowed for various reasons.
      unwise = ['{', '}', '|', '\\', '^', '`'].concat(delims),

      // Allowed by RFCs, but cause of XSS attacks.  Always escape these.
      autoEscape = ['\''].concat(unwise),
      // Characters that are never ever allowed in a hostname.
      // Note that any invalid chars are also handled, but these
      // are the ones that are *expected* to be seen, so we fast-path
      // them.
      nonHostChars = ['%', '/', '?', ';', '#'].concat(autoEscape),
      hostEndingChars = ['/', '?', '#'],
      hostnameMaxLen = 255,
      hostnamePartPattern = /^[+a-z0-9A-Z_-]{0,63}$/,
      hostnamePartStart = /^([+a-z0-9A-Z_-]{0,63})(.*)$/,
      // protocols that can allow "unsafe" and "unwise" chars.
      unsafeProtocol = {
        'javascript': true,
        'javascript:': true
      },
      // protocols that never have a hostname.
      hostlessProtocol = {
        'javascript': true,
        'javascript:': true
      },
      // protocols that always contain a // bit.
      slashedProtocol = {
        'http': true,
        'https': true,
        'ftp': true,
        'gopher': true,
        'file': true,
        'http:': true,
        'https:': true,
        'ftp:': true,
        'gopher:': true,
        'file:': true
      };

    function urlParse(url, parseQueryString, slashesDenoteHost) {
      if (url && isObject(url) && url instanceof Url) return url;

      var u = new Url;
      u.parse(url, parseQueryString, slashesDenoteHost);
      return u;
    }
    Url.prototype.parse = function(url, parseQueryString, slashesDenoteHost) {
      return parse(this, url, parseQueryString, slashesDenoteHost);
    };

    function parse(self, url, parseQueryString, slashesDenoteHost) {
      if (!isString(url)) {
        throw new TypeError('Parameter \'url\' must be a string, not ' + typeof url);
      }

      // Copy chrome, IE, opera backslash-handling behavior.
      // Back slashes before the query string get converted to forward slashes
      // See: https://code.google.com/p/chromium/issues/detail?id=25916
      var queryIndex = url.indexOf('?'),
        splitter =
        (queryIndex !== -1 && queryIndex < url.indexOf('#')) ? '?' : '#',
        uSplit = url.split(splitter),
        slashRegex = /\\/g;
      uSplit[0] = uSplit[0].replace(slashRegex, '/');
      url = uSplit.join(splitter);

      var rest = url;

      // trim before proceeding.
      // This is to support parse stuff like "  http://foo.com  \n"
      rest = rest.trim();

      if (!slashesDenoteHost && url.split('#').length === 1) {
        // Try fast path regexp
        var simplePath = simplePathPattern.exec(rest);
        if (simplePath) {
          self.path = rest;
          self.href = rest;
          self.pathname = simplePath[1];
          if (simplePath[2]) {
            self.search = simplePath[2];
            if (parseQueryString) {
              self.query = parse$1(self.search.substr(1));
            } else {
              self.query = self.search.substr(1);
            }
          } else if (parseQueryString) {
            self.search = '';
            self.query = {};
          }
          return self;
        }
      }

      var proto = protocolPattern.exec(rest);
      if (proto) {
        proto = proto[0];
        var lowerProto = proto.toLowerCase();
        self.protocol = lowerProto;
        rest = rest.substr(proto.length);
      }

      // figure out if it's got a host
      // user@server is *always* interpreted as a hostname, and url
      // resolution will treat //foo/bar as host=foo,path=bar because that's
      // how the browser resolves relative URLs.
      if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
        var slashes = rest.substr(0, 2) === '//';
        if (slashes && !(proto && hostlessProtocol[proto])) {
          rest = rest.substr(2);
          self.slashes = true;
        }
      }
      var i, hec, l, p;
      if (!hostlessProtocol[proto] &&
        (slashes || (proto && !slashedProtocol[proto]))) {

        // there's a hostname.
        // the first instance of /, ?, ;, or # ends the host.
        //
        // If there is an @ in the hostname, then non-host chars *are* allowed
        // to the left of the last @ sign, unless some host-ending character
        // comes *before* the @-sign.
        // URLs are obnoxious.
        //
        // ex:
        // http://a@b@c/ => user:a@b host:c
        // http://a@b?@c => user:a host:c path:/?@c

        // v0.12 TODO(isaacs): This is not quite how Chrome does things.
        // Review our test case against browsers more comprehensively.

        // find the first instance of any hostEndingChars
        var hostEnd = -1;
        for (i = 0; i < hostEndingChars.length; i++) {
          hec = rest.indexOf(hostEndingChars[i]);
          if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
            hostEnd = hec;
        }

        // at this point, either we have an explicit point where the
        // auth portion cannot go past, or the last @ char is the decider.
        var auth, atSign;
        if (hostEnd === -1) {
          // atSign can be anywhere.
          atSign = rest.lastIndexOf('@');
        } else {
          // atSign must be in auth portion.
          // http://a@b/c@d => host:b auth:a path:/c@d
          atSign = rest.lastIndexOf('@', hostEnd);
        }

        // Now we have a portion which is definitely the auth.
        // Pull that off.
        if (atSign !== -1) {
          auth = rest.slice(0, atSign);
          rest = rest.slice(atSign + 1);
          self.auth = decodeURIComponent(auth);
        }

        // the host is the remaining to the left of the first non-host char
        hostEnd = -1;
        for (i = 0; i < nonHostChars.length; i++) {
          hec = rest.indexOf(nonHostChars[i]);
          if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
            hostEnd = hec;
        }
        // if we still have not hit it, then the entire thing is a host.
        if (hostEnd === -1)
          hostEnd = rest.length;

        self.host = rest.slice(0, hostEnd);
        rest = rest.slice(hostEnd);

        // pull out port.
        parseHost(self);

        // we've indicated that there is a hostname,
        // so even if it's empty, it has to be present.
        self.hostname = self.hostname || '';

        // if hostname begins with [ and ends with ]
        // assume that it's an IPv6 address.
        var ipv6Hostname = self.hostname[0] === '[' &&
          self.hostname[self.hostname.length - 1] === ']';

        // validate a little.
        if (!ipv6Hostname) {
          var hostparts = self.hostname.split(/\./);
          for (i = 0, l = hostparts.length; i < l; i++) {
            var part = hostparts[i];
            if (!part) continue;
            if (!part.match(hostnamePartPattern)) {
              var newpart = '';
              for (var j = 0, k = part.length; j < k; j++) {
                if (part.charCodeAt(j) > 127) {
                  // we replace non-ASCII char with a temporary placeholder
                  // we need this to make sure size of hostname is not
                  // broken by replacing non-ASCII by nothing
                  newpart += 'x';
                } else {
                  newpart += part[j];
                }
              }
              // we test again with ASCII char only
              if (!newpart.match(hostnamePartPattern)) {
                var validParts = hostparts.slice(0, i);
                var notHost = hostparts.slice(i + 1);
                var bit = part.match(hostnamePartStart);
                if (bit) {
                  validParts.push(bit[1]);
                  notHost.unshift(bit[2]);
                }
                if (notHost.length) {
                  rest = '/' + notHost.join('.') + rest;
                }
                self.hostname = validParts.join('.');
                break;
              }
            }
          }
        }

        if (self.hostname.length > hostnameMaxLen) {
          self.hostname = '';
        } else {
          // hostnames are always lower case.
          self.hostname = self.hostname.toLowerCase();
        }

        if (!ipv6Hostname) {
          // IDNA Support: Returns a punycoded representation of "domain".
          // It only converts parts of the domain name that
          // have non-ASCII characters, i.e. it doesn't matter if
          // you call it with a domain that already is ASCII-only.
          self.hostname = toASCII(self.hostname);
        }

        p = self.port ? ':' + self.port : '';
        var h = self.hostname || '';
        self.host = h + p;
        self.href += self.host;

        // strip [ and ] from the hostname
        // the host field still retains them, though
        if (ipv6Hostname) {
          self.hostname = self.hostname.substr(1, self.hostname.length - 2);
          if (rest[0] !== '/') {
            rest = '/' + rest;
          }
        }
      }

      // now rest is set to the post-host stuff.
      // chop off any delim chars.
      if (!unsafeProtocol[lowerProto]) {

        // First, make 100% sure that any "autoEscape" chars get
        // escaped, even if encodeURIComponent doesn't think they
        // need to be.
        for (i = 0, l = autoEscape.length; i < l; i++) {
          var ae = autoEscape[i];
          if (rest.indexOf(ae) === -1)
            continue;
          var esc = encodeURIComponent(ae);
          if (esc === ae) {
            esc = escape(ae);
          }
          rest = rest.split(ae).join(esc);
        }
      }


      // chop off from the tail first.
      var hash = rest.indexOf('#');
      if (hash !== -1) {
        // got a fragment string.
        self.hash = rest.substr(hash);
        rest = rest.slice(0, hash);
      }
      var qm = rest.indexOf('?');
      if (qm !== -1) {
        self.search = rest.substr(qm);
        self.query = rest.substr(qm + 1);
        if (parseQueryString) {
          self.query = parse$1(self.query);
        }
        rest = rest.slice(0, qm);
      } else if (parseQueryString) {
        // no query string, but parseQueryString still requested
        self.search = '';
        self.query = {};
      }
      if (rest) self.pathname = rest;
      if (slashedProtocol[lowerProto] &&
        self.hostname && !self.pathname) {
        self.pathname = '/';
      }

      //to support http.request
      if (self.pathname || self.search) {
        p = self.pathname || '';
        var s = self.search || '';
        self.path = p + s;
      }

      // finally, reconstruct the href based on what has been validated.
      self.href = format(self);
      return self;
    }

    function urlFileURLToPath(path) {
      if (typeof path === 'string')
        path = new Url().parse(path);
      else if (!(path instanceof Url))
        throw new TypeError('The "path" argument must be of type string or an instance of URL. Received type ' + (typeof path) + String(path));
      if (path.protocol !== 'file:')
        throw new TypeError('The URL must be of scheme file');
      return getPathFromURLPosix(path);
    }

    function getPathFromURLPosix(url) {
      const pathname = url.pathname;
      for (let n = 0; n < pathname.length; n++) {
        if (pathname[n] === '%') {
          const third = pathname.codePointAt(n + 2) | 0x20;
          if (pathname[n + 1] === '2' && third === 102) {
            throw new TypeError(
              'must not include encoded / characters'
            );
          }
        }
      }
      return decodeURIComponent(pathname);
    }

    function format(self) {
      var auth = self.auth || '';
      if (auth) {
        auth = encodeURIComponent(auth);
        auth = auth.replace(/%3A/i, ':');
        auth += '@';
      }

      var protocol = self.protocol || '',
        pathname = self.pathname || '',
        hash = self.hash || '',
        host = false,
        query = '';

      if (self.host) {
        host = auth + self.host;
      } else if (self.hostname) {
        host = auth + (self.hostname.indexOf(':') === -1 ?
          self.hostname :
          '[' + this.hostname + ']');
        if (self.port) {
          host += ':' + self.port;
        }
      }

      if (self.query &&
        isObject(self.query) &&
        Object.keys(self.query).length) {
        query = stringify(self.query);
      }

      var search = self.search || (query && ('?' + query)) || '';

      if (protocol && protocol.substr(-1) !== ':') protocol += ':';

      // only the slashedProtocols get the //.  Not mailto:, xmpp:, etc.
      // unless they had them to begin with.
      if (self.slashes ||
        (!protocol || slashedProtocol[protocol]) && host !== false) {
        host = '//' + (host || '');
        if (pathname && pathname.charAt(0) !== '/') pathname = '/' + pathname;
      } else if (!host) {
        host = '';
      }

      if (hash && hash.charAt(0) !== '#') hash = '#' + hash;
      if (search && search.charAt(0) !== '?') search = '?' + search;

      pathname = pathname.replace(/[?#]/g, function(match) {
        return encodeURIComponent(match);
      });
      search = search.replace('#', '%23');

      return protocol + host + pathname + search + hash;
    }

    Url.prototype.format = function() {
      return format(this);
    };

    Url.prototype.resolve = function(relative) {
      return this.resolveObject(urlParse(relative, false, true)).format();
    };

    Url.prototype.resolveObject = function(relative) {
      if (isString(relative)) {
        var rel = new Url();
        rel.parse(relative, false, true);
        relative = rel;
      }

      var result = new Url();
      var tkeys = Object.keys(this);
      for (var tk = 0; tk < tkeys.length; tk++) {
        var tkey = tkeys[tk];
        result[tkey] = this[tkey];
      }

      // hash is always overridden, no matter what.
      // even href="" will remove it.
      result.hash = relative.hash;

      // if the relative url is empty, then there's nothing left to do here.
      if (relative.href === '') {
        result.href = result.format();
        return result;
      }

      // hrefs like //foo/bar always cut to the protocol.
      if (relative.slashes && !relative.protocol) {
        // take everything except the protocol from relative
        var rkeys = Object.keys(relative);
        for (var rk = 0; rk < rkeys.length; rk++) {
          var rkey = rkeys[rk];
          if (rkey !== 'protocol')
            result[rkey] = relative[rkey];
        }

        //urlParse appends trailing / to urls like http://www.example.com
        if (slashedProtocol[result.protocol] &&
          result.hostname && !result.pathname) {
          result.path = result.pathname = '/';
        }

        result.href = result.format();
        return result;
      }
      var relPath;
      if (relative.protocol && relative.protocol !== result.protocol) {
        // if it's a known url protocol, then changing
        // the protocol does weird things
        // first, if it's not file:, then we MUST have a host,
        // and if there was a path
        // to begin with, then we MUST have a path.
        // if it is file:, then the host is dropped,
        // because that's known to be hostless.
        // anything else is assumed to be absolute.
        if (!slashedProtocol[relative.protocol]) {
          var keys = Object.keys(relative);
          for (var v = 0; v < keys.length; v++) {
            var k = keys[v];
            result[k] = relative[k];
          }
          result.href = result.format();
          return result;
        }

        result.protocol = relative.protocol;
        if (!relative.host && !hostlessProtocol[relative.protocol]) {
          relPath = (relative.pathname || '').split('/');
          while (relPath.length && !(relative.host = relPath.shift()));
          if (!relative.host) relative.host = '';
          if (!relative.hostname) relative.hostname = '';
          if (relPath[0] !== '') relPath.unshift('');
          if (relPath.length < 2) relPath.unshift('');
          result.pathname = relPath.join('/');
        } else {
          result.pathname = relative.pathname;
        }
        result.search = relative.search;
        result.query = relative.query;
        result.host = relative.host || '';
        result.auth = relative.auth;
        result.hostname = relative.hostname || relative.host;
        result.port = relative.port;
        // to support http.request
        if (result.pathname || result.search) {
          var p = result.pathname || '';
          var s = result.search || '';
          result.path = p + s;
        }
        result.slashes = result.slashes || relative.slashes;
        result.href = result.format();
        return result;
      }

      var isSourceAbs = (result.pathname && result.pathname.charAt(0) === '/'),
        isRelAbs = (
          relative.host ||
          relative.pathname && relative.pathname.charAt(0) === '/'
        ),
        mustEndAbs = (isRelAbs || isSourceAbs ||
          (result.host && relative.pathname)),
        removeAllDots = mustEndAbs,
        srcPath = result.pathname && result.pathname.split('/') || [],
        psychotic = result.protocol && !slashedProtocol[result.protocol];
      relPath = relative.pathname && relative.pathname.split('/') || [];
      // if the url is a non-slashed url, then relative
      // links like ../.. should be able
      // to crawl up to the hostname, as well.  This is strange.
      // result.protocol has already been set by now.
      // Later on, put the first path part into the host field.
      if (psychotic) {
        result.hostname = '';
        result.port = null;
        if (result.host) {
          if (srcPath[0] === '') srcPath[0] = result.host;
          else srcPath.unshift(result.host);
        }
        result.host = '';
        if (relative.protocol) {
          relative.hostname = null;
          relative.port = null;
          if (relative.host) {
            if (relPath[0] === '') relPath[0] = relative.host;
            else relPath.unshift(relative.host);
          }
          relative.host = null;
        }
        mustEndAbs = mustEndAbs && (relPath[0] === '' || srcPath[0] === '');
      }
      var authInHost;
      if (isRelAbs) {
        // it's absolute.
        result.host = (relative.host || relative.host === '') ?
          relative.host : result.host;
        result.hostname = (relative.hostname || relative.hostname === '') ?
          relative.hostname : result.hostname;
        result.search = relative.search;
        result.query = relative.query;
        srcPath = relPath;
        // fall through to the dot-handling below.
      } else if (relPath.length) {
        // it's relative
        // throw away the existing file, and take the new path instead.
        if (!srcPath) srcPath = [];
        srcPath.pop();
        srcPath = srcPath.concat(relPath);
        result.search = relative.search;
        result.query = relative.query;
      } else if (!isNullOrUndefined(relative.search)) {
        // just pull out the search.
        // like href='?foo'.
        // Put this after the other two cases because it simplifies the booleans
        if (psychotic) {
          result.hostname = result.host = srcPath.shift();
          //occationaly the auth can get stuck only in host
          //this especially happens in cases like
          //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
          authInHost = result.host && result.host.indexOf('@') > 0 ?
            result.host.split('@') : false;
          if (authInHost) {
            result.auth = authInHost.shift();
            result.host = result.hostname = authInHost.shift();
          }
        }
        result.search = relative.search;
        result.query = relative.query;
        //to support http.request
        if (!isNull(result.pathname) || !isNull(result.search)) {
          result.path = (result.pathname ? result.pathname : '') +
            (result.search ? result.search : '');
        }
        result.href = result.format();
        return result;
      }

      if (!srcPath.length) {
        // no path at all.  easy.
        // we've already handled the other stuff above.
        result.pathname = null;
        //to support http.request
        if (result.search) {
          result.path = '/' + result.search;
        } else {
          result.path = null;
        }
        result.href = result.format();
        return result;
      }

      // if a url ENDs in . or .., then it must get a trailing slash.
      // however, if it ends in anything else non-slashy,
      // then it must NOT get a trailing slash.
      var last = srcPath.slice(-1)[0];
      var hasTrailingSlash = (
        (result.host || relative.host || srcPath.length > 1) &&
        (last === '.' || last === '..') || last === '');

      // strip single dots, resolve double dots to parent dir
      // if the path tries to go above the root, `up` ends up > 0
      var up = 0;
      for (var i = srcPath.length; i >= 0; i--) {
        last = srcPath[i];
        if (last === '.') {
          srcPath.splice(i, 1);
        } else if (last === '..') {
          srcPath.splice(i, 1);
          up++;
        } else if (up) {
          srcPath.splice(i, 1);
          up--;
        }
      }

      // if the path is allowed to go above the root, restore leading ..s
      if (!mustEndAbs && !removeAllDots) {
        for (; up--; up) {
          srcPath.unshift('..');
        }
      }

      if (mustEndAbs && srcPath[0] !== '' &&
        (!srcPath[0] || srcPath[0].charAt(0) !== '/')) {
        srcPath.unshift('');
      }

      if (hasTrailingSlash && (srcPath.join('/').substr(-1) !== '/')) {
        srcPath.push('');
      }

      var isAbsolute = srcPath[0] === '' ||
        (srcPath[0] && srcPath[0].charAt(0) === '/');

      // put the host back
      if (psychotic) {
        result.hostname = result.host = isAbsolute ? '' :
          srcPath.length ? srcPath.shift() : '';
        //occationaly the auth can get stuck only in host
        //this especially happens in cases like
        //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
        authInHost = result.host && result.host.indexOf('@') > 0 ?
          result.host.split('@') : false;
        if (authInHost) {
          result.auth = authInHost.shift();
          result.host = result.hostname = authInHost.shift();
        }
      }

      mustEndAbs = mustEndAbs || (result.host && srcPath.length);

      if (mustEndAbs && !isAbsolute) {
        srcPath.unshift('');
      }

      if (!srcPath.length) {
        result.pathname = null;
        result.path = null;
      } else {
        result.pathname = srcPath.join('/');
      }

      //to support request.http
      if (!isNull(result.pathname) || !isNull(result.search)) {
        result.path = (result.pathname ? result.pathname : '') +
          (result.search ? result.search : '');
      }
      result.auth = relative.auth || result.auth;
      result.slashes = result.slashes || relative.slashes;
      result.href = result.format();
      return result;
    };

    Url.prototype.parseHost = function() {
      return parseHost(this);
    };

    function parseHost(self) {
      var host = self.host;
      var port = portPattern.exec(host);
      if (port) {
        port = port[0];
        if (port !== ':') {
          self.port = port.substr(1);
        }
        host = host.substr(0, host.length - port.length);
      }
      if (host) self.hostname = host;
    }

    // Copyright Joyent, Inc. and other Node contributors.
    //
    // Permission is hereby granted, free of charge, to any person obtaining a
    // copy of this software and associated documentation files (the
    // "Software"), to deal in the Software without restriction, including
    // without limitation the rights to use, copy, modify, merge, publish,
    // distribute, sublicense, and/or sell copies of the Software, and to permit
    // persons to whom the Software is furnished to do so, subject to the
    // following conditions:
    //
    // The above copyright notice and this permission notice shall be included
    // in all copies or substantial portions of the Software.
    //
    // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
    // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
    // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
    // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
    // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
    // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
    // USE OR OTHER DEALINGS IN THE SOFTWARE.

    // resolves . and .. elements in a path array with directory names there
    // must be no slashes, empty elements, or device names (c:\) in the array
    // (so also no leading and trailing slashes - it does not distinguish
    // relative and absolute paths)
    function normalizeArray(parts, allowAboveRoot) {
      // if the path tries to go above the root, `up` ends up > 0
      var up = 0;
      for (var i = parts.length - 1; i >= 0; i--) {
        var last = parts[i];
        if (last === '.') {
          parts.splice(i, 1);
        } else if (last === '..') {
          parts.splice(i, 1);
          up++;
        } else if (up) {
          parts.splice(i, 1);
          up--;
        }
      }

      // if the path is allowed to go above the root, restore leading ..s
      if (allowAboveRoot) {
        for (; up--; up) {
          parts.unshift('..');
        }
      }

      return parts;
    }

    // Split a filename into [root, dir, basename, ext], unix version
    // 'root' is just a slash, or nothing.
    var splitPathRe =
        /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
    var splitPath = function(filename) {
      return splitPathRe.exec(filename).slice(1);
    };

    // path.resolve([from ...], to)
    // posix version
    function resolve() {
      var resolvedPath = '',
          resolvedAbsolute = false;

      for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
        var path = (i >= 0) ? arguments[i] : '/';

        // Skip empty and invalid entries
        if (typeof path !== 'string') {
          throw new TypeError('Arguments to path.resolve must be strings');
        } else if (!path) {
          continue;
        }

        resolvedPath = path + '/' + resolvedPath;
        resolvedAbsolute = path.charAt(0) === '/';
      }

      // At this point the path should be resolved to a full absolute path, but
      // handle relative paths to be safe (might happen when process.cwd() fails)

      // Normalize the path
      resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
        return !!p;
      }), !resolvedAbsolute).join('/');

      return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
    }
    // path.normalize(path)
    // posix version
    function normalize(path) {
      var isPathAbsolute = isAbsolute(path),
          trailingSlash = substr(path, -1) === '/';

      // Normalize the path
      path = normalizeArray(filter(path.split('/'), function(p) {
        return !!p;
      }), !isPathAbsolute).join('/');

      if (!path && !isPathAbsolute) {
        path = '.';
      }
      if (path && trailingSlash) {
        path += '/';
      }

      return (isPathAbsolute ? '/' : '') + path;
    }
    // posix version
    function isAbsolute(path) {
      return path.charAt(0) === '/';
    }

    // posix version
    function join() {
      var paths = Array.prototype.slice.call(arguments, 0);
      return normalize(filter(paths, function(p, index) {
        if (typeof p !== 'string') {
          throw new TypeError('Arguments to path.join must be strings');
        }
        return p;
      }).join('/'));
    }


    // path.relative(from, to)
    // posix version
    function relative(from, to) {
      from = resolve(from).substr(1);
      to = resolve(to).substr(1);

      function trim(arr) {
        var start = 0;
        for (; start < arr.length; start++) {
          if (arr[start] !== '') break;
        }

        var end = arr.length - 1;
        for (; end >= 0; end--) {
          if (arr[end] !== '') break;
        }

        if (start > end) return [];
        return arr.slice(start, end - start + 1);
      }

      var fromParts = trim(from.split('/'));
      var toParts = trim(to.split('/'));

      var length = Math.min(fromParts.length, toParts.length);
      var samePartsLength = length;
      for (var i = 0; i < length; i++) {
        if (fromParts[i] !== toParts[i]) {
          samePartsLength = i;
          break;
        }
      }

      var outputParts = [];
      for (var i = samePartsLength; i < fromParts.length; i++) {
        outputParts.push('..');
      }

      outputParts = outputParts.concat(toParts.slice(samePartsLength));

      return outputParts.join('/');
    }

    var sep = '/';
    var delimiter = ':';

    function dirname(path) {
      var result = splitPath(path),
          root = result[0],
          dir = result[1];

      if (!root && !dir) {
        // No dirname whatsoever
        return '.';
      }

      if (dir) {
        // It has a dirname, strip trailing slash
        dir = dir.substr(0, dir.length - 1);
      }

      return root + dir;
    }

    function basename(path, ext) {
      var f = splitPath(path)[2];
      // TODO: make this comparison case-insensitive on windows?
      if (ext && f.substr(-1 * ext.length) === ext) {
        f = f.substr(0, f.length - ext.length);
      }
      return f;
    }


    function extname(path) {
      return splitPath(path)[3];
    }
    var path = {
      extname: extname,
      basename: basename,
      dirname: dirname,
      sep: sep,
      delimiter: delimiter,
      relative: relative,
      join: join,
      isAbsolute: isAbsolute,
      normalize: normalize,
      resolve: resolve
    };
    function filter (xs, f) {
        if (xs.filter) return xs.filter(f);
        var res = [];
        for (var i = 0; i < xs.length; i++) {
            if (f(xs[i], i, xs)) res.push(xs[i]);
        }
        return res;
    }

    // String.prototype.substr - negative index don't work in IE8
    var substr = 'ab'.substr(-1) === 'b' ?
        function (str, start, len) { return str.substr(start, len) } :
        function (str, start, len) {
            if (start < 0) start = str.length + start;
            return str.substr(start, len);
        }
    ;

    const db = new Loki("ads.db");
    const fs = require("fs");
    const https = require("https");

    const __filename = urlFileURLToPath((_documentCurrentScript && _documentCurrentScript.tagName.toUpperCase() === 'SCRIPT' && _documentCurrentScript.src || new URL('bundle.js', document.baseURI).href));
    const __dirname = dirname(__filename);

    /**
     * The function initializes a database collection for ads, ensuring uniqueness based on the "id" field.
     */
    async function initializeDatabase() {
      adsCollectionStore.set(db.getCollection("ads"));
      if (!get_store_value(adsCollectionStore)) {
        adsCollectionStore.set(db.addCollection("ads", { unique: ["id"] }));
      }
    }

    /**
     * The function `saveOrUpdateAd` checks if an ad already exists in a collection and either updates it
     * or inserts it accordingly.
     * @param ad - The `ad` parameter in the `saveOrUpdateAd` function represents an advertisement object
     * that contains information about an ad.
     * This function is responsible for either updating an existing ad in the `adsCollection` or inserting
     * a new ad if
     */
    function saveOrUpdateAd(ad) {
      let existingAd = get_store_value(adsCollectionStore).findOne({ id: ad.id });
      if (existingAd) {
        adsCollectionStore.update((value) => {
          value.update(Object.assign(existingAd, ad));
          return value;
        });
      } else {
        adsCollectionStore.update((value) => {
          value.insert(ad);
          return value;
        });
      }
    }

    /**
     * The `downloadFile` function downloads a file from a specified URL and saves it to a destination
     * using Node.js.
     * @param dest - The `dest` parameter in the `downloadFile` function is the destination path where the
     * downloaded file will be saved.
     * @param callback - The `callback` parameter in the `downloadFile` function is a function that will be
     * called once the file download is complete. It is used to handle any further actions that need to be
     * taken after the file has been successfully downloaded.
     */
    async function downloadFile(url, dest, callback) {
      const file = fs.createWriteStream(dest);
      https.get(url, (response) => {
        response.pipe(file);
        file.on("finish", () => {
          file.close(callback);
        });
      });
    }

    /**
     * The function fetches ads data from a specified URL, checks for updates, downloads new ads, and saves
     * or updates them in a collection.
     */
    async function fetchAds() {
      console.log();
      try {
        const response = await fetch("http://localhost:3001/getMediaData");
        const newAds = await response.json();

        adsStore.set([]);
        await newAds.forEach(async (ad) => {
          const existingAd = get_store_value(adsCollectionStore).findOne({ id: ad.id });

          if (
            !existingAd ||
            new Date(ad.updated_at) > new Date(existingAd.updated_at)
          ) {
            const filePath = path.join(
              __dirname,
              "downloads",
              path.basename(ad.url)
            );

            await downloadFile(ad.url, filePath, () => {
              ad.local_url = filePath;
              saveOrUpdateAd(ad);
              adsStore.update((value) => {
                value = [...value, ad];
                return value;
              });
            });
          }
        });
      } catch (error) {
        console.error("Error fetching ads:", error);
      }
    }

    /* src\App.svelte generated by Svelte v3.59.2 */
    const file = "src\\App.svelte";

    function create_fragment(ctx) {
    	let main;
    	let video0;
    	let video0_src_value;
    	let t;
    	let video1;
    	let video1_src_value;

    	const block = {
    		c: function create() {
    			main = element("main");
    			video0 = element("video");
    			t = space();
    			video1 = element("video");
    			attr_dev(video0, "id", "player1");
    			attr_dev(video0, "class", "player svelte-1txzg8");
    			if (!src_url_equal(video0.src, video0_src_value = /*src*/ ctx[0])) attr_dev(video0, "src", video0_src_value);
    			video0.autoplay = true;
    			video0.controls = true;
    			add_location(video0, file, 14, 2, 326);
    			attr_dev(video1, "id", "player2");
    			attr_dev(video1, "class", "player hidden svelte-1txzg8");
    			if (!src_url_equal(video1.src, video1_src_value = /*src*/ ctx[0])) attr_dev(video1, "src", video1_src_value);
    			video1.autoplay = true;
    			video1.controls = true;
    			add_location(video1, file, 17, 2, 489);
    			attr_dev(main, "class", "svelte-1txzg8");
    			add_location(main, file, 11, 0, 224);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, video0);
    			append_dev(main, t);
    			append_dev(main, video1);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*src*/ 1 && !src_url_equal(video0.src, video0_src_value = /*src*/ ctx[0])) {
    				attr_dev(video0, "src", video0_src_value);
    			}

    			if (dirty & /*src*/ 1 && !src_url_equal(video1.src, video1_src_value = /*src*/ ctx[0])) {
    				attr_dev(video1, "src", video1_src_value);
    			}
    		},
    		i: noop$1,
    		o: noop$1,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let src;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);

    	onMount(async () => {
    		await initializeDatabase();
    		await fetchAds();
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		initializeDatabase,
    		fetchAds,
    		onMount,
    		src
    	});

    	$$self.$inject_state = $$props => {
    		if ('src' in $$props) $$invalidate(0, src = $$props.src);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$invalidate(0, src = "");
    	return [src];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
      target: document.body,
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
