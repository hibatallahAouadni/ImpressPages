/*!
 * jsTree 3.0.0
 * http://jstree.com/
 *
 * Copyright (c) 2013 Ivan Bozhanov (http://vakata.com)
 *
 * Licensed same as jquery - under the terms of the MIT License
 *   http://www.opensource.org/licenses/mit-license.php
 */
/*!
 * if using jslint please allow for the jQuery global and use following options:
 * jslint: browser: true, ass: true, bitwise: true, continue: true, nomen: true, plusplus: true, regexp: true, unparam: true, todo: true, white: true
 */
/*globals jQuery, define, exports, require, window, document */

(function ($) {
    (function ($, undefined) {
        "use strict";
        // prevent another load? maybe there is a better way?
        if($.jstree) {
            return;
        }


        /**
         * ### jsTree core functionality
         */

        // internal variables
        var instance_counter = 0,
            ccp_node = false,
            ccp_mode = false,
            ccp_inst = false,
            themes_loaded = [],
            src = $('script:last').attr('src'),
            _d = document, _node = _d.createElement('LI'), _temp1, _temp2;

        _node.setAttribute('role', 'treeitem');
        _temp1 = _d.createElement('I');
        _temp1.className = 'jstree-icon jstree-ocl';
        _node.appendChild(_temp1);
        _temp1 = _d.createElement('A');
        _temp1.className = 'jstree-anchor';
        _temp1.setAttribute('href','#');
        _temp2 = _d.createElement('I');
        _temp2.className = 'jstree-icon jstree-themeicon';
        _temp1.appendChild(_temp2);
        _node.appendChild(_temp1);
        _temp1 = _temp2 = null;

console.log('init 2');
        /**
         * holds all jstree related functions and variables, including the actual class and methods to create, access and manipulate instances.
         * @name $.jstree
         */
        $.jstree = {
            /**
             * specifies the jstree version in use
             * @name $.jstree.version
             */
            version : '3.0.0-beta7',
            /**
             * holds all the default options used when creating new instances
             * @name $.jstree.defaults
             */
            defaults : {
                /**
                 * configure which plugins will be active on an instance. Should be an array of strings, where each element is a plugin name. The default is `[]`
                 * @name $.jstree.defaults.plugins
                 */
                plugins : []
            },
            /**
             * stores all loaded jstree plugins (used internally)
             * @name $.jstree.plugins
             */
            plugins : {},
            path : src && src.indexOf('/') !== -1 ? src.replace(/\/[^\/]+$/,'') : ''
        };
        /**
         * creates a jstree instance
         * @name $.jstree.create(el [, options])
         * @param {DOMElement|jQuery|String} el the element to create the instance on, can be jQuery extended or a selector
         * @param {Object} options options for this instance (extends `$.jstree.defaults`)
         * @return {jsTree} the new instance
         */
        $.jstree.create = function (el, options) {
            var tmp = new $.jstree.core(++instance_counter),
                opt = options;
            options = $.extend(true, {}, $.jstree.defaults, options);
            if(opt && opt.plugins) {
                options.plugins = opt.plugins;
            }
            $.each(options.plugins, function (i, k) {
                if(i !== 'core') {
                    tmp = tmp.plugin(k, options[k]);
                }
            });
            tmp.init(el, options);
            return tmp;
        };
        /**
         * the jstree class constructor, used only internally
         * @private
         * @name $.jstree.core(id)
         * @param {Number} id this instance's index
         */
        $.jstree.core = function (id) {
            this._id = id;
            this._cnt = 0;
            this._data = {
                core : {
                    themes : {
                        name : false,
                        dots : false,
                        icons : false
                    },
                    selected : []
                }
            };
        };
        /**
         * get a reference to an existing instance
         *
         * __Examples__
         *
         *	// provided a container with an ID of "tree", and a nested node with an ID of "branch"
         *	// all of there will return the same instance
         *	$.jstree.reference('tree');
         *	$.jstree.reference('#tree');
         *	$.jstree.reference($('#tree'));
         *	$.jstree.reference(document.getElementByID('tree'));
         *	$.jstree.reference('branch');
         *	$.jstree.reference('#branch');
         *	$.jstree.reference($('#branch'));
         *	$.jstree.reference(document.getElementByID('branch'));
         *
         * @name $.jstree.reference(needle)
         * @param {DOMElement|jQuery|String} needle
         * @return {jsTree|null} the instance or `null` if not found
         */
        $.jstree.reference = function (needle) {
            if(needle && !$(needle).length) {
                if(needle.id) {
                    needle = needle.id;
                }
                var tmp = null;
                $('.jstree').each(function () {
                    var inst = $(this).data('jstree');
                    if(inst && inst._model.data[needle]) {
                        tmp = inst;
                        return false;
                    }
                });
                return tmp;
            }
            return $(needle).closest('.jstree').data('jstree');
        };
        /**
         * Create an instance, get an instance or invoke a command on a instance.
         *
         * If there is no instance associated with the current node a new one is created and `arg` is used to extend `$.jstree.defaults` for this new instance. There would be no return value (chaining is not broken).
         *
         * If there is an existing instance and `arg` is a string the command specified by `arg` is executed on the instance, with any additional arguments passed to the function. If the function returns a value it will be returned (chaining could break depending on function).
         *
         * If there is an existing instance and `arg` is not a string the instance itself is returned (similar to `$.jstree.reference`).
         *
         * In any other case - nothing is returned and chaining is not broken.
         *
         * __Examples__
         *
         *	$('#tree1').jstree(); // creates an instance
         *	$('#tree2').jstree({ plugins : [] }); // create an instance with some options
         *	$('#tree1').jstree('open_node', '#branch_1'); // call a method on an existing instance, passing additional arguments
         *	$('#tree2').jstree(); // get an existing instance (or create an instance)
         *	$('#tree2').jstree(true); // get an existing instance (will not create new instance)
         *	$('#branch_1').jstree().select_node('#branch_1'); // get an instance (using a nested element and call a method)
         *
         * @name $().jstree([arg])
         * @param {String|Object} arg
         * @return {Mixed}
         */
        $.fn.jstree = function (arg) {
            // check for string argument
            var is_method	= (typeof arg === 'string'),
                args		= Array.prototype.slice.call(arguments, 1),
                result		= null;
            this.each(function () {
                // get the instance (if there is one) and method (if it exists)
                var instance = $.jstree.reference(this),
                    method = is_method && instance ? instance[arg] : null;
                // if calling a method, and method is available - execute on the instance
                result = is_method && method ?
                    method.apply(instance, args) :
                    null;
                // if there is no instance and no method is being called - create one
                if(!instance && !is_method && (arg === undefined || $.isPlainObject(arg))) {
                    $(this).data('jstree', new $.jstree.create(this, arg));
                }
                // if there is an instance and no method is called - return the instance
                if(instance && !is_method) {
                    result = instance;
                }
                // if there was a method call which returned a result - break and return the value
                if(result !== null && result !== undefined) {
                    return false;
                }
            });
            // if there was a method call with a valid return value - return that, otherwise continue the chain
            return result !== null && result !== undefined ?
                result : this;
        };
        /**
         * used to find elements containing an instance
         *
         * __Examples__
         *
         *	$('div:jstree').each(function () {
         *		$(this).jstree('destroy');
         *	});
         *
         * @name $(':jstree')
         * @return {jQuery}
         */
        $.expr[':'].jstree = $.expr.createPseudo(function(search) {
            return function(a) {
                return $(a).hasClass('jstree') &&
                    $(a).data('jstree') !== undefined;
            };
        });

        /**
         * stores all defaults for the core
         * @name $.jstree.defaults.core
         */
        $.jstree.defaults.core = {
            /**
             * data configuration
             *
             * If left as `false` the HTML inside the jstree container element is used to populate the tree (that should be an unordered list with list items).
             *
             * You can also pass in a HTML string or a JSON array here.
             *
             * It is possible to pass in a standard jQuery-like AJAX config and jstree will automatically determine if the response is JSON or HTML and use that to populate the tree.
             * In addition to the standard jQuery ajax options here you can suppy functions for `data` and `url`, the functions will be run in the current instance's scope and a param will be passed indicating which node is being loaded, the return value of those functions will be used.
             *
             * The last option is to specify a function, that function will receive the node being loaded as argument and a second param which is a function which should be called with the result.
             *
             * __Examples__
             *
             *	// AJAX
             *	$('#tree').jstree({
             *		'core' : {
             *			'data' : {
             *				'url' : '/get/children/',
             *				'data' : function (node) {
             *					return { 'id' : node.id };
             *				}
             *			}
             *		});
             *
             *	// direct data
             *	$('#tree').jstree({
             *		'core' : {
             *			'data' : [
             *				'Simple root node',
             *				{
             *					'id' : 'node_2',
             *					'text' : 'Root node with options',
             *					'state' : { 'opened' : true, 'selected' : true },
             *					'children' : [ { 'text' : 'Child 1' }, 'Child 2']
             *				}
             *			]
             *		});
             *
             *	// function
             *	$('#tree').jstree({
             *		'core' : {
             *			'data' : function (obj, callback) {
             *				callback.call(this, ['Root 1', 'Root 2']);
             *			}
             *		});
             *
             * @name $.jstree.defaults.core.data
             */
            data			: false,
            /**
             * configure the various strings used throughout the tree
             *
             * You can use an object where the key is the string you need to replace and the value is your replacement.
             * Another option is to specify a function which will be called with an argument of the needed string and should return the replacement.
             * If left as `false` no replacement is made.
             *
             * __Examples__
             *
             *	$('#tree').jstree({
             *		'core' : {
             *			'strings' : {
             *				'Loading...' : 'Please wait ...'
             *			}
             *		}
             *	});
             *
             * @name $.jstree.defaults.core.strings
             */
            strings			: false,
            /**
             * determines what happens when a user tries to modify the structure of the tree
             * If left as `false` all operations like create, rename, delete, move or copy are prevented.
             * You can set this to `true` to allow all interactions or use a function to have better control.
             *
             * __Examples__
             *
             *	$('#tree').jstree({
             *		'core' : {
             *			'check_callback' : function (operation, node, node_parent, node_position) {
             *				// operation can be 'create_node', 'rename_node', 'delete_node', 'move_node' or 'copy_node'
             *				// in case of 'rename_node' node_position is filled with the new node name
             *				return operation === 'rename_node' ? true : false;
             *			}
             *		}
             *	});
             *
             * @name $.jstree.defaults.core.check_callback
             */
            check_callback	: false,
            /**
             * the open / close animation duration in milliseconds - set this to `false` to disable the animation (default is `200`)
             * @name $.jstree.defaults.core.animation
             */
            animation		: 200,
            /**
             * a boolean indicating if multiple nodes can be selected
             * @name $.jstree.defaults.core.multiple
             */
            multiple		: true,
            /**
             * theme configuration object
             * @name $.jstree.defaults.core.themes
             */
            themes			: {
                /**
                 * the name of the theme to use (if left as `false` the default theme is used)
                 * @name $.jstree.defaults.core.themes.name
                 */
                name			: false,
                /**
                 * the URL of the theme's CSS file, leave this as `false` if you have manually included the theme CSS (recommended). You can set this to `true` too which will try to autoload the theme.
                 * @name $.jstree.defaults.core.themes.url
                 */
                url				: false,
                /**
                 * the location of all jstree themes - only used if `url` is set to `true`
                 * @name $.jstree.defaults.core.themes.dir
                 */
                dir				: false,
                /**
                 * a boolean indicating if connecting dots are shown
                 * @name $.jstree.defaults.core.themes.dots
                 */
                dots			: true,
                /**
                 * a boolean indicating if node icons are shown
                 * @name $.jstree.defaults.core.themes.icons
                 */
                icons			: true,
                /**
                 * a boolean indicating if the tree background is striped
                 * @name $.jstree.defaults.core.themes.stripes
                 */
                stripes			: false,
                /**
                 * a string (or boolean `false`) specifying the theme variant to use (if the theme supports variants)
                 * @name $.jstree.defaults.core.themes.variant
                 */
                variant			: false,
                /**
                 * a boolean specifying if a reponsive version of the theme should kick in on smaller screens (if the theme supports it). Defaults to `true`.
                 * @name $.jstree.defaults.core.themes.responsive
                 */
                responsive		: true
            },
            /**
             * if left as `true` all parents of all selected nodes will be opened once the tree loads (so that all selected nodes are visible to the user)
             * @name $.jstree.defaults.core.expand_selected_onload
             */
            expand_selected_onload : true
        };
        $.jstree.core.prototype = {
            /**
             * used to decorate an instance with a plugin. Used internally.
             * @private
             * @name plugin(deco [, opts])
             * @param  {String} deco the plugin to decorate with
             * @param  {Object} opts options for the plugin
             * @return {jsTree}
             */
            plugin : function (deco, opts) {
                var Child = $.jstree.plugins[deco];
                if(Child) {
                    this._data[deco] = {};
                    Child.prototype = this;
                    return new Child(opts, this);
                }
                return this;
            },
            /**
             * used to decorate an instance with a plugin. Used internally.
             * @private
             * @name init(el, optons)
             * @param {DOMElement|jQuery|String} el the element we are transforming
             * @param {Object} options options for this instance
             * @trigger init.jstree, loading.jstree, loaded.jstree, ready.jstree, changed.jstree
             */
            init : function (el, options) {
                this._model = {
                    data : {
                        '#' : {
                            id : '#',
                            parent : null,
                            parents : [],
                            children : [],
                            children_d : [],
                            state : { loaded : false }
                        }
                    },
                    changed : [],
                    force_full_redraw : false,
                    redraw_timeout : false,
                    default_state : {
                        loaded : true,
                        opened : false,
                        selected : false,
                        disabled : false
                    }
                };

                this.element = $(el).addClass('jstree jstree-' + this._id);
                this.settings = options;
                this.element.bind("destroyed", $.proxy(this.teardown, this));

                this._data.core.ready = false;
                this._data.core.loaded = false;
                this._data.core.rtl = (this.element.css("direction") === "rtl");
                this.element[this._data.core.rtl ? 'addClass' : 'removeClass']("jstree-rtl");
                this.element.attr('role','tree');

                this.bind();
                /**
                 * triggered after all events are bound
                 * @event
                 * @name init.jstree
                 */
                this.trigger("init");

                this._data.core.original_container_html = this.element.find(" > ul > li").clone(true);
                this._data.core.original_container_html
                    .find("li").addBack()
                    .contents().filter(function() {
                        return this.nodeType === 3 && (!this.nodeValue || /^\s+$/.test(this.nodeValue));
                    })
                    .remove();
                this.element.html("<"+"ul class='jstree-container-ul'><"+"li class='jstree-initial-node jstree-loading jstree-leaf jstree-last'><i class='jstree-icon jstree-ocl'></i><"+"a class='jstree-anchor' href='#'><i class='jstree-icon jstree-themeicon-hidden'></i>" + this.get_string("Loading ...") + "</a></li></ul>");
                this._data.core.li_height = this.get_container_ul().children("li:eq(0)").height() || 18;
                /**
                 * triggered after the loading text is shown and before loading starts
                 * @event
                 * @name loading.jstree
                 */
                this.trigger("loading");
                this.load_node('#');
            },
            /**
             * destroy an instance
             * @name destroy()
             */
            destroy : function () {
                this.element.unbind("destroyed", this.teardown);
                this.teardown();
            },
            /**
             * part of the destroying of an instance. Used internally.
             * @private
             * @name teardown()
             */
            teardown : function () {
                this.unbind();
                this.element
                    .removeClass('jstree')
                    .removeData('jstree')
                    .find("[class^='jstree']")
                        .addBack()
                        .attr("class", function () { return this.className.replace(/jstree[^ ]*|$/ig,''); });
                this.element = null;
            },
            /**
             * bind all events. Used internally.
             * @private
             * @name bind()
             */
            bind : function () {
                this.element
                    .on("dblclick.jstree", function () {
                            if(document.selection && document.selection.empty) {
                                document.selection.empty();
                            }
                            else {
                                if(window.getSelection) {
                                    var sel = window.getSelection();
                                    try {
                                        sel.removeAllRanges();
                                        sel.collapse();
                                    } catch (ignore) { }
                                }
                            }
                        })
                    .on("click.jstree", ".jstree-ocl", $.proxy(function (e) {
                            this.toggle_node(e.target);
                        }, this))
                    .on("click.jstree", ".jstree-anchor", $.proxy(function (e) {
                            e.preventDefault();
                            $(e.currentTarget).focus();
                            this.activate_node(e.currentTarget, e);
                        }, this))
                    .on('keydown.jstree', '.jstree-anchor', $.proxy(function (e) {
                            var o = null;
                            switch(e.which) {
                                case 13:
                                case 32:
                                    e.type = "click";
                                    $(e.currentTarget).trigger(e);
                                    break;
                                case 37:
                                    e.preventDefault();
                                    if(this.is_open(e.currentTarget)) {
                                        this.close_node(e.currentTarget);
                                    }
                                    else {
                                        o = this.get_prev_dom(e.currentTarget);
                                        if(o && o.length) { o.children('.jstree-anchor').focus(); }
                                    }
                                    break;
                                case 38:
                                    e.preventDefault();
                                    o = this.get_prev_dom(e.currentTarget);
                                    if(o && o.length) { o.children('.jstree-anchor').focus(); }
                                    break;
                                case 39:
                                    e.preventDefault();
                                    if(this.is_closed(e.currentTarget)) {
                                        this.open_node(e.currentTarget, function (o) { this.get_node(o, true).children('.jstree-anchor').focus(); });
                                    }
                                    else {
                                        o = this.get_next_dom(e.currentTarget);
                                        if(o && o.length) { o.children('.jstree-anchor').focus(); }
                                    }
                                    break;
                                case 40:
                                    e.preventDefault();
                                    o = this.get_next_dom(e.currentTarget);
                                    if(o && o.length) { o.children('.jstree-anchor').focus(); }
                                    break;
                                // delete
                                case 46:
                                    e.preventDefault();
                                    o = this.get_node(e.currentTarget);
                                    if(o && o.id && o.id !== '#') {
                                        o = this.is_selected(o) ? this.get_selected() : o;
                                        // this.delete_node(o);
                                    }
                                    break;
                                // f2
                                case 113:
                                    e.preventDefault();
                                    o = this.get_node(e.currentTarget);
                                    /*!
                                    if(o && o.id && o.id !== '#') {
                                        // this.edit(o);
                                    }
                                    */
                                    break;
                                default:
                                    // console.log(e.which);
                                    break;
                            }
                        }, this))
                    .on("load_node.jstree", $.proxy(function (e, data) {
                            if(data.status) {
                                if(data.node.id === '#' && !this._data.core.loaded) {
                                    this._data.core.loaded = true;
                                    /**
                                     * triggered after the root node is loaded for the first time
                                     * @event
                                     * @name loaded.jstree
                                     */
                                    this.trigger("loaded");
                                }
                                if(!this._data.core.ready && !this.get_container_ul().find('.jstree-loading:eq(0)').length) {
                                    this._data.core.ready = true;
                                    if(this._data.core.selected.length) {
                                        if(this.settings.core.expand_selected_onload) {
                                            var tmp = [], i, j;
                                            for(i = 0, j = this._data.core.selected.length; i < j; i++) {
                                                tmp = tmp.concat(this._model.data[this._data.core.selected[i]].parents);
                                            }
                                            tmp = $.vakata.array_unique(tmp);
                                            for(i = 0, j = tmp.length; i < j; i++) {
                                                this.open_node(tmp[i], false, 0);
                                            }
                                        }
                                        this.trigger('changed', { 'action' : 'ready', 'selected' : this._data.core.selected });
                                    }
                                    /**
                                     * triggered after all nodes are finished loading
                                     * @event
                                     * @name ready.jstree
                                     */
                                    setTimeout($.proxy(function () { this.trigger("ready"); }, this), 0);
                                }
                            }
                        }, this))
                    // THEME RELATED
                    .on("init.jstree", $.proxy(function () {
                            var s = this.settings.core.themes;
                            this._data.core.themes.dots			= s.dots;
                            this._data.core.themes.stripes		= s.stripes;
                            this._data.core.themes.icons		= s.icons;
                            this.set_theme(s.name || "default", s.url);
                            this.set_theme_variant(s.variant);
                        }, this))
                    .on("loading.jstree", $.proxy(function () {
                            this[ this._data.core.themes.dots ? "show_dots" : "hide_dots" ]();
                            this[ this._data.core.themes.icons ? "show_icons" : "hide_icons" ]();
                            this[ this._data.core.themes.stripes ? "show_stripes" : "hide_stripes" ]();
                        }, this))
                    .on('focus.jstree', '.jstree-anchor', $.proxy(function (e) {
                            this.element.find('.jstree-hovered').not(e.currentTarget).mouseleave();
                            $(e.currentTarget).mouseenter();
                        }, this))
                    .on('mouseenter.jstree', '.jstree-anchor', $.proxy(function (e) {
                            this.hover_node(e.currentTarget);
                        }, this))
                    .on('mouseleave.jstree', '.jstree-anchor', $.proxy(function (e) {
                            this.dehover_node(e.currentTarget);
                        }, this));
            },
            /**
             * part of the destroying of an instance. Used internally.
             * @private
             * @name unbind()
             */
            unbind : function () {
                this.element.off('.jstree');
                $(document).off('.jstree-' + this._id);
            },
            /**
             * trigger an event. Used internally.
             * @private
             * @name trigger(ev [, data])
             * @param  {String} ev the name of the event to trigger
             * @param  {Object} data additional data to pass with the event
             */
            trigger : function (ev, data) {
                if(!data) {
                    data = {};
                }
                data.instance = this;
                this.element.triggerHandler(ev.replace('.jstree','') + '.jstree', data);
            },
            /**
             * returns the jQuery extended instance container
             * @name get_container()
             * @return {jQuery}
             */
            get_container : function () {
                return this.element;
            },
            /**
             * returns the jQuery extended main UL node inside the instance container. Used internally.
             * @private
             * @name get_container_ul()
             * @return {jQuery}
             */
            get_container_ul : function () {
                return this.element.children("ul:eq(0)");
            },
            /**
             * gets string replacements (localization). Used internally.
             * @private
             * @name get_string(key)
             * @param  {String} key
             * @return {String}
             */
            get_string : function (key) {
                var a = this.settings.core.strings;
                if($.isFunction(a)) { return a.call(this, key); }
                if(a && a[key]) { return a[key]; }
                return key;
            },
            /**
             * gets the first child of a DOM node. Used internally.
             * @private
             * @name _firstChild(dom)
             * @param  {DOMElement} dom
             * @return {DOMElement}
             */
            _firstChild : function (dom) {
                dom = dom ? dom.firstChild : null;
                while(dom !== null && dom.nodeType !== 1) {
                    dom = dom.nextSibling;
                }
                return dom;
            },
            /**
             * gets the next sibling of a DOM node. Used internally.
             * @private
             * @name _nextSibling(dom)
             * @param  {DOMElement} dom
             * @return {DOMElement}
             */
            _nextSibling : function (dom) {
                dom = dom ? dom.nextSibling : null;
                while(dom !== null && dom.nodeType !== 1) {
                    dom = dom.nextSibling;
                }
                return dom;
            },
            /**
             * gets the previous sibling of a DOM node. Used internally.
             * @private
             * @name _previousSibling(dom)
             * @param  {DOMElement} dom
             * @return {DOMElement}
             */
            _previousSibling : function (dom) {
                dom = dom ? dom.previousSibling : null;
                while(dom !== null && dom.nodeType !== 1) {
                    dom = dom.previousSibling;
                }
                return dom;
            },
            /**
             * get the JSON representation of a node (or the actual jQuery extended DOM node) by using any input (child DOM element, ID string, selector, etc)
             * @name get_node(obj [, as_dom])
             * @param  {mixed} obj
             * @param  {Boolean} as_dom
             * @return {Object|jQuery}
             */
            get_node : function (obj, as_dom) {
                if(obj && obj.id) {
                    obj = obj.id;
                }
                var dom;
                try {
                    if(this._model.data[obj]) {
                        obj = this._model.data[obj];
                    }
                    else if(((dom = $(obj, this.element)).length || (dom = $('#' + obj, this.element)).length) && this._model.data[dom.closest('li').attr('id')]) {
                        obj = this._model.data[dom.closest('li').attr('id')];
                    }
                    else if((dom = $(obj, this.element)).length && dom.hasClass('jstree')) {
                        obj = this._model.data['#'];
                    }
                    else {
                        return false;
                    }

                    if(as_dom) {
                        obj = obj.id === '#' ? this.element : $(document.getElementById(obj.id));
                    }
                    return obj;
                } catch (ex) { return false; }
            },
            /**
             * get the next visible node that is below the `obj` node. If `strict` is set to `true` only sibling nodes are returned.
             * @name get_next_dom(obj [, strict])
             * @param  {mixed} obj
             * @param  {Boolean} strict
             * @return {jQuery}
             */
            get_next_dom : function (obj, strict) {
                var tmp;
                obj = this.get_node(obj, true);
                if(obj[0] === this.element[0]) {
                    tmp = this._firstChild(this.get_container_ul()[0]);
                    return tmp ? $(tmp) : false;
                }
                if(!obj || !obj.length) {
                    return false;
                }
                if(strict) {
                    tmp = this._nextSibling(obj[0]);
                    return tmp ? $(tmp) : false;
                }
                if(obj.hasClass("jstree-open")) {
                    tmp = this._firstChild(obj.children('ul')[0]);
                    return tmp ? $(tmp) : false;
                }
                if((tmp = this._nextSibling(obj[0])) !== null) {
                    return $(tmp);
                }
                return obj.parentsUntil(".jstree","li").next("li").eq(0);
            },
            /**
             * get the previous visible node that is above the `obj` node. If `strict` is set to `true` only sibling nodes are returned.
             * @name get_prev_dom(obj [, strict])
             * @param  {mixed} obj
             * @param  {Boolean} strict
             * @return {jQuery}
             */
            get_prev_dom : function (obj, strict) {
                var tmp;
                obj = this.get_node(obj, true);
                if(obj[0] === this.element[0]) {
                    tmp = this.get_container_ul()[0].lastChild;
                    return tmp ? $(tmp) : false;
                }
                if(!obj || !obj.length) {
                    return false;
                }
                if(strict) {
                    tmp = this._previousSibling(obj[0]);
                    return tmp ? $(tmp) : false;
                }
                if((tmp = this._previousSibling(obj[0])) !== null) {
                    obj = $(tmp);
                    while(obj.hasClass("jstree-open")) {
                        obj = obj.children("ul:eq(0)").children("li:last");
                    }
                    return obj;
                }
                tmp = obj[0].parentNode.parentNode;
                return tmp && tmp.tagName === 'LI' ? $(tmp) : false;
            },
            /**
             * get the parent ID of a node
             * @name get_parent(obj)
             * @param  {mixed} obj
             * @return {String}
             */
            get_parent : function (obj) {
                obj = this.get_node(obj);
                if(!obj || obj.id === '#') {
                    return false;
                }
                return obj.parent;
            },
            /**
             * get a jQuery collection of all the children of a node (node must be rendered)
             * @name get_children_dom(obj)
             * @param  {mixed} obj
             * @return {jQuery}
             */
            get_children_dom : function (obj) {
                obj = this.get_node(obj, true);
                if(obj[0] === this.element[0]) {
                    return this.get_container_ul().children("li");
                }
                if(!obj || !obj.length) {
                    return false;
                }
                return obj.children("ul").children("li");
            },
            /**
             * checks if a node has children
             * @name is_parent(obj)
             * @param  {mixed} obj
             * @return {Boolean}
             */
            is_parent : function (obj) {
                obj = this.get_node(obj);
                return obj && (obj.state.loaded === false || obj.children.length);
            },
            /**
             * checks if a node is loaded (its children are available)
             * @name is_loaded(obj)
             * @param  {mixed} obj
             * @return {Boolean}
             */
            is_loaded : function (obj) {
                obj = this.get_node(obj);
                return obj && obj.state.loaded;
            },
            /**
             * check if a node is currently loading (fetching children)
             * @name is_loading(obj)
             * @param  {mixed} obj
             * @return {Boolean}
             */
            is_loading : function (obj) {
                obj = this.get_node(obj, true);
                return obj && obj.hasClass("jstree-loading");
            },
            /**
             * check if a node is opened
             * @name is_open(obj)
             * @param  {mixed} obj
             * @return {Boolean}
             */
            is_open : function (obj) {
                obj = this.get_node(obj);
                return obj && obj.state.opened;
            },
            /**
             * check if a node is in a closed state
             * @name is_closed(obj)
             * @param  {mixed} obj
             * @return {Boolean}
             */
            is_closed : function (obj) {
                obj = this.get_node(obj);
                return obj && this.is_parent(obj) && !obj.state.opened;
            },
            /**
             * check if a node has no children
             * @name is_leaf(obj)
             * @param  {mixed} obj
             * @return {Boolean}
             */
            is_leaf : function (obj) {
                return !this.is_parent(obj);
            },
            /**
             * loads a node (fetches its children using the `core.data` setting). Multiple nodes can be passed to by using an array.
             * @name load_node(obj [, callback])
             * @param  {mixed} obj
             * @param  {function} callback a function to be executed once loading is conplete, the function is executed in the instance's scope and receives two arguments - the node and a boolean status
             * @return {Boolean}
             * @trigger load_node.jstree
             */
            load_node : function (obj, callback) {
                var t1, t2;
                if($.isArray(obj)) {
                    obj = obj.slice();
                    for(t1 = 0, t2 = obj.length; t1 < t2; t1++) {
                        this.load_node(obj[t1], callback);
                    }
                    return true;
                }
                obj = this.get_node(obj);
                if(!obj) {
                    callback.call(this, obj, false);
                    return false;
                }
                this.get_node(obj, true).addClass("jstree-loading");
                this._load_node(obj, $.proxy(function (status) {
                    obj.state.loaded = status;
                    this.get_node(obj, true).removeClass("jstree-loading");
                    /**
                     * triggered after a node is loaded
                     * @event
                     * @name load_node.jstree
                     * @param {Object} node the node that was loading
                     * @param {Boolean} status was the node loaded successfully
                     */
                    this.trigger('load_node', { "node" : obj, "status" : status });
                    if(callback) {
                        callback.call(this, obj, status);
                    }
                }, this));
                return true;
            },
            /**
             * handles the actual loading of a node. Used only internally.
             * @private
             * @name _load_node(obj [, callback])
             * @param  {mixed} obj
             * @param  {function} callback a function to be executed once loading is conplete, the function is executed in the instance's scope and receives one argument - a boolean status
             * @return {Boolean}
             */
            _load_node : function (obj, callback) {
                var s = this.settings.core.data, t;
                // use original HTML
                if(!s) {
                    return callback.call(this, obj.id === '#' ? this._append_html_data(obj, this._data.core.original_container_html.clone(true)) : false);
                }
                if($.isFunction(s)) {
                    return s.call(this, obj, $.proxy(function (d) {
                        return d === false ? callback.call(this, false) : callback.call(this, this[typeof d === 'string' ? '_append_html_data' : '_append_json_data'](obj, typeof d === 'string' ? $(d) : d));
                    }, this));
                }
                if(typeof s === 'object') {
                    if(s.url) {
                        s = $.extend(true, {}, s);
                        if($.isFunction(s.url)) {
                            s.url = s.url.call(this, obj);
                        }
                        if($.isFunction(s.data)) {
                            s.data = s.data.call(this, obj);
                        }
                        return $.ajax(s)
                            .done($.proxy(function (d,t,x) {
                                    var type = x.getResponseHeader('Content-Type');
                                    if(type.indexOf('json') !== -1) {
                                        return callback.call(this, this._append_json_data(obj, d));
                                    }
                                    if(type.indexOf('html') !== -1) {
                                        return callback.call(this, this._append_html_data(obj, $(d)));
                                    }
                                }, this))
                            .fail($.proxy(function () {
                                    callback.call(this, false);
                                }, this));
                    }
                    t = ($.isArray(s) || $.isPlainObject(s)) ? $.vakata.json.decode($.vakata.json.encode(s)) : s;
                    return callback.call(this, this._append_json_data(obj, t));
                }
                if(typeof s === 'string') {
                    return callback.call(this, this._append_html_data(obj, s));
                }
                return callback.call(this, false);
            },
            /**
             * adds a node to the list of nodes to redraw. Used only internally.
             * @private
             * @name _node_changed(obj [, callback])
             * @param  {mixed} obj
             */
            _node_changed : function (obj) {
                obj = this.get_node(obj);
                if(obj) {
                    this._model.changed.push(obj.id);
                }
            },
            /**
             * appends HTML content to the tree. Used internally.
             * @private
             * @name _append_html_data(obj, data)
             * @param  {mixed} obj the node to append to
             * @param  {String} data the HTML string to parse and append
             * @return {Boolean}
             * @trigger model.jstree, changed.jstree
             */
            _append_html_data : function (dom, data) {
                dom = this.get_node(dom);
                dom.children = [];
                dom.children_d = [];
                var dat = data.is('ul') ? data.children() : data,
                    par = dom.id,
                    chd = [],
                    dpc = [],
                    m = this._model.data,
                    p = m[par],
                    s = this._data.core.selected.length,
                    tmp, i, j;
                dat.each($.proxy(function (i, v) {
                    tmp = this._parse_model_from_html($(v), par, p.parents.concat());
                    if(tmp) {
                        chd.push(tmp);
                        dpc.push(tmp);
                        if(m[tmp].children_d.length) {
                            dpc = dpc.concat(m[tmp].children_d);
                        }
                    }
                }, this));
                p.children = chd;
                p.children_d = dpc;
                for(i = 0, j = p.parents.length; i < j; i++) {
                    m[p.parents[i]].children_d = m[p.parents[i]].children_d.concat(dpc);
                }
                /**
                 * triggered when new data is inserted to the tree model
                 * @event
                 * @name model.jstree
                 * @param {Array} nodes an array of node IDs
                 * @param {String} parent the parent ID of the nodes
                 */
                this.trigger('model', { "nodes" : dpc, 'parent' : par });
                if(par !== '#') {
                    this._node_changed(par);
                    this.redraw();
                }
                else {
                    this.get_container_ul().children('.jstree-initial-node').remove();
                    this.redraw(true);
                }
                if(this._data.core.selected.length !== s) {
                    this.trigger('changed', { 'action' : 'model', 'selected' : this._data.core.selected });
                }
                return true;
            },
            /**
             * appends JSON content to the tree. Used internally.
             * @private
             * @name _append_json_data(obj, data)
             * @param  {mixed} obj the node to append to
             * @param  {String} data the JSON object to parse and append
             * @return {Boolean}
             */
            _append_json_data : function (dom, data) {
                dom = this.get_node(dom);
                dom.children = [];
                dom.children_d = [];
                var dat = data,
                    par = dom.id,
                    chd = [],
                    dpc = [],
                    m = this._model.data,
                    p = m[par],
                    s = this._data.core.selected.length,
                    tmp, i, j;
                // *%$@!!!
                if(dat.d) {
                    dat = dat.d;
                    if(typeof dat === "string") {
                        dat = $.vakata.json.decode(dat);
                    }
                }
                if(!$.isArray(dat)) { dat = [dat]; }
                if(dat.length && dat[0].id !== undefined && dat[0].parent !== undefined) {
                    // Flat JSON support (for easy import from DB):
                    // 1) convert to object (foreach)
                    for(i = 0, j = dat.length; i < j; i++) {
                        if(!dat[i].children) {
                            dat[i].children = [];
                        }
                        m[dat[i].id] = dat[i];
                    }
                    // 2) populate children (foreach)
                    for(i = 0, j = dat.length; i < j; i++) {
                        m[dat[i].parent].children.push(dat[i].id);
                        // populate parent.children_d
                        p.children_d.push(dat[i].id);
                    }
                    // 3) normalize && populate parents and children_d with recursion
                    for(i = 0, j = p.children.length; i < j; i++) {
                        tmp = this._parse_model_from_flat_json(m[p.children[i]], par, p.parents.concat());
                        dpc.push(tmp);
                        if(m[tmp].children_d.length) {
                            dpc = dpc.concat(m[tmp].children_d);
                        }
                    }
                    // ?) three_state selection - p.state.selected && t - (if three_state foreach(dat => ch) -> foreach(parents) if(parent.selected) child.selected = true;
                }
                else {
                    for(i = 0, j = dat.length; i < j; i++) {
                        tmp = this._parse_model_from_json(dat[i], par, p.parents.concat());
                        if(tmp) {
                            chd.push(tmp);
                            dpc.push(tmp);
                            if(m[tmp].children_d.length) {
                                dpc = dpc.concat(m[tmp].children_d);
                            }
                        }
                    }
                    p.children = chd;
                    p.children_d = dpc;
                    for(i = 0, j = p.parents.length; i < j; i++) {
                        m[p.parents[i]].children_d = m[p.parents[i]].children_d.concat(dpc);
                    }
                }
                this.trigger('model', { "nodes" : dpc, 'parent' : par });

                if(par !== '#') {
                    this._node_changed(par);
                    this.redraw();
                }
                else {
                    // this.get_container_ul().children('.jstree-initial-node').remove();
                    this.redraw(true);
                }
                if(this._data.core.selected.length !== s) {
                    this.trigger('changed', { 'action' : 'model', 'selected' : this._data.core.selected });
                }
                return true;
            },
            /**
             * parses a node from a jQuery object and appends them to the in memory tree model. Used internally.
             * @private
             * @name _parse_model_from_html(d [, p, ps])
             * @param  {jQuery} d the jQuery object to parse
             * @param  {String} p the parent ID
             * @param  {Array} ps list of all parents
             * @return {String} the ID of the object added to the model
             */
            _parse_model_from_html : function (d, p, ps) {
                if(!ps) { ps = []; }
                else { ps = [].concat(ps); }
                if(p) { ps.unshift(p); }
                var c, e, m = this._model.data,
                    data = {
                        id			: false,
                        text		: false,
                        icon		: true,
                        parent		: p,
                        parents		: ps,
                        children	: [],
                        children_d	: [],
                        data		: null,
                        state		: { },
                        li_attr		: { id : false },
                        a_attr		: { href : '#' },
                        original	: false
                    }, i, tmp, tid;
                for(i in this._model.default_state) {
                    if(this._model.default_state.hasOwnProperty(i)) {
                        data.state[i] = this._model.default_state[i];
                    }
                }
                tmp = $.vakata.attributes(d, true);
                $.each(tmp, function (i, v) {
                    v = $.trim(v);
                    if(!v.length) { return true; }
                    data.li_attr[i] = v;
                    if(i === 'id') {
                        data.id = v;
                    }
                });
                tmp = d.children('a').eq(0);
                if(tmp.length) {
                    tmp = $.vakata.attributes(tmp, true);
                    $.each(tmp, function (i, v) {
                        v = $.trim(v);
                        if(v.length) {
                            data.a_attr[i] = v;
                        }
                    });
                }
                tmp = d.children("a:eq(0)").length ? d.children("a:eq(0)").clone() : d.clone();
                tmp.children("ins, i, ul").remove();
                tmp = tmp.html();
                tmp = $('<div />').html(tmp);
                data.text = tmp.html();
                tmp = d.data();
                data.data = tmp ? $.extend(true, {}, tmp) : null;
                data.state.opened = d.hasClass('jstree-open');
                data.state.selected = d.children('a').hasClass('jstree-clicked');
                data.state.disabled = d.children('a').hasClass('jstree-disabled');
                if(data.data && data.data.jstree) {
                    for(i in data.data.jstree) {
                        if(data.data.jstree.hasOwnProperty(i)) {
                            data.state[i] = data.data.jstree[i];
                        }
                    }
                }
                tmp = d.children("a").children(".jstree-themeicon");
                if(tmp.length) {
                    data.icon = tmp.hasClass('jstree-themeicon-hidden') ? false : tmp.attr('rel');
                }
                if(data.state.icon) {
                    data.icon = data.state.icon;
                }
                tmp = d.children("ul").children("li");
                do {
                    tid = 'j' + this._id + '_' + (++this._cnt);
                } while(m[tid]);
                data.id = data.li_attr.id || tid;
                if(tmp.length) {
                    tmp.each($.proxy(function (i, v) {
                        c = this._parse_model_from_html($(v), data.id, ps);
                        e = this._model.data[c];
                        data.children.push(c);
                        if(e.children_d.length) {
                            data.children_d = data.children_d.concat(e.children_d);
                        }
                    }, this));
                    data.children_d = data.children_d.concat(data.children);
                }
                else {
                    if(d.hasClass('jstree-closed')) {
                        data.state.loaded = false;
                    }
                }
                if(data.li_attr['class']) {
                    data.li_attr['class'] = data.li_attr['class'].replace('jstree-closed','').replace('jstree-open','');
                }
                if(data.a_attr['class']) {
                    data.a_attr['class'] = data.a_attr['class'].replace('jstree-clicked','').replace('jstree-disabled','');
                }
                m[data.id] = data;
                if(data.state.selected) {
                    this._data.core.selected.push(data.id);
                }
                return data.id;
            },
            /**
             * parses a node from a JSON object (used when dealing with flat data, which has no nesting of children, but has id and parent properties) and appends it to the in memory tree model. Used internally.
             * @private
             * @name _parse_model_from_flat_json(d [, p, ps])
             * @param  {Object} d the JSON object to parse
             * @param  {String} p the parent ID
             * @param  {Array} ps list of all parents
             * @return {String} the ID of the object added to the model
             */
            _parse_model_from_flat_json : function (d, p, ps) {
                if(!ps) { ps = []; }
                else { ps = ps.concat(); }
                if(p) { ps.unshift(p); }
                var tid = d.id,
                    m = this._model.data,
                    df = this._model.default_state,
                    i, j, c, e,
                    tmp = {
                        id			: tid,
                        text		: d.text || '',
                        icon		: d.icon !== undefined ? d.icon : true,
                        parent		: p,
                        parents		: ps,
                        children	: d.children || [],
                        children_d	: d.children_d || [],
                        data		: d.data,
                        state		: { },
                        li_attr		: { id : false },
                        a_attr		: { href : '#' },
                        original	: false
                    };
                for(i in df) {
                    if(df.hasOwnProperty(i)) {
                        tmp.state[i] = df[i];
                    }
                }
                if(d && d.data && d.data.jstree && d.data.jstree.icon) {
                    tmp.icon = d.data.jstree.icon;
                }
                if(d && d.data) {
                    tmp.data = d.data;
                    if(d.data.jstree) {
                        for(i in d.data.jstree) {
                            if(d.data.jstree.hasOwnProperty(i)) {
                                tmp.state[i] = d.data.jstree[i];
                            }
                        }
                    }
                }
                if(d && typeof d.state === 'object') {
                    for (i in d.state) {
                        if(d.state.hasOwnProperty(i)) {
                            tmp.state[i] = d.state[i];
                        }
                    }
                }
                if(d && typeof d.li_attr === 'object') {
                    for (i in d.li_attr) {
                        if(d.li_attr.hasOwnProperty(i)) {
                            tmp.li_attr[i] = d.li_attr[i];
                        }
                    }
                }
                if(!tmp.li_attr.id) {
                    tmp.li_attr.id = tid;
                }
                if(d && typeof d.a_attr === 'object') {
                    for (i in d.a_attr) {
                        if(d.a_attr.hasOwnProperty(i)) {
                            tmp.a_attr[i] = d.a_attr[i];
                        }
                    }
                }
                if(d && d.children && d.children === true) {
                    tmp.state.loaded = false;
                    tmp.children = [];
                    tmp.children_d = [];
                }
                m[tmp.id] = tmp;
                for(i = 0, j = tmp.children.length; i < j; i++) {
                    c = this._parse_model_from_flat_json(m[tmp.children[i]], tmp.id, ps);
                    e = m[c];
                    tmp.children_d.push(c);
                    if(e.children_d.length) {
                        tmp.children_d = tmp.children_d.concat(e.children_d);
                    }
                }
                delete d.data;
                delete d.children;
                m[tmp.id].original = d;
                if(tmp.state.selected) {
                    this._data.core.selected.push(tmp.id);
                }
                return tmp.id;
            },
            /**
             * parses a node from a JSON object and appends it to the in memory tree model. Used internally.
             * @private
             * @name _parse_model_from_json(d [, p, ps])
             * @param  {Object} d the JSON object to parse
             * @param  {String} p the parent ID
             * @param  {Array} ps list of all parents
             * @return {String} the ID of the object added to the model
             */
            _parse_model_from_json : function (d, p, ps) {
                if(!ps) { ps = []; }
                else { ps = ps.concat(); }
                if(p) { ps.unshift(p); }
                var tid = false, i, j, c, e, m = this._model.data, df = this._model.default_state, tmp;
                do {
                    tid = 'j' + this._id + '_' + (++this._cnt);
                } while(m[tid]);

                tmp = {
                    id			: false,
                    text		: typeof d === 'string' ? d : '',
                    icon		: typeof d === 'object' && d.icon !== undefined ? d.icon : true,
                    parent		: p,
                    parents		: ps,
                    children	: [],
                    children_d	: [],
                    data		: null,
                    state		: { },
                    li_attr		: { id : false },
                    a_attr		: { href : '#' },
                    original	: false
                };
                for(i in df) {
                    if(df.hasOwnProperty(i)) {
                        tmp.state[i] = df[i];
                    }
                }
                if(d && d.id) { tmp.id = d.id; }
                if(d && d.text) { tmp.text = d.text; }
                if(d && d.data && d.data.jstree && d.data.jstree.icon) {
                    tmp.icon = d.data.jstree.icon;
                }
                if(d && d.data) {
                    tmp.data = d.data;
                    if(d.data.jstree) {
                        for(i in d.data.jstree) {
                            if(d.data.jstree.hasOwnProperty(i)) {
                                tmp.state[i] = d.data.jstree[i];
                            }
                        }
                    }
                }
                if(d && typeof d.state === 'object') {
                    for (i in d.state) {
                        if(d.state.hasOwnProperty(i)) {
                            tmp.state[i] = d.state[i];
                        }
                    }
                }
                if(d && typeof d.li_attr === 'object') {
                    for (i in d.li_attr) {
                        if(d.li_attr.hasOwnProperty(i)) {
                            tmp.li_attr[i] = d.li_attr[i];
                        }
                    }
                }
                if(tmp.li_attr.id && !tmp.id) {
                    tmp.id = tmp.li_attr.id;
                }
                if(!tmp.id) {
                    tmp.id = tid;
                }
                if(!tmp.li_attr.id) {
                    tmp.li_attr.id = tmp.id;
                }
                if(d && typeof d.a_attr === 'object') {
                    for (i in d.a_attr) {
                        if(d.a_attr.hasOwnProperty(i)) {
                            tmp.a_attr[i] = d.a_attr[i];
                        }
                    }
                }
                if(d && d.children && d.children.length) {
                    for(i = 0, j = d.children.length; i < j; i++) {
                        c = this._parse_model_from_json(d.children[i], tmp.id, ps);
                        e = m[c];
                        tmp.children.push(c);
                        if(e.children_d.length) {
                            tmp.children_d = tmp.children_d.concat(e.children_d);
                        }
                    }
                    tmp.children_d = tmp.children_d.concat(tmp.children);
                }
                if(d && d.children && d.children === true) {
                    tmp.state.loaded = false;
                    tmp.children = [];
                    tmp.children_d = [];
                }
                delete d.data;
                delete d.children;
                tmp.original = d;
                m[tmp.id] = tmp;
                if(tmp.state.selected) {
                    this._data.core.selected.push(tmp.id);
                }
                return tmp.id;
            },
            /**
             * redraws all nodes that need to be redrawn. Used internally.
             * @private
             * @name _redraw()
             * @trigger redraw.jstree
             */
            _redraw : function () {
                var nodes = this._model.force_full_redraw ? this._model.data['#'].children.concat([]) : this._model.changed.concat([]),
                    f = document.createElement('UL'), tmp, i, j;
                for(i = 0, j = nodes.length; i < j; i++) {
                    tmp = this.redraw_node(nodes[i], true, this._model.force_full_redraw);
                    if(tmp && this._model.force_full_redraw) {
                        f.appendChild(tmp);
                    }
                }
                if(this._model.force_full_redraw) {
                    f.className = this.get_container_ul()[0].className;
                    this.element.empty().append(f);
                    //this.get_container_ul()[0].appendChild(f);
                }
                this._model.force_full_redraw = false;
                this._model.changed = [];
                /**
                 * triggered after nodes are redrawn
                 * @event
                 * @name redraw.jstree
                 * @param {array} nodes the redrawn nodes
                 */
                this.trigger('redraw', { "nodes" : nodes });
            },
            /**
             * redraws all nodes that need to be redrawn or optionally - the whole tree
             * @name redraw([full])
             * @param {Boolean} full if set to `true` all nodes are redrawn.
             */
            redraw : function (full) {
                if(full) {
                    this._model.force_full_redraw = true;
                }
                //if(this._model.redraw_timeout) {
                //	clearTimeout(this._model.redraw_timeout);
                //}
                //this._model.redraw_timeout = setTimeout($.proxy(this._redraw, this),0);
                this._redraw();
            },
            /**
             * redraws a single node. Used internally.
             * @private
             * @name redraw_node(node, deep, is_callback)
             * @param {mixed} node the node to redraw
             * @param {Boolean} deep should child nodes be redrawn too
             * @param {Boolean} is_callback is this a recursion call
             */
            redraw_node : function (node, deep, is_callback) {
                var obj = this.get_node(node),
                    par = false,
                    ind = false,
                    old = false,
                    i = false,
                    j = false,
                    k = false,
                    c = '',
                    d = document,
                    m = this._model.data;
                if(!obj) { return false; }
                if(obj.id === '#') {  return this.redraw(true); }
                deep = deep || obj.children.length === 0;
                node = d.getElementById(obj.id); //, this.element);
                if(!node) {
                    deep = true;
                    //node = d.createElement('LI');
                    if(!is_callback) {
                        par = obj.parent !== '#' ? $('#' + obj.parent, this.element)[0] : null;
                        if(par !== null && (!par || !m[obj.parent].state.opened)) {
                            return false;
                        }
                        ind = $.inArray(obj.id, par === null ? m['#'].children : m[obj.parent].children);
                    }
                }
                else {
                    node = $(node);
                    if(!is_callback) {
                        par = node.parent().parent()[0];
                        if(par === this.element[0]) {
                            par = null;
                        }
                        ind = node.index();
                    }
                    // m[obj.id].data = node.data(); // use only node's data, no need to touch jquery storage
                    if(!deep && obj.children.length && !node.children('ul').length) {
                        deep = true;
                    }
                    if(!deep) {
                        old = node.children('UL')[0];
                    }
                    node.remove();
                    //node = d.createElement('LI');
                    //node = node[0];
                }
                node = _node.cloneNode(true);
                // node is DOM, deep is boolean

                c = 'jstree-node ';
                for(i in obj.li_attr) {
                    if(obj.li_attr.hasOwnProperty(i)) {
                        if(i === 'id') { continue; }
                        if(i !== 'class') {
                            node.setAttribute(i, obj.li_attr[i]);
                        }
                        else {
                            c += obj.li_attr[i];
                        }
                    }
                }
                if(!obj.children.length && obj.state.loaded) {
                    c += ' jstree-leaf';
                }
                else {
                    c += obj.state.opened ? ' jstree-open' : ' jstree-closed';
                    node.setAttribute('aria-expanded', obj.state.opened);
                }
                if(obj.parent !== null && m[obj.parent].children[m[obj.parent].children.length - 1] === obj.id) {
                    c += ' jstree-last';
                }
                node.id = obj.id;
                node.className = c;
                c = ( obj.state.selected ? ' jstree-clicked' : '') + ( obj.state.disabled ? ' jstree-disabled' : '');
                for(j in obj.a_attr) {
                    if(obj.a_attr.hasOwnProperty(j)) {
                        if(j === 'href' && obj.a_attr[j] === '#') { continue; }
                        if(j !== 'class') {
                            node.childNodes[1].setAttribute(j, obj.a_attr[j]);
                        }
                        else {
                            c += ' ' + obj.a_attr[j];
                        }
                    }
                }
                if(c.length) {
                    node.childNodes[1].className = 'jstree-anchor ' + c;
                }
                if((obj.icon && obj.icon !== true) || obj.icon === false) {
                    if(obj.icon === false) {
                        node.childNodes[1].childNodes[0].className += ' jstree-themeicon-hidden';
                    }
                    else if(obj.icon.indexOf('/') === -1 && obj.icon.indexOf('.') === -1) {
                        node.childNodes[1].childNodes[0].className += ' ' + obj.icon + ' jstree-themeicon-custom';
                    }
                    else {
                        node.childNodes[1].childNodes[0].style.backgroundImage = 'url('+obj.icon+')';
                        node.childNodes[1].childNodes[0].style.backgroundPosition = 'center center';
                        node.childNodes[1].childNodes[0].style.backgroundSize = 'auto';
                        node.childNodes[1].childNodes[0].className += ' jstree-themeicon-custom';
                    }
                }
                //node.childNodes[1].appendChild(d.createTextNode(obj.text));
                node.childNodes[1].innerHTML += obj.text;
                // if(obj.data) { $.data(node, obj.data); } // always work with node's data, no need to touch jquery store

                if(deep && obj.children.length && obj.state.opened) {
                    k = d.createElement('UL');
                    k.setAttribute('role', 'group');
                    k.className = 'jstree-children';
                    for(i = 0, j = obj.children.length; i < j; i++) {
                        k.appendChild(this.redraw_node(obj.children[i], deep, true));
                    }
                    node.appendChild(k);
                }
                if(old) {
                    node.appendChild(old);
                }
                if(!is_callback) {
                    // append back using par / ind
                    if(!par) {
                        par = this.element[0];
                    }
                    if(!par.getElementsByTagName('UL').length) {
                        i = d.createElement('UL');
                        i.setAttribute('role', 'group');
                        i.className = 'jstree-children';
                        par.appendChild(i);
                        par = i;
                    }
                    else {
                        par = par.getElementsByTagName('UL')[0];
                    }

                    if(ind < par.childNodes.length) {
                        par.insertBefore(node, par.childNodes[ind]);
                    }
                    else {
                        par.appendChild(node);
                    }
                }
                return node;
            },
            /**
             * opens a node, revaling its children. If the node is not loaded it will be loaded and opened once ready.
             * @name open_node(obj [, callback, animation])
             * @param {mixed} obj the node to open
             * @param {Function} callback a function to execute once the node is opened
             * @param {Number} animation the animation duration in milliseconds when opening the node (overrides the `core.animation` setting). Use `false` for no animation.
             * @trigger open_node.jstree, after_open.jstree
             */
            open_node : function (obj, callback, animation) {
                var t1, t2, d, t;
                if($.isArray(obj)) {
                    obj = obj.slice();
                    for(t1 = 0, t2 = obj.length; t1 < t2; t1++) {
                        this.open_node(obj[t1], callback, animation);
                    }
                    return true;
                }
                obj = this.get_node(obj);
                if(!obj || obj.id === '#') {
                    return false;
                }
                animation = animation === undefined ? this.settings.core.animation : animation;
                if(!this.is_closed(obj)) {
                    if(callback) {
                        callback.call(this, obj, false);
                    }
                    return false;
                }
                if(!this.is_loaded(obj)) {
                    if(this.is_loading(obj)) {
                        return setTimeout($.proxy(function () {
                            this.open_node(obj, callback, animation);
                        }, this), 500);
                    }
                    this.load_node(obj, function (o, ok) {
                        return ok ? this.open_node(o, callback, animation) : (callback ? callback.call(this, o, false) : false);
                    });
                }
                else {
                    d = this.get_node(obj, true);
                    t = this;
                    if(d.length) {
                        if(obj.children.length && !this._firstChild(d.children('ul')[0])) {
                            obj.state.opened = true;
                            this.redraw_node(obj, true);
                            d = this.get_node(obj, true);
                        }
                        if(!animation) {
                            d[0].className = d[0].className.replace('jstree-closed', 'jstree-open');
                            d[0].setAttribute("aria-expanded", true);
                        }
                        else {
                            d
                                .children("ul").css("display","none").end()
                                .removeClass("jstree-closed").addClass("jstree-open").attr("aria-expanded", true)
                                .children("ul").stop(true, true)
                                    .slideDown(animation, function () {
                                        this.style.display = "";
                                        t.trigger("after_open", { "node" : obj });
                                    });
                        }
                    }
                    obj.state.opened = true;
                    if(callback) {
                        callback.call(this, obj, true);
                    }
                    /**
                     * triggered when a node is opened (if there is an animation it will not be completed yet)
                     * @event
                     * @name open_node.jstree
                     * @param {Object} node the opened node
                     */
                    this.trigger('open_node', { "node" : obj });
                    if(!animation || !d.length) {
                        /**
                         * triggered when a node is opened and the animation is complete
                         * @event
                         * @name after_open.jstree
                         * @param {Object} node the opened node
                         */
                        this.trigger("after_open", { "node" : obj });
                    }
                }
            },
            /**
             * opens every parent of a node (node should be loaded)
             * @name _open_to(obj)
             * @param {mixed} obj the node to reveal
             * @private
             */
            _open_to : function (obj) {
                obj = this.get_node(obj);
                if(!obj || obj.id === '#') {
                    return false;
                }
                var i, j, p = obj.parents;
                for(i = 0, j = p.length; i < j; i+=1) {
                    if(i !== '#') {
                        this.open_node(p[i], false, 0);
                    }
                }
                return $(document.getElementById(obj.id));
            },
            /**
             * closes a node, hiding its children
             * @name close_node(obj [, animation])
             * @param {mixed} obj the node to close
             * @param {Number} animation the animation duration in milliseconds when closing the node (overrides the `core.animation` setting). Use `false` for no animation.
             * @trigger close_node.jstree, after_close.jstree
             */
            close_node : function (obj, animation) {
                var t1, t2, t, d;
                if($.isArray(obj)) {
                    obj = obj.slice();
                    for(t1 = 0, t2 = obj.length; t1 < t2; t1++) {
                        this.close_node(obj[t1], animation);
                    }
                    return true;
                }
                obj = this.get_node(obj);
                if(!obj || obj.id === '#') {
                    return false;
                }
                animation = animation === undefined ? this.settings.core.animation : animation;
                t = this;
                d = this.get_node(obj, true);
                if(d.length) {
                    if(!animation) {
                        d[0].className = d[0].className.replace('jstree-open', 'jstree-closed');
                        d.attr("aria-expanded", false).children('ul').remove();
                    }
                    else {
                        d
                            .children("ul").attr("style","display:block !important").end()
                            .removeClass("jstree-open").addClass("jstree-closed").attr("aria-expanded", false)
                            .children("ul").stop(true, true).slideUp(animation, function () {
                                this.style.display = "";
                                d.children('ul').remove();
                                t.trigger("after_close", { "node" : obj });
                            });
                    }
                }
                obj.state.opened = false;
                /**
                 * triggered when a node is closed (if there is an animation it will not be complete yet)
                 * @event
                 * @name close_node.jstree
                 * @param {Object} node the closed node
                 */
                this.trigger('close_node',{ "node" : obj });
                if(!animation || !d.length) {
                    /**
                     * triggered when a node is closed and the animation is complete
                     * @event
                     * @name after_close.jstree
                     * @param {Object} node the closed node
                     */
                    this.trigger("after_close", { "node" : obj });
                }
            },
            /**
             * toggles a node - closing it if it is open, opening it if it is closed
             * @name toggle_node(obj)
             * @param {mixed} obj the node to toggle
             */
            toggle_node : function (obj) {
                var t1, t2;
                if($.isArray(obj)) {
                    obj = obj.slice();
                    for(t1 = 0, t2 = obj.length; t1 < t2; t1++) {
                        this.toggle_node(obj[t1]);
                    }
                    return true;
                }
                if(this.is_closed(obj)) {
                    return this.open_node(obj);
                }
                if(this.is_open(obj)) {
                    return this.close_node(obj);
                }
            },
            /**
             * opens all nodes within a node (or the tree), revaling their children. If the node is not loaded it will be loaded and opened once ready.
             * @name open_all([obj, animation, original_obj])
             * @param {mixed} obj the node to open recursively, omit to open all nodes in the tree
             * @param {Number} animation the animation duration in milliseconds when opening the nodes, the default is no animation
             * @param {jQuery} reference to the node that started the process (internal use)
             * @trigger open_all.jstree
             */
            open_all : function (obj, animation, original_obj) {
                if(!obj) { obj = '#'; }
                obj = this.get_node(obj);
                if(!obj) { return false; }
                var dom = obj.id === '#' ? this.get_container_ul() : this.get_node(obj, true), i, j, _this;
                if(!dom.length) {
                    for(i = 0, j = obj.children_d.length; i < j; i++) {
                        if(this.is_closed(this._model.data[obj.children_d[i]])) {
                            this._model.data[obj.children_d[i]].state.opened = true;
                        }
                    }
                    return this.trigger('open_all', { "node" : obj });
                }
                original_obj = original_obj || dom;
                _this = this;
                dom = this.is_closed(obj) ? dom.find('li.jstree-closed').addBack() : dom.find('li.jstree-closed');
                dom.each(function () {
                    _this.open_node(
                        this,
                        function(node, status) { if(status && this.is_parent(node)) { this.open_all(node, animation, original_obj); } },
                        animation || 0
                    );
                });
                if(original_obj.find('li.jstree-closed').length === 0) {
                    /**
                     * triggered when an `open_all` call completes
                     * @event
                     * @name open_all.jstree
                     * @param {Object} node the opened node
                     */
                    this.trigger('open_all', { "node" : this.get_node(original_obj) });
                }
            },
            /**
             * closes all nodes within a node (or the tree), revaling their children
             * @name close_all([obj, animation])
             * @param {mixed} obj the node to close recursively, omit to close all nodes in the tree
             * @param {Number} animation the animation duration in milliseconds when closing the nodes, the default is no animation
             * @trigger close_all.jstree
             */
            close_all : function (obj, animation) {
                if(!obj) { obj = '#'; }
                obj = this.get_node(obj);
                if(!obj) { return false; }
                var dom = obj.id === '#' ? this.get_container_ul() : this.get_node(obj, true),
                    _this = this, i, j;
                if(!dom.length) {
                    for(i = 0, j = obj.children_d.length; i < j; i++) {
                        this._model.data[obj.children_d[i]].state.opened = false;
                    }
                    return this.trigger('close_all', { "node" : obj });
                }
                dom = this.is_open(obj) ? dom.find('li.jstree-open').addBack() : dom.find('li.jstree-open');
                dom.vakata_reverse().each(function () { _this.close_node(this, animation || 0); });
                /**
                 * triggered when an `close_all` call completes
                 * @event
                 * @name close_all.jstree
                 * @param {Object} node the closed node
                 */
                this.trigger('close_all', { "node" : obj });
            },
            /**
             * checks if a node is disabled (not selectable)
             * @name is_disabled(obj)
             * @param  {mixed} obj
             * @return {Boolean}
             */
            is_disabled : function (obj) {
                obj = this.get_node(obj);
                return obj && obj.state && obj.state.disabled;
            },
            /**
             * enables a node - so that it can be selected
             * @name enable_node(obj)
             * @param {mixed} obj the node to enable
             * @trigger enable_node.jstree
             */
            enable_node : function (obj) {
                var t1, t2;
                if($.isArray(obj)) {
                    obj = obj.slice();
                    for(t1 = 0, t2 = obj.length; t1 < t2; t1++) {
                        this.enable_node(obj[t1]);
                    }
                    return true;
                }
                obj = this.get_node(obj);
                if(!obj || obj.id === '#') {
                    return false;
                }
                obj.state.disabled = false;
                this.get_node(obj,true).children('.jstree-anchor').removeClass('jstree-disabled');
                /**
                 * triggered when an node is enabled
                 * @event
                 * @name enable_node.jstree
                 * @param {Object} node the enabled node
                 */
                this.trigger('enable_node', { 'node' : obj });
            },
            /**
             * disables a node - so that it can not be selected
             * @name disable_node(obj)
             * @param {mixed} obj the node to disable
             * @trigger disable_node.jstree
             */
            disable_node : function (obj) {
                var t1, t2;
                if($.isArray(obj)) {
                    obj = obj.slice();
                    for(t1 = 0, t2 = obj.length; t1 < t2; t1++) {
                        this.disable_node(obj[t1]);
                    }
                    return true;
                }
                obj = this.get_node(obj);
                if(!obj || obj.id === '#') {
                    return false;
                }
                obj.state.disabled = true;
                this.get_node(obj,true).children('.jstree-anchor').addClass('jstree-disabled');
                /**
                 * triggered when an node is disabled
                 * @event
                 * @name disable_node.jstree
                 * @param {Object} node the disabled node
                 */
                this.trigger('disable_node', { 'node' : obj });
            },
            /**
             * called when a node is selected by the user. Used internally.
             * @private
             * @name activate_node(obj, e)
             * @param {mixed} obj the node
             * @param {Object} e the related event
             * @trigger activate_node.jstree
             */
            activate_node : function (obj, e) {
                if(this.is_disabled(obj)) {
                    return false;
                }
                if(!this.settings.core.multiple || (!e.metaKey && !e.ctrlKey && !e.shiftKey) || (e.shiftKey && (!this._data.core.last_clicked || !this.get_parent(obj) || this.get_parent(obj) !== this._data.core.last_clicked.parent ) )) {
                    this.deselect_all(true);
                    this.select_node(obj, false, false, e);
                    this._data.core.last_clicked = this.get_node(obj);
                }
                else {
                    if(e.shiftKey) {
                        var o = this.get_node(obj).id,
                            l = this._data.core.last_clicked.id,
                            p = this.get_node(this._data.core.last_clicked.parent).children,
                            c = false,
                            i, j;
                        for(i = 0, j = p.length; i < j; i += 1) {
                            // separate IFs work whem o and l are the same
                            if(p[i] === o) {
                                c = !c;
                            }
                            if(p[i] === l) {
                                c = !c;
                            }
                            if(c || p[i] === o || p[i] === l) {
                                this.select_node(p[i], false, false, e);
                            }
                            else {
                                this.deselect_node(p[i], false, false, e);
                            }
                        }
                    }
                    else {
                        if(!this.is_selected(obj)) {
                            this.select_node(obj, false, false, e);
                        }
                        else {
                            this.deselect_node(obj, false, false, e);
                        }
                    }
                }
                /**
                 * triggered when an node is clicked or intercated with by the user
                 * @event
                 * @name activate_node.jstree
                 * @param {Object} node
                 */
                this.trigger('activate_node', { 'node' : this.get_node(obj) });
            },
            /**
             * applies the hover state on a node, called when a node is hovered by the user. Used internally.
             * @private
             * @name hover_node(obj)
             * @param {mixed} obj
             * @trigger hover_node.jstree
             */
            hover_node : function (obj) {
                obj = this.get_node(obj, true);
                if(!obj || !obj.length || obj.children('.jstree-hovered').length) {
                    return false;
                }
                var o = this.element.find('.jstree-hovered');
                if(o && o.length) { this.dehover_node(o); }

                obj.attr('aria-selected', true).children('.jstree-anchor').addClass('jstree-hovered');
                this.element.attr('aria-activedescendant', obj[0].id);
                /**
                 * triggered when an node is hovered
                 * @event
                 * @name hover_node.jstree
                 * @param {Object} node
                 */
                this.trigger('hover_node', { 'node' : this.get_node(obj) });
            },
            /**
             * removes the hover state from a nodecalled when a node is no longer hovered by the user. Used internally.
             * @private
             * @name dehover_node(obj)
             * @param {mixed} obj
             * @trigger dehover_node.jstree
             */
            dehover_node : function (obj) {
                obj = this.get_node(obj, true);
                if(!obj || !obj.length || !obj.children('.jstree-hovered').length) {
                    return false;
                }
                obj.attr('aria-selected', false).children('.jstree-anchor').removeClass('jstree-hovered');
                /**
                 * triggered when an node is no longer hovered
                 * @event
                 * @name dehover_node.jstree
                 * @param {Object} node
                 */
                this.trigger('dehover_node', { 'node' : this.get_node(obj) });
            },
            /**
             * select a node
             * @name select_node(obj [, supress_event, prevent_open])
             * @param {mixed} obj an array can be used to select multiple nodes
             * @param {Boolean} supress_event if set to `true` the `changed.jstree` event won't be triggered
             * @param {Boolean} prevent_open if set to `true` parents of the selected node won't be opened
             * @trigger select_node.jstree, changed.jstree
             */
            select_node : function (obj, supress_event, prevent_open, e) {
                var dom, t1, t2, th;
                if($.isArray(obj)) {
                    obj = obj.slice();
                    for(t1 = 0, t2 = obj.length; t1 < t2; t1++) {
                        this.select_node(obj[t1], supress_event, prevent_open, e);
                    }
                    return true;
                }
                obj = this.get_node(obj);
                if(!obj || obj.id === '#') {
                    return false;
                }
                dom = this.get_node(obj, true);
                if(!obj.state.selected) {
                    obj.state.selected = true;
                    this._data.core.selected.push(obj.id);
                    if(!prevent_open) {
                        dom = this._open_to(obj);
                    }
                    if(dom && dom.length) {
                        dom.children('.jstree-anchor').addClass('jstree-clicked');
                    }
                    /**
                     * triggered when an node is selected
                     * @event
                     * @name select_node.jstree
                     * @param {Object} node
                     * @param {Array} selected the current selection
                     * @param {Object} event the event (if any) that triggered this select_node
                     */
                    this.trigger('select_node', { 'node' : obj, 'selected' : this._data.core.selected, 'event' : e });
                    if(!supress_event) {
                        /**
                         * triggered when selection changes
                         * @event
                         * @name changed.jstree
                         * @param {Object} node
                         * @param {Object} action the action that caused the selection to change
                         * @param {Array} selected the current selection
                         * @param {Object} event the event (if any) that triggered this changed event
                         */
                        this.trigger('changed', { 'action' : 'select_node', 'node' : obj, 'selected' : this._data.core.selected, 'event' : e });
                    }
                }
            },
            /**
             * deselect a node
             * @name deselect_node(obj [, supress_event])
             * @param {mixed} obj an array can be used to deselect multiple nodes
             * @param {Boolean} supress_event if set to `true` the `changed.jstree` event won't be triggered
             * @trigger deselect_node.jstree, changed.jstree
             */
            deselect_node : function (obj, supress_event, e) {
                var t1, t2, dom;
                if($.isArray(obj)) {
                    obj = obj.slice();
                    for(t1 = 0, t2 = obj.length; t1 < t2; t1++) {
                        this.deselect_node(obj[t1], supress_event, e);
                    }
                    return true;
                }
                obj = this.get_node(obj);
                if(!obj || obj.id === '#') {
                    return false;
                }
                dom = this.get_node(obj, true);
                if(obj.state.selected) {
                    obj.state.selected = false;
                    this._data.core.selected = $.vakata.array_remove_item(this._data.core.selected, obj.id);
                    if(dom.length) {
                        dom.children('.jstree-anchor').removeClass('jstree-clicked');
                    }
                    /**
                     * triggered when an node is deselected
                     * @event
                     * @name deselect_node.jstree
                     * @param {Object} node
                     * @param {Array} selected the current selection
                     * @param {Object} event the event (if any) that triggered this deselect_node
                     */
                    this.trigger('deselect_node', { 'node' : obj, 'selected' : this._data.core.selected, 'event' : e });
                    if(!supress_event) {
                        this.trigger('changed', { 'action' : 'deselect_node', 'node' : obj, 'selected' : this._data.core.selected, 'event' : e });
                    }
                }
            },
            /**
             * select all nodes in the tree
             * @name select_all([supress_event])
             * @param {Boolean} supress_event if set to `true` the `changed.jstree` event won't be triggered
             * @trigger select_all.jstree, changed.jstree
             */
            select_all : function (supress_event) {
                var tmp = this._data.core.selected.concat([]), i, j;
                this._data.core.selected = this._model.data['#'].children_d.concat();
                for(i = 0, j = this._data.core.selected.length; i < j; i++) {
                    if(this._model.data[this._data.core.selected[i]]) {
                        this._model.data[this._data.core.selected[i]].state.selected = true;
                    }
                }
                this.redraw(true);
                /**
                 * triggered when all nodes are selected
                 * @event
                 * @name select_all.jstree
                 * @param {Array} selected the current selection
                 */
                this.trigger('select_all', { 'selected' : this._data.core.selected });
                if(!supress_event) {
                    this.trigger('changed', { 'action' : 'select_all', 'selected' : this._data.core.selected, 'old_selection' : tmp });
                }
            },
            /**
             * deselect all selected nodes
             * @name deselect_all([supress_event])
             * @param {Boolean} supress_event if set to `true` the `changed.jstree` event won't be triggered
             * @trigger deselect_all.jstree, changed.jstree
             */
            deselect_all : function (supress_event) {
                var tmp = this._data.core.selected.concat([]), i, j;
                for(i = 0, j = this._data.core.selected.length; i < j; i++) {
                    if(this._model.data[this._data.core.selected[i]]) {
                        this._model.data[this._data.core.selected[i]].state.selected = false;
                    }
                }
                this._data.core.selected = [];
                this.element.find('.jstree-clicked').removeClass('jstree-clicked');
                /**
                 * triggered when all nodes are deselected
                 * @event
                 * @name deselect_all.jstree
                 * @param {Object} node the previous selection
                 * @param {Array} selected the current selection
                 */
                this.trigger('deselect_all', { 'selected' : this._data.core.selected, 'node' : tmp });
                if(!supress_event) {
                    this.trigger('changed', { 'action' : 'deselect_all', 'selected' : this._data.core.selected, 'old_selection' : tmp });
                }
            },
            /**
             * checks if a node is selected
             * @name is_selected(obj)
             * @param  {mixed}  obj
             * @return {Boolean}
             */
            is_selected : function (obj) {
                obj = this.get_node(obj);
                if(!obj || obj.id === '#') {
                    return false;
                }
                return obj.state.selected;
            },
            /**
             * get an array of all selected node IDs
             * @name get_selected([full])
             * @param  {mixed}  full if set to `true` the returned array will consist of the full node objects, otherwise - only IDs will be returned
             * @return {Array}
             */
            get_selected : function (full) {
                return full ? $.map(this._data.core.selected, $.proxy(function (i) { return this.get_node(i); }, this)) : this._data.core.selected;
            },
            /**
             * gets the current state of the tree so that it can be restored later with `set_state(state)`. Used internally.
             * @name get_state()
             * @private
             * @return {Object}
             */
            get_state : function () {
                var state	= {
                    'core' : {
                        'open' : [],
                        'scroll' : {
                            'left' : this.element.scrollLeft(),
                            'top' : this.element.scrollTop()
                        },
                        /*!
                        'themes' : {
                            'name' : this.get_theme(),
                            'icons' : this._data.core.themes.icons,
                            'dots' : this._data.core.themes.dots
                        },
                        */
                        'selected' : []
                    }
                }, i;
                for(i in this._model.data) {
                    if(this._model.data.hasOwnProperty(i)) {
                        if(i !== '#') {
                            if(this._model.data[i].state.opened) {
                                state.core.open.push(i);
                            }
                            if(this._model.data[i].state.selected) {
                                state.core.selected.push(i);
                            }
                        }
                    }
                }
                return state;
            },
            /**
             * sets the state of the tree. Used internally.
             * @name set_state(state [, callback])
             * @private
             * @param {Object} state the state to restore
             * @param {Function} callback an optional function to execute once the state is restored.
             * @trigger set_state.jstree
             */
            set_state : function (state, callback) {
                if(state) {
                    if(state.core) {
                        var res, n, t, _this;
                        if(state.core.open) {
                            if(!$.isArray(state.core.open)) {
                                delete state.core.open;
                                this.set_state(state, callback);
                                return false;
                            }
                            res = true;
                            n = false;
                            t = this;
                            $.each(state.core.open.concat([]), function (i, v) {
                                n = t.get_node(v);
                                if(n) {
                                    if(t.is_loaded(v)) {
                                        if(t.is_closed(v)) {
                                            t.open_node(v, false, 0);
                                        }
                                        if(state && state.core && state.core.open) {
                                            $.vakata.array_remove_item(state.core.open, v);
                                        }
                                    }
                                    else {
                                        if(!t.is_loading(v)) {
                                            t.open_node(v, $.proxy(function () { this.set_state(state); }, t), 0);
                                        }
                                        // there will be some async activity - so wait for it
                                        res = false;
                                    }
                                }
                            });
                            if(res) {
                                delete state.core.open;
                                this.set_state(state, callback);
                            }
                            return false;
                        }
                        if(state.core.scroll) {
                            if(state.core.scroll && state.core.scroll.left !== undefined) {
                                this.element.scrollLeft(state.core.scroll.left);
                            }
                            if(state.core.scroll && state.core.scroll.top !== undefined) {
                                this.element.scrollTop(state.core.scroll.top);
                            }
                            delete state.core.scroll;
                            this.set_state(state, callback);
                            return false;
                        }
                        /*!
                        if(state.core.themes) {
                            if(state.core.themes.name) {
                                this.set_theme(state.core.themes.name);
                            }
                            if(typeof state.core.themes.dots !== 'undefined') {
                                this[ state.core.themes.dots ? "show_dots" : "hide_dots" ]();
                            }
                            if(typeof state.core.themes.icons !== 'undefined') {
                                this[ state.core.themes.icons ? "show_icons" : "hide_icons" ]();
                            }
                            delete state.core.themes;
                            delete state.core.open;
                            this.set_state(state, callback);
                            return false;
                        }
                        */
                        if(state.core.selected) {
                            _this = this;
                            this.deselect_all();
                            $.each(state.core.selected, function (i, v) {
                                _this.select_node(v);
                            });
                            delete state.core.selected;
                            this.set_state(state, callback);
                            return false;
                        }
                        if($.isEmptyObject(state.core)) {
                            delete state.core;
                            this.set_state(state, callback);
                            return false;
                        }
                    }
                    if($.isEmptyObject(state)) {
                        state = null;
                        if(callback) { callback.call(this); }
                        /**
                         * triggered when a `set_state` call completes
                         * @event
                         * @name set_state.jstree
                         */
                        this.trigger('set_state');
                        return false;
                    }
                    return true;
                }
                return false;
            },
            /**
             * refreshes the tree - all nodes are reloaded with calls to `load_node`.
             * @name refresh()
             * @trigger refresh.jstree
             */
            refresh : function () {
                this._data.core.state = this.get_state();
                this._cnt = 0;
                this._model.data = {
                    '#' : {
                        id : '#',
                        parent : null,
                        parents : [],
                        children : [],
                        children_d : [],
                        state : { loaded : false }
                    }
                };
                this.element.html("<"+"ul class='jstree-container-ul'><"+"li class='jstree-initial-node jstree-loading jstree-leaf jstree-last'><i class='jstree-icon jstree-ocl'></i><"+"a class='jstree-anchor' href='#'><i class='jstree-icon jstree-themeicon-hidden'></i>" + this.get_string("Loading ...") + "</a></li></ul>");
                this.load_node('#', function (o, s) {
                    if(s) {
                        this.set_state($.extend(true, {}, this._data.core.state), function () {
                            /**
                             * triggered when a `refresh` call completes
                             * @event
                             * @name refresh.jstree
                             */
                            this.trigger('refresh');
                        });
                    }
                    this._data.core.state = null;
                });
            },
            /**
             * set (change) the ID of a node
             * @name set_id(obj, id)
             * @param  {mixed} obj the node
             * @param  {String} id the new ID
             * @return {Boolean}
             */
            set_id : function (obj, id) {
                obj = this.get_node(obj);
                if(!obj || obj.id === '#') { return false; }
                var i, j, m = this._model.data;
                // update parents (replace current ID with new one in children and children_d)
                m[obj.parent].children[$.inArray(obj.id, m[obj.parent].children)] = id;
                for(i = 0, j = obj.parents.length; i < j; i++) {
                    m[obj.parents[i]].children_d[$.inArray(obj.id, m[obj.parents[i]].children_d)] = id;
                }
                // update children (replace current ID with new one in parent and parents)
                for(i = 0, j = obj.children.length; i < j; i++) {
                    m[obj.children[i]].parent = id;
                }
                for(i = 0, j = obj.children_d.length; i < j; i++) {
                    m[obj.children_d[i]].parents[$.inArray(obj.id, m[obj.children_d[i]].parents)] = id;
                }
                i = $.inArray(obj.id, this._data.core.selected);
                if(i !== -1) { this._data.core.selected[i] = id; }
                // update model and obj itself (obj.id, this._model.data[KEY])
                i = this.get_node(obj.id, true);
                if(i) {
                    i.attr('id', id);
                }
                delete m[obj.id];
                obj.id = id;
                m[id] = obj;
                return true;
            },
            /**
             * get the text value of a node
             * @name get_text(obj)
             * @param  {mixed} obj the node
             * @return {String}
             */
            get_text : function (obj) {
                obj = this.get_node(obj);
                return (!obj || obj.id === '#') ? false : obj.text;
            },
            /**
             * set the text value of a node. Used internally, please use `rename_node(obj, val)`.
             * @private
             * @name set_text(obj, val)
             * @param  {mixed} obj the node, you can pass an array to set the text on multiple nodes
             * @param  {String} val the new text value
             * @return {Boolean}
             * @trigger set_text.jstree
             */
            set_text : function (obj, val) {
                var t1, t2, dom, tmp;
                if($.isArray(obj)) {
                    obj = obj.slice();
                    for(t1 = 0, t2 = obj.length; t1 < t2; t1++) {
                        this.set_text(obj[t1], val);
                    }
                    return true;
                }
                obj = this.get_node(obj);
                if(!obj || obj.id === '#') { return false; }
                obj.text = val;
                dom = this.get_node(obj, true);
                if(dom.length) {
                    dom = dom.children(".jstree-anchor:eq(0)");
                    tmp = dom.children("I").clone();
                    dom.html(val).prepend(tmp);
                    /**
                     * triggered when a node text value is changed
                     * @event
                     * @name set_text.jstree
                     * @param {Object} obj
                     * @param {String} text the new value
                     */
                    this.trigger('set_text',{ "obj" : obj, "text" : val });
                }
                return true;
            },
            /**
             * gets a JSON representation of a node (or the whole tree)
             * @name get_json([obj, options])
             * @param  {mixed} obj
             * @param  {Object} options
             * @param  {Boolean} options.no_state do not return state information
             * @param  {Boolean} options.no_id do not return ID
             * @param  {Boolean} options.no_children do not include children
             * @param  {Boolean} options.no_data do not include node data
             * @param  {Boolean} options.flat return flat JSON instead of nested
             * @return {Object}
             */
            get_json : function (obj, options, flat) {
                obj = this.get_node(obj || '#');
                if(!obj) { return false; }
                if(options.flat && !flat) { flat = []; }
                var tmp = {
                    'id' : obj.id,
                    'text' : obj.text,
                    'icon' : this.get_icon(obj),
                    'li_attr' : obj.li_attr,
                    'a_attr' : obj.a_attr,
                    'state' : {},
                    'data' : options && options.no_data ? false : obj.data
                    //( this.get_node(obj, true).length ? this.get_node(obj, true).data() : obj.data ),
                }, i, j;
                if(options.flat) {
                    tmp.parent = obj.parent;
                }
                else {
                    tmp.children = [];
                }
                if(!options || !options.no_state) {
                    for(i in obj.state) {
                        if(obj.state.hasOwnProperty(i)) {
                            tmp.state[i] = obj.state[i];
                        }
                    }
                }
                if(options && options.no_id) {
                    delete tmp.id;
                    if(tmp.li_attr && tmp.li_attr.id) {
                        delete tmp.li_attr.id;
                    }
                }
                if(options.flat && obj.id !== '#') {
                    flat.push(tmp);
                }
                if(!options || !options.no_children) {
                    for(i = 0, j = obj.children.length; i < j; i++) {
                        if(options.flat) {
                            this.get_json(obj.children[i], options, flat);
                        }
                        else {
                            tmp.children.push(this.get_json(obj.children[i], options));
                        }
                    }
                }
                return options.flat ? flat : (obj.id === '#' ? tmp.children : tmp);
            },
            /**
             * create a new node (do not confuse with load_node)
             * @name create_node([obj, node, pos, callback, is_loaded])
             * @param  {mixed}   par       the parent node
             * @param  {mixed}   node      the data for the new node (a valid JSON object, or a simple string with the name)
             * @param  {mixed}   pos       the index at which to insert the node, "first" and "last" are also supported, default is "last"
             * @param  {Function} callback a function to be called once the node is created
             * @param  {Boolean} is_loaded internal argument indicating if the parent node was succesfully loaded
             * @return {String}            the ID of the newly create node
             * @trigger model.jstree, create_node.jstree
             */
            create_node : function (par, node, pos, callback, is_loaded) {
                par = this.get_node(par);
                if(!par) { return false; }
                pos = pos === undefined ? "last" : pos;
                if(!pos.match(/^(before|after)$/) && !is_loaded && !this.is_loaded(par)) {
                    return this.load_node(par, function () { this.create_node(par, node, pos, callback, true); });
                }
                if(!node) { node = { "text" : this.get_string('New node') }; }
                if(node.text === undefined) { node.text = this.get_string('New node'); }
                var tmp, dpc, i, j;

                if(par.id === '#') {
                    if(pos === "before") { pos = "first"; }
                    if(pos === "after") { pos = "last"; }
                }
                switch(pos) {
                    case "before":
                        tmp = this.get_node(par.parent);
                        pos = $.inArray(par.id, tmp.children);
                        par = tmp;
                        break;
                    case "after" :
                        tmp = this.get_node(par.parent);
                        pos = $.inArray(par.id, tmp.children) + 1;
                        par = tmp;
                        break;
                    case "inside":
                    case "first":
                        pos = 0;
                        break;
                    case "last":
                        pos = par.children.length;
                        break;
                    default:
                        if(!pos) { pos = 0; }
                        break;
                }
                if(pos > par.children.length) { pos = par.children.length; }
                if(!node.id) { node.id = true; }
                if(!this.check("create_node", node, par, pos)) { return false; }
                if(node.id === true) { delete node.id; }
                node = this._parse_model_from_json(node, par.id, par.parents.concat());
                if(!node) { return false; }
                tmp = this.get_node(node);
                dpc = [];
                dpc.push(node);
                dpc = dpc.concat(tmp.children_d);
                this.trigger('model', { "nodes" : dpc, "parent" : par.id });

                par.children_d = par.children_d.concat(dpc);
                for(i = 0, j = par.parents.length; i < j; i++) {
                    this._model.data[par.parents[i]].children_d = this._model.data[par.parents[i]].children_d.concat(dpc);
                }
                node = tmp;
                tmp = [];
                for(i = 0, j = par.children.length; i < j; i++) {
                    tmp[i >= pos ? i+1 : i] = par.children[i];
                }
                tmp[pos] = node.id;
                par.children = tmp;

                this.redraw_node(par, true);
                if(callback) { callback.call(this, this.get_node(node)); }
                /**
                 * triggered when a node is created
                 * @event
                 * @name create_node.jstree
                 * @param {Object} node
                 * @param {String} parent the parent's ID
                 * @param {Number} position the position of the new node among the parent's children
                 */
                this.trigger('create_node', { "node" : this.get_node(node), "parent" : par.id, "position" : pos });
                return node.id;
            },
            /**
             * set the text value of a node
             * @name rename_node(obj, val)
             * @param  {mixed} obj the node, you can pass an array to rename multiple nodes to the same name
             * @param  {String} val the new text value
             * @return {Boolean}
             * @trigger rename_node.jstree
             */
            rename_node : function (obj, val) {
                var t1, t2, old;
                if($.isArray(obj)) {
                    obj = obj.slice();
                    for(t1 = 0, t2 = obj.length; t1 < t2; t1++) {
                        this.rename_node(obj[t1], val);
                    }
                    return true;
                }
                obj = this.get_node(obj);
                if(!obj || obj.id === '#') { return false; }
                old = obj.text;
                if(!this.check("rename_node", obj, this.get_parent(obj), val)) { return false; }
                this.set_text(obj, val); // .apply(this, Array.prototype.slice.call(arguments))
                /**
                 * triggered when a node is renamed
                 * @event
                 * @name rename_node.jstree
                 * @param {Object} node
                 * @param {String} text the new value
                 * @param {String} old the old value
                 */
                this.trigger('rename_node', { "node" : obj, "text" : val, "old" : old });
                return true;
            },
            /**
             * remove a node
             * @name delete_node(obj)
             * @param  {mixed} obj the node, you can pass an array to delete multiple nodes
             * @return {Boolean}
             * @trigger delete_node.jstree, changed.jstree
             */
            delete_node : function (obj) {
                var t1, t2, par, pos, tmp, i, j, k, l, c;
                if($.isArray(obj)) {
                    obj = obj.slice();
                    for(t1 = 0, t2 = obj.length; t1 < t2; t1++) {
                        this.delete_node(obj[t1]);
                    }
                    return true;
                }
                obj = this.get_node(obj);
                if(!obj || obj.id === '#') { return false; }
                par = this.get_node(obj.parent);
                pos = $.inArray(obj.id, par.children);
                c = false;
                if(!this.check("delete_node", obj, par, pos)) { return false; }
                if(pos !== -1) {
                    par.children = $.vakata.array_remove(par.children, pos);
                }
                tmp = obj.children_d.concat([]);
                tmp.push(obj.id);
                for(k = 0, l = tmp.length; k < l; k++) {
                    for(i = 0, j = obj.parents.length; i < j; i++) {
                        pos = $.inArray(tmp[k], this._model.data[obj.parents[i]].children_d);
                        if(pos !== -1) {
                            this._model.data[obj.parents[i]].children_d = $.vakata.array_remove(this._model.data[obj.parents[i]].children_d, pos);
                        }
                    }
                    if(this._model.data[tmp[k]].state.selected) {
                        c = true;
                        pos = $.inArray(tmp[k], this._data.core.selected);
                        if(pos !== -1) {
                            this._data.core.selected = $.vakata.array_remove(this._data.core.selected, pos);
                        }
                    }
                }
                /**
                 * triggered when a node is deleted
                 * @event
                 * @name delete_node.jstree
                 * @param {Object} node
                 * @param {String} parent the parent's ID
                 */
                this.trigger('delete_node', { "node" : obj, "parent" : par.id });
                if(c) {
                    this.trigger('changed', { 'action' : 'delete_node', 'node' : obj, 'selected' : this._data.core.selected, 'parent' : par.id });
                }
                for(k = 0, l = tmp.length; k < l; k++) {
                    delete this._model.data[tmp[k]];
                }
                this.redraw_node(par, true);
                return true;
            },
            /**
             * check if an operation is premitted on the tree. Used internally.
             * @private
             * @name check(chk, obj, par, pos)
             * @param  {String} chk the operation to check, can be "create_node", "rename_node", "delete_node", "copy_node" or "move_node"
             * @param  {mixed} obj the node
             * @param  {mixed} par the parent
             * @param  {mixed} pos the position to insert at, or if "rename_node" - the new name
             * @return {Boolean}
             */
            check : function (chk, obj, par, pos) {
                obj = obj && obj.id ? obj : this.get_node(obj);
                par = par && par.id ? par : this.get_node(par);
                var tmp = chk.match(/^move_node|copy_node|create_node$/i) ? par : obj,
                    chc = this.settings.core.check_callback;
                if(chk === "move_node") {
                    if(obj.id === par.id || $.inArray(obj.id, par.children) === pos || $.inArray(par.id, obj.children_d) !== -1) {
                        return false;
                    }
                }
                tmp = this.get_node(tmp, true);
                if(tmp.length) { tmp = tmp.data('jstree'); }
                if(tmp && tmp.functions && (tmp.functions[chk] === false || tmp.functions[chk] === true)) {
                    return tmp.functions[chk];
                }
                if(chc === false || ($.isFunction(chc) && chc.call(this, chk, obj, par, pos) === false) || (chc && chc[chk] === false)) {
                    return false;
                }
                return true;
            },
            /**
             * move a node to a new parent
             * @name move_node(obj, par [, pos, callback, is_loaded])
             * @param  {mixed} obj the node to move, pass an array to move multiple nodes
             * @param  {mixed} par the new parent
             * @param  {mixed} pos the position to insert at ("first" and "last" are supported, as well as "before" and "after"), defaults to `0`
             * @param  {function} callback a function to call once the move is completed, receives 3 arguments - the node, the new parent and the position
             * @param  {Boolean} internal parameter indicating if the parent node has been loaded
             * @trigger move_node.jstree
             */
            move_node : function (obj, par, pos, callback, is_loaded) {
                var t1, t2, old_par, new_par, old_ins, is_multi, dpc, tmp, i, j, k, l, p;
                if($.isArray(obj)) {
                    obj = obj.reverse().slice();
                    for(t1 = 0, t2 = obj.length; t1 < t2; t1++) {
                        this.move_node(obj[t1], par, pos, callback, is_loaded);
                    }
                    return true;
                }
                obj = obj && obj.id ? obj : this.get_node(obj);
                par = this.get_node(par);
                pos = pos === undefined ? 0 : pos;

                if(!par || !obj || obj.id === '#') { return false; }
                if(!pos.toString().match(/^(before|after)$/) && !is_loaded && !this.is_loaded(par)) {
                    return this.load_node(par, function () { this.move_node(obj, par, pos, callback, true); });
                }

                old_par = (obj.parent || '#').toString();
                new_par = (!pos.toString().match(/^(before|after)$/) || par.id === '#') ? par : this.get_node(par.parent);
                old_ins = this._model.data[obj.id] ? this : $.jstree.reference(obj.id);
                is_multi = !old_ins || !old_ins._id || (this._id !== old_ins._id);
                if(is_multi) {
                    if(this.copy_node(obj, par, pos, callback, is_loaded)) {
                        if(old_ins) { old_ins.delete_node(obj); }
                        return true;
                    }
                    return false;
                }
                //var m = this._model.data;
                if(new_par.id === '#') {
                    if(pos === "before") { pos = "first"; }
                    if(pos === "after") { pos = "last"; }
                }
                switch(pos) {
                    case "before":
                        pos = $.inArray(par.id, new_par.children);
                        break;
                    case "after" :
                        pos = $.inArray(par.id, new_par.children) + 1;
                        break;
                    case "inside":
                    case "first":
                        pos = 0;
                        break;
                    case "last":
                        pos = new_par.children.length;
                        break;
                    default:
                        if(!pos) { pos = 0; }
                        break;
                }
                if(pos > new_par.children.length) { pos = new_par.children.length; }
                if(!this.check("move_node", obj, new_par, pos)) { return false; }
                if(obj.parent === new_par.id) {
                    dpc = new_par.children.concat();
                    tmp = $.inArray(obj.id, dpc);
                    if(tmp !== -1) {
                        dpc = $.vakata.array_remove(dpc, tmp);
                        if(pos > tmp) { pos--; }
                    }
                    tmp = [];
                    for(i = 0, j = dpc.length; i < j; i++) {
                        tmp[i >= pos ? i+1 : i] = dpc[i];
                    }
                    tmp[pos] = obj.id;
                    new_par.children = tmp;
                    this._node_changed(new_par.id);
                    this.redraw(new_par.id === '#');
                }
                else {
                    // clean old parent and up
                    tmp = obj.children_d.concat();
                    tmp.push(obj.id);
                    for(i = 0, j = obj.parents.length; i < j; i++) {
                        dpc = [];
                        p = old_ins._model.data[obj.parents[i]].children_d;
                        for(k = 0, l = p.length; k < l; k++) {
                            if($.inArray(p[k], tmp) === -1) {
                                dpc.push(p[k]);
                            }
                        }
                        old_ins._model.data[obj.parents[i]].children_d = dpc;
                    }
                    old_ins._model.data[old_par].children = $.vakata.array_remove_item(old_ins._model.data[old_par].children, obj.id);

                    // insert into new parent and up
                    for(i = 0, j = new_par.parents.length; i < j; i++) {
                        this._model.data[new_par.parents[i]].children_d = this._model.data[new_par.parents[i]].children_d.concat(tmp);
                    }
                    dpc = [];
                    for(i = 0, j = new_par.children.length; i < j; i++) {
                        dpc[i >= pos ? i+1 : i] = new_par.children[i];
                    }
                    dpc[pos] = obj.id;
                    new_par.children = dpc;
                    new_par.children_d.push(obj.id);
                    new_par.children_d = new_par.children_d.concat(obj.children_d);

                    // update object
                    obj.parent = new_par.id;
                    tmp = new_par.parents.concat();
                    tmp.unshift(new_par.id);
                    p = obj.parents.length;
                    obj.parents = tmp;

                    // update object children
                    tmp = tmp.concat();
                    for(i = 0, j = obj.children_d.length; i < j; i++) {
                        this._model.data[obj.children_d[i]].parents = this._model.data[obj.children_d[i]].parents.slice(0,p*-1);
                        Array.prototype.push.apply(this._model.data[obj.children_d[i]].parents, tmp);
                    }

                    this._node_changed(old_par);
                    this._node_changed(new_par.id);
                    this.redraw(old_par === '#' || new_par.id === '#');
                }
                if(callback) { callback.call(this, obj, new_par, pos); }
                /**
                 * triggered when a node is moved
                 * @event
                 * @name move_node.jstree
                 * @param {Object} node
                 * @param {String} parent the parent's ID
                 * @param {Number} position the position of the node among the parent's children
                 * @param {String} old_parent the old parent of the node
                 * @param {Boolean} is_multi do the node and new parent belong to different instances
                 * @param {jsTree} old_instance the instance the node came from
                 * @param {jsTree} new_instance the instance of the new parent
                 */
                this.trigger('move_node', { "node" : obj, "parent" : new_par.id, "position" : pos, "old_parent" : old_par, "is_multi" : is_multi, 'old_instance' : old_ins, 'new_instance' : this });
                return true;
            },
            /**
             * copy a node to a new parent
             * @name copy_node(obj, par [, pos, callback, is_loaded])
             * @param  {mixed} obj the node to copy, pass an array to copy multiple nodes
             * @param  {mixed} par the new parent
             * @param  {mixed} pos the position to insert at ("first" and "last" are supported, as well as "before" and "after"), defaults to `0`
             * @param  {function} callback a function to call once the move is completed, receives 3 arguments - the node, the new parent and the position
             * @param  {Boolean} internal parameter indicating if the parent node has been loaded
             * @trigger model.jstree copy_node.jstree
             */
            copy_node : function (obj, par, pos, callback, is_loaded) {
                var t1, t2, dpc, tmp, i, j, node, old_par, new_par, old_ins, is_multi;
                if($.isArray(obj)) {
                    obj = obj.reverse().slice();
                    for(t1 = 0, t2 = obj.length; t1 < t2; t1++) {
                        this.copy_node(obj[t1], par, pos, callback, is_loaded);
                    }
                    return true;
                }
                obj = obj && obj.id ? obj : this.get_node(obj);
                par = this.get_node(par);
                pos = pos === undefined ? 0 : pos;

                if(!par || !obj || obj.id === '#') { return false; }
                if(!pos.toString().match(/^(before|after)$/) && !is_loaded && !this.is_loaded(par)) {
                    return this.load_node(par, function () { this.copy_node(obj, par, pos, callback, true); });
                }

                old_par = (obj.parent || '#').toString();
                new_par = (!pos.toString().match(/^(before|after)$/) || par.id === '#') ? par : this.get_node(par.parent);
                old_ins = this._model.data[obj.id] ? this : $.jstree.reference(obj.id);
                is_multi = !old_ins || !old_ins._id || (this._id !== old_ins._id);
                if(new_par.id === '#') {
                    if(pos === "before") { pos = "first"; }
                    if(pos === "after") { pos = "last"; }
                }
                switch(pos) {
                    case "before":
                        pos = $.inArray(par.id, new_par.children);
                        break;
                    case "after" :
                        pos = $.inArray(par.id, new_par.children) + 1;
                        break;
                    case "inside":
                    case "first":
                        pos = 0;
                        break;
                    case "last":
                        pos = new_par.children.length;
                        break;
                    default:
                        if(!pos) { pos = 0; }
                        break;
                }
                if(pos > new_par.children.length) { pos = new_par.children.length; }
                if(!this.check("copy_node", obj, new_par, pos)) { return false; }
                node = old_ins ? old_ins.get_json(obj, { no_id : true, no_data : true, no_state : true }) : obj;
                if(!node) { return false; }
                if(node.id === true) { delete node.id; }
                node = this._parse_model_from_json(node, new_par.id, new_par.parents.concat());
                if(!node) { return false; }
                tmp = this.get_node(node);
                dpc = [];
                dpc.push(node);
                dpc = dpc.concat(tmp.children_d);
                this.trigger('model', { "nodes" : dpc, "parent" : new_par.id });

                // insert into new parent and up
                for(i = 0, j = new_par.parents.length; i < j; i++) {
                    this._model.data[new_par.parents[i]].children_d = this._model.data[new_par.parents[i]].children_d.concat(dpc);
                }
                dpc = [];
                for(i = 0, j = new_par.children.length; i < j; i++) {
                    dpc[i >= pos ? i+1 : i] = new_par.children[i];
                }
                dpc[pos] = tmp.id;
                new_par.children = dpc;
                new_par.children_d.push(tmp.id);
                new_par.children_d = new_par.children_d.concat(tmp.children_d);

                this._node_changed(new_par.id);
                this.redraw(new_par.id === '#');
                if(callback) { callback.call(this, tmp, new_par, pos); }
                /**
                 * triggered when a node is copied
                 * @event
                 * @name copy_node.jstree
                 * @param {Object} node the copied node
                 * @param {Object} original the original node
                 * @param {String} parent the parent's ID
                 * @param {Number} position the position of the node among the parent's children
                 * @param {String} old_parent the old parent of the node
                 * @param {Boolean} is_multi do the node and new parent belong to different instances
                 * @param {jsTree} old_instance the instance the node came from
                 * @param {jsTree} new_instance the instance of the new parent
                 */
                this.trigger('copy_node', { "node" : tmp, "original" : obj, "parent" : new_par.id, "position" : pos, "old_parent" : old_par, "is_multi" : is_multi, 'old_instance' : old_ins, 'new_instance' : this });
                return tmp.id;
            },
            /**
             * cut a node (a later call to `paste(obj)` would move the node)
             * @name cut(obj)
             * @param  {mixed} obj multiple objects can be passed using an array
             * @trigger cut.jstree
             */
            cut : function (obj) {
                if(!obj) { obj = this._data.core.selected.concat(); }
                if(!$.isArray(obj)) { obj = [obj]; }
                if(!obj.length) { return false; }
                var tmp = [], o, t1, t2;
                for(t1 = 0, t2 = obj.length; t1 < t2; t1++) {
                    o = this.get_node(obj[t1]);
                    if(o && o.id && o.id !== '#') { tmp.push(o); }
                }
                if(!tmp.length) { return false; }
                ccp_node = tmp;
                ccp_inst = this;
                ccp_mode = 'move_node';
                /**
                 * triggered when nodes are added to the buffer for moving
                 * @event
                 * @name cut.jstree
                 * @param {Array} node
                 */
                this.trigger('cut', { "node" : obj });
            },
            /**
             * copy a node (a later call to `paste(obj)` would copy the node)
             * @name copy(obj)
             * @param  {mixed} obj multiple objects can be passed using an array
             * @trigger copy.jstre
             */
            copy : function (obj) {
                if(!obj) { obj = this._data.core.selected.concat(); }
                if(!$.isArray(obj)) { obj = [obj]; }
                if(!obj.length) { return false; }
                var tmp = [], o, t1, t2;
                for(t1 = 0, t2 = obj.length; t1 < t2; t1++) {
                    o = this.get_node(obj[t1]);
                    if(o && o.id && o.id !== '#') { tmp.push(o); }
                }
                if(!tmp.length) { return false; }
                ccp_node = tmp;
                ccp_inst = this;
                ccp_mode = 'copy_node';
                /**
                 * triggered when nodes are added to the buffer for copying
                 * @event
                 * @name copy.jstree
                 * @param {Array} node
                 */
                this.trigger('copy', { "node" : obj });
            },
            /**
             * get the current buffer (any nodes that are waiting for a paste operation)
             * @name get_buffer()
             * @return {Object} an object consisting of `mode` ("copy_node" or "move_node"), `node` (an array of objects) and `inst` (the instance)
             */
            get_buffer : function () {
                return { 'mode' : ccp_mode, 'node' : ccp_node, 'inst' : ccp_inst };
            },
            /**
             * check if there is something in the buffer to paste
             * @name can_paste()
             * @return {Boolean}
             */
            can_paste : function () {
                return ccp_mode !== false && ccp_node !== false; // && ccp_inst._model.data[ccp_node];
            },
            /**
             * copy or move the previously cut or copied nodes to a new parent
             * @name paste(obj)
             * @param  {mixed} obj the new parent
             * @trigger paste.jstree
             */
            paste : function (obj) {
                obj = this.get_node(obj);
                if(!obj || !ccp_mode || !ccp_mode.match(/^(copy_node|move_node)$/) || !ccp_node) { return false; }
                if(this[ccp_mode](ccp_node, obj)) {
                    /**
                     * triggered when paste is invoked
                     * @event
                     * @name paste.jstree
                     * @param {String} parent the ID of the receiving node
                     * @param {Array} node the nodes in the buffer
                     * @param {String} mode the performed operation - "copy_node" or "move_node"
                     */
                    this.trigger('paste', { "parent" : obj.id, "node" : ccp_node, "mode" : ccp_mode });
                }
                ccp_node = false;
                ccp_mode = false;
                ccp_inst = false;
            },
            /**
             * put a node in edit mode (input field to rename the node)
             * @name edit(obj [, default_text])
             * @param  {mixed} obj
             * @param  {String} default_text the text to populate the input with (if omitted the node text value is used)
             */
            edit : function (obj, default_text) {
                obj = this._open_to(obj);
                if(!obj || !obj.length) { return false; }
                var rtl = this._data.core.rtl,
                    w  = this.element.width(),
                    a  = obj.children('.jstree-anchor'),
                    s  = $('<span>'),
                    /*!
                    oi = obj.children("i:visible"),
                    ai = a.children("i:visible"),
                    w1 = oi.width() * oi.length,
                    w2 = ai.width() * ai.length,
                    */
                    t  = typeof default_text === 'string' ? default_text : this.get_text(obj),
                    h1 = $("<"+"div />", { css : { "position" : "absolute", "top" : "-200px", "left" : (rtl ? "0px" : "-1000px"), "visibility" : "hidden" } }).appendTo("body"),
                    h2 = $("<"+"input />", {
                            "value" : t,
                            "class" : "jstree-rename-input",
                            // "size" : t.length,
                            "css" : {
                                "padding" : "0",
                                "border" : "1px solid silver",
                                "box-sizing" : "border-box",
                                "display" : "inline-block",
                                "height" : (this._data.core.li_height) + "px",
                                "lineHeight" : (this._data.core.li_height) + "px",
                                "width" : "150px" // will be set a bit further down
                            },
                            "blur" : $.proxy(function () {
                                var i = s.children(".jstree-rename-input"),
                                    v = i.val();
                                if(v === "") { v = t; }
                                h1.remove();
                                s.replaceWith(a);
                                s.remove();
                                this.set_text(obj, t);
                                if(this.rename_node(obj, v) === false) {
                                    this.set_text(obj, t); // move this up? and fix #483
                                }
                            }, this),
                            "keydown" : function (event) {
                                var key = event.which;
                                if(key === 27) {
                                    this.value = t;
                                }
                                if(key === 27 || key === 13 || key === 37 || key === 38 || key === 39 || key === 40 || key === 32) {
                                    event.stopImmediatePropagation();
                                }
                                if(key === 27 || key === 13) {
                                    event.preventDefault();
                                    this.blur();
                                }
                            },
                            "click" : function (e) { e.stopImmediatePropagation(); },
                            "mousedown" : function (e) { e.stopImmediatePropagation(); },
                            "keyup" : function (event) {
                                h2.width(Math.min(h1.text("pW" + this.value).width(),w));
                            },
                            "keypress" : function(event) {
                                if(event.which === 13) { return false; }
                            }
                        }),
                    fn = {
                            fontFamily		: a.css('fontFamily')		|| '',
                            fontSize		: a.css('fontSize')			|| '',
                            fontWeight		: a.css('fontWeight')		|| '',
                            fontStyle		: a.css('fontStyle')		|| '',
                            fontStretch		: a.css('fontStretch')		|| '',
                            fontVariant		: a.css('fontVariant')		|| '',
                            letterSpacing	: a.css('letterSpacing')	|| '',
                            wordSpacing		: a.css('wordSpacing')		|| ''
                    };
                this.set_text(obj, "");
                s.attr('class', a.attr('class')).append(a.contents().clone()).append(h2);
                a.replaceWith(s);
                h1.css(fn);
                h2.css(fn).width(Math.min(h1.text("pW" + h2[0].value).width(),w))[0].select();
            },


            /**
             * changes the theme
             * @name set_theme(theme_name [, theme_url])
             * @param {String} theme_name the name of the new theme to apply
             * @param {mixed} theme_url  the location of the CSS file for this theme. Omit or set to `false` if you manually included the file. Set to `true` to autoload from the `core.themes.dir` directory.
             * @trigger set_theme.jstree
             */
            set_theme : function (theme_name, theme_url) {
                if(!theme_name) { return false; }
                if(theme_url === true) {
                    var dir = this.settings.core.themes.dir;
                    if(!dir) { dir = $.jstree.path + '/themes'; }
                    theme_url = dir + '/' + theme_name + '/style.css';
                }
                if(theme_url && $.inArray(theme_url, themes_loaded) === -1) {
                    $('head').append('<'+'link rel="stylesheet" href="' + theme_url + '" type="text/css" />');
                    themes_loaded.push(theme_url);
                }
                if(this._data.core.themes.name) {
                    this.element.removeClass('jstree-' + this._data.core.themes.name);
                }
                this._data.core.themes.name = theme_name;
                this.element.addClass('jstree-' + theme_name);
                this.element[this.settings.core.themes.responsive ? 'addClass' : 'removeClass' ]('jstree-' + theme_name + '-responsive');
                /**
                 * triggered when a theme is set
                 * @event
                 * @name set_theme.jstree
                 * @param {String} theme the new theme
                 */
                this.trigger('set_theme', { 'theme' : theme_name });
            },
            /**
             * gets the name of the currently applied theme name
             * @name get_theme()
             * @return {String}
             */
            get_theme : function () { return this._data.core.themes.name; },
            /**
             * changes the theme variant (if the theme has variants)
             * @name set_theme_variant(variant_name)
             * @param {String|Boolean} variant_name the variant to apply (if `false` is used the current variant is removed)
             */
            set_theme_variant : function (variant_name) {
                if(this._data.core.themes.variant) {
                    this.element.removeClass('jstree-' + this._data.core.themes.name + '-' + this._data.core.themes.variant);
                }
                this._data.core.themes.variant = variant_name;
                if(variant_name) {
                    this.element.addClass('jstree-' + this._data.core.themes.name + '-' + this._data.core.themes.variant);
                }
            },
            /**
             * gets the name of the currently applied theme variant
             * @name get_theme()
             * @return {String}
             */
            get_theme_variant : function () { return this._data.core.themes.variant; },
            /**
             * shows a striped background on the container (if the theme supports it)
             * @name show_stripes()
             */
            show_stripes : function () { this._data.core.themes.stripes = true; this.get_container_ul().addClass("jstree-striped"); },
            /**
             * hides the striped background on the container
             * @name hide_stripes()
             */
            hide_stripes : function () { this._data.core.themes.stripes = false; this.get_container_ul().removeClass("jstree-striped"); },
            /**
             * toggles the striped background on the container
             * @name toggle_stripes()
             */
            toggle_stripes : function () { if(this._data.core.themes.stripes) { this.hide_stripes(); } else { this.show_stripes(); } },
            /**
             * shows the connecting dots (if the theme supports it)
             * @name show_dots()
             */
            show_dots : function () { this._data.core.themes.dots = true; this.get_container_ul().removeClass("jstree-no-dots"); },
            /**
             * hides the connecting dots
             * @name hide_dots()
             */
            hide_dots : function () { this._data.core.themes.dots = false; this.get_container_ul().addClass("jstree-no-dots"); },
            /**
             * toggles the connecting dots
             * @name toggle_dots()
             */
            toggle_dots : function () { if(this._data.core.themes.dots) { this.hide_dots(); } else { this.show_dots(); } },
            /**
             * show the node icons
             * @name show_icons()
             */
            show_icons : function () { this._data.core.themes.icons = true; this.get_container_ul().removeClass("jstree-no-icons"); },
            /**
             * hide the node icons
             * @name hide_icons()
             */
            hide_icons : function () { this._data.core.themes.icons = false; this.get_container_ul().addClass("jstree-no-icons"); },
            /**
             * toggle the node icons
             * @name toggle_icons()
             */
            toggle_icons : function () { if(this._data.core.themes.icons) { this.hide_icons(); } else { this.show_icons(); } },
            /**
             * set the node icon for a node
             * @name set_icon(obj, icon)
             * @param {mixed} obj
             * @param {String} icon the new icon - can be a path to an icon or a className, if using an image that is in the current directory use a `./` prefix, otherwise it will be detected as a class
             */
            set_icon : function (obj, icon) {
                var t1, t2, dom, old;
                if($.isArray(obj)) {
                    obj = obj.slice();
                    for(t1 = 0, t2 = obj.length; t1 < t2; t1++) {
                        this.set_icon(obj[t1], icon);
                    }
                    return true;
                }
                obj = this.get_node(obj);
                if(!obj || obj.id === '#') { return false; }
                old = obj.icon;
                obj.icon = icon;
                dom = this.get_node(obj, true).children(".jstree-anchor").children(".jstree-themeicon");
                if(icon === false) {
                    this.hide_icon(obj);
                }
                else if(icon === true) {
                    dom.removeClass('jstree-themeicon-custom ' + old).css("background","").removeAttr("rel");
                }
                else if(icon.indexOf("/") === -1 && icon.indexOf(".") === -1) {
                    dom.removeClass(old).css("background","");
                    dom.addClass(icon + ' jstree-themeicon-custom').attr("rel",icon);
                }
                else {
                    dom.removeClass(old).css("background","");
                    dom.addClass('jstree-themeicon-custom').css("background", "url('" + icon + "') center center no-repeat").attr("rel",icon);
                }
                return true;
            },
            /**
             * get the node icon for a node
             * @name get_icon(obj)
             * @param {mixed} obj
             * @return {String}
             */
            get_icon : function (obj) {
                obj = this.get_node(obj);
                return (!obj || obj.id === '#') ? false : obj.icon;
            },
            /**
             * hide the icon on an individual node
             * @name hide_icon(obj)
             * @param {mixed} obj
             */
            hide_icon : function (obj) {
                var t1, t2;
                if($.isArray(obj)) {
                    obj = obj.slice();
                    for(t1 = 0, t2 = obj.length; t1 < t2; t1++) {
                        this.hide_icon(obj[t1]);
                    }
                    return true;
                }
                obj = this.get_node(obj);
                if(!obj || obj === '#') { return false; }
                obj.icon = false;
                this.get_node(obj, true).children("a").children(".jstree-themeicon").addClass('jstree-themeicon-hidden');
                return true;
            },
            /**
             * show the icon on an individual node
             * @name show_icon(obj)
             * @param {mixed} obj
             */
            show_icon : function (obj) {
                var t1, t2, dom;
                if($.isArray(obj)) {
                    obj = obj.slice();
                    for(t1 = 0, t2 = obj.length; t1 < t2; t1++) {
                        this.show_icon(obj[t1]);
                    }
                    return true;
                }
                obj = this.get_node(obj);
                if(!obj || obj === '#') { return false; }
                dom = this.get_node(obj, true);
                obj.icon = dom.length ? dom.children("a").children(".jstree-themeicon").attr('rel') : true;
                if(!obj.icon) { obj.icon = true; }
                dom.children("a").children(".jstree-themeicon").removeClass('jstree-themeicon-hidden');
                return true;
            }
        };

        // helpers
        $.vakata = {};
        // reverse
        $.fn.vakata_reverse = [].reverse;
        // collect attributes
        $.vakata.attributes = function(node, with_values) {
            node = $(node)[0];
            var attr = with_values ? {} : [];
            if(node && node.attributes) {
                $.each(node.attributes, function (i, v) {
                    if($.inArray(v.nodeName.toLowerCase(),['style','contenteditable','hasfocus','tabindex']) !== -1) { return; }
                    if(v.nodeValue !== null && $.trim(v.nodeValue) !== '') {
                        if(with_values) { attr[v.nodeName] = v.nodeValue; }
                        else { attr.push(v.nodeName); }
                    }
                });
            }
            return attr;
        };
        $.vakata.array_unique = function(array) {
            var a = [], i, j, l;
            for(i = 0, l = array.length; i < l; i++) {
                for(j = 0; j <= i; j++) {
                    if(array[i] === array[j]) {
                        break;
                    }
                }
                if(j === i) { a.push(array[i]); }
            }
            return a;
        };
        // remove item from array
        $.vakata.array_remove = function(array, from, to) {
            var rest = array.slice((to || from) + 1 || array.length);
            array.length = from < 0 ? array.length + from : from;
            array.push.apply(array, rest);
            return array;
        };
        // remove item from array
        $.vakata.array_remove_item = function(array, item) {
            var tmp = $.inArray(item, array);
            return tmp !== -1 ? $.vakata.array_remove(array, tmp) : array;
        };
        // browser sniffing
        (function () {
            var browser = {},
                b_match = function(ua) {
                ua = ua.toLowerCase();

                var match =	/(chrome)[ \/]([\w.]+)/.exec( ua ) ||
                            /(webkit)[ \/]([\w.]+)/.exec( ua ) ||
                            /(opera)(?:.*version|)[ \/]([\w.]+)/.exec( ua ) ||
                            /(msie) ([\w.]+)/.exec( ua ) ||
                            (ua.indexOf("compatible") < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec( ua )) ||
                            [];
                    return {
                        browser: match[1] || "",
                        version: match[2] || "0"
                    };
                },
                matched = b_match(window.navigator.userAgent);
            if(matched.browser) {
                browser[ matched.browser ] = true;
                browser.version = matched.version;
            }
            if(browser.chrome) {
                browser.webkit = true;
            }
            else if(browser.webkit) {
                browser.safari = true;
            }
            $.vakata.browser = browser;
        }());
        if($.vakata.browser.msie && $.vakata.browser.version < 8) {
            $.jstree.defaults.core.animation = 0;
        }
        (function ($, undefined) {
            $.vakata.json = {
                encode : window.JSON.stringify,
                decode : window.JSON.parse
            };
        }(ip.jQuery));
    }(ip.jQuery));
})(ip.jQuery);