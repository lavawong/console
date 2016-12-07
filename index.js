!(function (win, doc, undef) {
    var LOG_CONTENT_ID = '__LOG_CONTENT_ID',
        CSS_PREFIX = '__console-',
        CLOSE_RIGHT = -10000000,
        Z_INDEX = 2147483647,
        version = '0.0.1',
        $logPanel,
        $logContainer,
        $openBtn,
        $infoContainer,
        logCaches = [],
        util,
        $extraSheet,
        $itemList,
        latestTime = now(),
        sameMsgTime = 0,
        lastMsg = '',
        eventId = 1,
        eventCacheData = {},
        isOpened = false,
        inited = false;


    function parseObject (obj) {
        return typeof obj === 'object' ? JSON.stringify(obj, null, 2) : obj;
    }

    function _KNB_LOG (a, b, c) {
        var str = '\n-------\n ' + [parseObject(a || ''), parseObject(b || ''), parseObject(c || '')].join(' ');
        logCaches.push(str);
    }

    function init () {
        if (!inited) {
            inited = true;
            latestTime = now();
            var $header = doc.getElementsByTagName('head')[0];
            $extraSheet = doc.createElement('style');
            $extraSheet.setAttribute('type', 'text/css');
            $header.appendChild($extraSheet);
            if ($extraSheet.styleSheet) {
                $extraSheet.styleSheet.cssText = cssRules();
            } else {
                $extraSheet.innerHTML = cssRules();
            }
            $logContainer = createLogContainer();
            $logPanel = doc.createElement('div');
            $logPanel.id = LOG_CONTENT_ID;
            $logPanel.className = CSS_PREFIX + 'pannel';
            $logPanel.appendChild($logContainer);

            var body = doc.body;
            body.appendChild($logPanel);
            util.on($logPanel, 'click touchstart', function (evt) {
                stopBubble(evt);
                return false;
            });

            $itemList = $$(CSS_PREFIX + 'list')[0];
            for (var i = 0, len = logCaches.length; i < len; i++) {
                var cache = logCaches[i];
                util._render(cache[0], cache[1]);
            }

            util.on($itemList, 'click', function (evt) {
                evt = evt || win.event;
                var eventId,
                    cache,
                    target = evt.target || evt.srcElement;
                while (target !== $itemList) {
                    eventId = target.getAttribute('event-id');
                    if (eventId && (cache = eventCacheData[eventId])) {
                        util._toggleObject(target, cache);
                        stopBubble(evt);
                        break;
                    }
                    target = target.parentNode;
                }

            });

            util.on($(CSS_PREFIX + 'clear'), 'click', function () {
                while ($itemList.firstChild) {
                    $itemList.removeChild($itemList.firstChild);
                }
                eventCacheData = {};
            });
            util.on($(CSS_PREFIX + 'info'), 'click', function () {
                //TODO show info
                toggleInfo();
            });
            util.on($(CSS_PREFIX + 'min'), 'click', function () {
                // $logDom.
                //TODO min pannel
                close();
            });
            util.on($(CSS_PREFIX + 'run'), 'click', function () {
                // id="'+CSS_PREFIX+'run";
                var code = $(CSS_PREFIX + 'code').value;
                try {
                    code && eval('(' + code + ')');
                } catch (e) {
                    console.error(e.message);
                }
            });


            $infoContainer = createInfoContainer();
            $logPanel.appendChild($infoContainer);
            util.on($(CSS_PREFIX + 'back'), 'click', function () {
                $infoContainer.style.display = 'none';
            });
            util.on($(CSS_PREFIX + 'reload'), 'click', function () {
                win.location.reload(true);
            });

            $openBtn = createOpenBtn();
            util.on($openBtn, 'click', function () {
                open();
            });
            resizePanel();
            util.on(win, 'resize', resizePanel);
        }

    }

    function cssRules () {
        return [
            '',
            'pannel {position:fixed; color: #ddd;right:-1000000px; right:', CLOSE_RIGHT, 'px;top:0px;background: #222;opacity: .97;font-family:"Open Sans", "Helvetica Neue", Helvetica, Arial, sans-serif;z-index: ', Z_INDEX, ';margin:0;padding: 5px;}',
            'info {position:absolute;background-color:#444;top:0;left:0;height:100%;z-index:', Z_INDEX + 1, ';width:100%;display:none;}',
            'help {text-align:center;margin-top:50px;}',
            'container {height:100%;padding: 0;position:relative;}',
            'content {margin:10px 0;background: #444;padding: 0;overflow: auto;}',
            'header {}',
            'header .' + CSS_PREFIX + 'actions {position: absolute;top:0;right:0}',
            'header .' + CSS_PREFIX + 'actions .' + CSS_PREFIX + 'btn {float:left; display:block;width:28px;margin-left:5px;}',
            'btn {border:none;height:26px;line-height:20px; text-align:center;font-weight:bold;padding: 3px 8px;outline-style: none;}',
            'btn.btn-default {background-color: rgba(76, 76, 76, 0.82);color:#ddd;}',
            'btn.btn-default.mr10 {margin-left:10px;}',
            'btn.btn-default:hover {background-color: rgba(121, 119, 119, 0.82);}',
            'open-btn {display:block; z-index:999999;position:fixed; top:36px; right:30px;width:32px;height:32px;line-height:30px;font-weight:bold;border-radius:5px;font-size:22px;background-color:#444;text-align:center;margin:0;padding:0;color:#eee;}',
            'open-btn:hover {background-color:#797777;color:#eee;text-decoration:none}',
            'footer .' + CSS_PREFIX + 'textarea {width:100%;max-width: 100%;background: #444;border: 1px solid #666;color: #fff;}',
            'btn.btn-info {background-color: rgba(76, 76, 76, 0.82);color:#ddd;}',
            'btn.btn-info:hover {background-color: rgba(121, 119, 119, 0.82);}',
            'footer .' + CSS_PREFIX + 'textarea {width:100%;max-width: 100%;background: #444;border: 1px solid #666;color: #fff;}',
            'footer:after {overflow:hidden;display:block;width:100%;content:\' \'}',
            'run .' + CSS_PREFIX + 'btn {float:right;}',
            'list {margin:0;padding:0;list-style:none;}',
            'list li {position: relative;padding: 3px 8px 3px 38px;font-size: 12px;border: none;border-bottom: 1px solid #666;border-left: 6px solid #444;}',
            'list>li:first-child {color: #fff;font-weight: bold;}',
            'list em {position:absolute;font-style:normal;left: 1px;margin-right:1em;font-size:11px;color:#999;width:32px;text-align: right;}',
            'list li .function {font-style:italic;}',
            'list li .function .function-name {color: rgba(247, 57, 57, 0.87);margin:0 .5em}',
            'list li .object {overflow:auto;display:inline-block;vertical-align: bottom;}',
            'list li .boolean {color: rgb(44, 158, 255);font-style: italic;}',
            'list li ul.list.sub {overflow:auto;padding-left: 10px;list-style:none; max-height:200px;}',
            'list li ul.list.sub li {white-space: pre;word-spacing: normal;word-break: normal;word-wrap: normal;font-weight: normal;border:none; padding-left:0px;max-width:90%;}',
            'list li ul.list.sub li .object-key {margin-right:.25em;}',
            'list span.repeat {margin-right:.5em;color:#ccc;}',
            'list li.debug {border-left-color: rgba(90, 255, 58, 0.61);}',
            'list li.log {}',
            'list li.info {border-left-color: #3AF;}',
            'list li.warn {border-left-color: #FC0;}',
            'list li.error {border-left-color: #f66;}'
        ].join('\r\n.' + CSS_PREFIX);
    }

    function createLogContainer () {
        var logPanelContainerHTML = '<div class="' + CSS_PREFIX + 'header">' +
            '<div class="' + CSS_PREFIX + 'interface">' +
            '<button id="' + CSS_PREFIX + 'clear" type="button"  class="' + CSS_PREFIX + 'btn btn-default">Clear</button>' +
            '</div>' +
            '<div class="' + CSS_PREFIX + 'actions">' +
            '<button id="' + CSS_PREFIX + 'info" type="button"  class="' + CSS_PREFIX + 'btn btn-info">i</button>' +
            '<button id="' + CSS_PREFIX + 'min" type="button"  class="' + CSS_PREFIX + 'btn btn-default">&#8213;</button>' +
            '</div>' +
            '</div>' +
            '<div class="' + CSS_PREFIX + 'content">' +
            '<ul class="' + CSS_PREFIX + 'list">' +
            '</ul>' +
            '</div>' +
            '<div class="' + CSS_PREFIX + 'footer">' +
            '<div class="' + CSS_PREFIX + 'code">' +
            '<textarea  id="' + CSS_PREFIX + 'code" class="' + CSS_PREFIX + 'textarea" placeholder="Input code here..."></textarea>' +
            '</div>' +
            '<div class="' + CSS_PREFIX + 'run">' +
            '<button type="button" id="' + CSS_PREFIX + 'run" class="' + CSS_PREFIX + 'btn btn-default">Run</button>' +
            '</div>' +
            '</div>';
        var $container = doc.createElement('div');
        $container.className = CSS_PREFIX + 'container';
        $container.id = CSS_PREFIX + 'container';
        $container.appendChild(htmlToFragment(logPanelContainerHTML));
        return $container;
    }

    function createInfoContainer () {
        var infoContainerHTML = [
            '<div class="' + CSS_PREFIX + 'help">',
            '<p>Version ', util.version, '</p>',
            '<p>by lavawong</p>',
            '<p><a target="_blank" href="https://github.com/qiangyee/console">https://github.com/qiangyee/console</a></p>',
            '<button id="', CSS_PREFIX, 'back" type="button" class="', CSS_PREFIX, 'btn btn-default mr10">back</button>',
            '<button id="', CSS_PREFIX, 'reload" type="button" class="', CSS_PREFIX, 'btn btn-default mr10">reload</button>',
            '</div>'
        ].join('');
        var $info = doc.createElement('div');
        $info.className = CSS_PREFIX + 'info';
        $info.appendChild(htmlToFragment(infoContainerHTML));
        return $info;
    }

    function createOpenBtn () {
        var $openBtn = doc.createElement('a');
        $openBtn.className = CSS_PREFIX + 'open-btn';
        $openBtn.innerHTML = '+';
        $openBtn.href = 'javascript:;';
        doc.body.appendChild($openBtn);
        return $openBtn;
    }

    function resizePanel () {
        var width = Math.min(400, Math.max(230, Math.floor(win.innerWidth * 0.8))),
            height = win.innerHeight,
            contentHeight = Math.max(200, height - (26 + 77 + 40));
        $logPanel.style.width = width + 'px';
        $logPanel.style.height = height + 'px';

        var $content = $$(CSS_PREFIX + 'content', $logContainer)[0];
        if ($content) {
            $content.style.height = Math.min(1000, contentHeight) + 'px';
        }
    }

    function toggleInfo () {
        $infoContainer.style.display = 'block';
    }

    function open () {
        if (!isOpened) {
            $logPanel.style.right = '0px';
            $openBtn.style.right = CLOSE_RIGHT + 'px';
        }
    }

    function close () {
        if (isOpened) {
            $logPanel.style.right = CLOSE_RIGHT + 'px';
            $openBtn.style.right = '0px';
        }
    }

    function stopBubble (evt) {
        evt = evt || win.event;
        if (evt.stopPropagation) {
            evt.stopPropagation();
        } else {
            evt.cancelBubble = true;
        }
    }

    function toObjStr (msg) {
        return Object.prototype.toString.call(msg);
    }

    function isStr (msg) {
        if (msg === null || msg === undef) {
            return false;
        }
        return '[object String]' === toObjStr(msg);
    }

    function isBoolean (msg) {
        if (msg === null || msg === undef) {
            return false;
        }
        return '[object Boolean]' === toObjStr(msg);
    }

    function isPlainObj (msg) {
        if (msg === null || msg === undef) {
            return false;
        }
        return '[object Object]' === toObjStr(msg);
    }

    function isFunc (msg) {
        if (msg === null || msg === undef) {
            return false;
        }
        return '[object Function]' === toObjStr(msg);
    }

    function isHTML (msg) {
        if (msg === null || msg === undef) {
            return false;
        }
        return msg.nodeType && !isBoolean(msg) && !isFunc(msg) && !isPlainObj(msg) && !isStr(msg);
    }

    function now () {
        return +new Date();
    }

    function htmlFilter (msg, convertEnter) {
        msg = msg.toString().replace(/&/g, '&amp;')
            .replace(/ /g, '&nbsp;')
            .replace(/>/g, '&gt;')
            .replace(/</g, '&lt;');
        return msg.replace(/\r\n|\n/g, false === convertEnter ? '&#8617;' : '<br/>');
    }

    function cutStr (msg, len) {
        len = len || 200;
        if (msg.length > len) {
            msg = msg.substr(0, len) + '...';
        }
        return msg;
    }

    /**
     * 转换html
     * @param args
     * @param opts
     * @returns {string}
     */
    function toHtml (args, opts) {
        var html = '',
            msg;
        opts = opts || {
                deep         : true,
                convertEnter : true
            };
        for (var i = 0, len = args.length; i < len; i++) {
            msg = args[i];
            if (isStr(msg)) {
                msg = msg.toString();
                msg = cutStr(msg, 200);
                html += htmlFilter(msg.toString(), opts.convertEnter);
            } else if (isBoolean(msg)) {
                msg = htmlFilter(msg);
                html += '<span class="boolean">' + msg + '</span>';
            } else if (isFunc(msg)) {
                msg = msg.toString();
                msg = msg.replace(/^function/, '');
                msg = cutStr(msg, 200);
                html += '<span class="function">';
                html += '<strong class="function-name">function</strong>';
                html += '<span class="function-body">' + htmlFilter(msg) + '</span>';
                html += '</span>';
            } else if (isPlainObj(msg) || isHTML(msg)) {
                var text = msg.constructor.name;
                if (false === opts.deep) {
                    html += '<span class="object">' + text + '</span>';
                } else {
                    html += '<span class="object" event-id="' + getEventId(msg) + '">&#x25b6; ' + text + '</span>';
                }

            } else if (msg === null) {
                html += '<span class="undef">null</span>';
            } else if (msg === undef) {
                html += '<span class="undef">undefined</span>';
            } else {
                html += htmlFilter(msg);
            }
        }
        return html;
    }

    function composeHtmlFragment (args) {
        return htmlToFragment(toHtml(args));
    }

    function htmlToFragment (html) {
        var frag = doc.createDocumentFragment(),
            tmp = doc.createElement('div');
        tmp.innerHTML = html;
        while (tmp.firstChild) {
            frag.appendChild(tmp.firstChild);
        }
        return frag;
    }

    function getEventId (data) {
        eventCacheData[eventId] = {data : data, status : -1};
        return eventId++;
    }

    function $ (id) {
        return doc.getElementById(id);
    }

    function $$ (className, $el) {
        if ($el) {
            return $el.getElementsByClassName(className);
        } else {

            return doc.getElementsByClassName(className);
        }
    }

    function $byTag (tag, $el) {
        if ($el) {
            return $el.getElementsByTagName(tag);
        } else {

            return doc.getElementsByTagName(tag);
        }
    }


    function wrapConsole () {
        var methods = ['log', 'debug', 'info', 'warn', 'error'];
        var _oldconsole = win.console;
        var console = {};

        util.run(methods, function (method) {
            console[method] = function () {
                var args = arguments;
                if (_oldconsole) {
                    _oldconsole[method].apply(null, args);
                }
                util[method].apply(util, args);
            };
        });
        win.console = console;
    }


    util = {
        version : version,
        $       : $,
        $$      : $$,
        debug   : function () {
            this._render('debug', arguments);
        },
        log     : function () {
            this._render('log', arguments);
        },
        info    : function () {
            this._render('info', arguments);
        },
        warn    : function () {
            this._render('warn', arguments);
        },
        error   : function () {
            this._render('error', arguments);
        },
        on      : function (elem, type, func) {
            var types = type.split(' ');
            util.run(types, function (type) {
                if (elem.addEventListener) {
                    elem.addEventListener(type, func, false);
                } else if (elem.attachEvent) {
                    elem.attachEvent('on' + type, func);
                } else {
                    elem['on' + type] = func;
                }
            });
            return true;
        },

        run : function (arr, func) {
            if (!isStr(arr) && arr.length) {
                for (var i = 0, len = arr.length; i < len; i++) {
                    func(arr[i], i, arr);
                }
            } else {
                func(arr, 0, [arr]);
            }
        },

        toggle : function () {
            init();
            if (isOpened) {
                close();
            } else {
                open();
            }
        },

        open : function () {
            open();
        },

        close : function () {
            close();
        },

        each : function (arr, func) {
            if (!isStr(arr) && arr.length) {
                for (var i = 0, len = arr.length; i < len; i++) {
                    if (false === func(arr[i], i, arr)) {
                        break;
                    }
                }
            } else {
                for (var key in arr) {
                    if (false === func(arr[key], key, arr)) {
                        break;
                    }
                }
            }
        },


        _render : function (level, args) {
            if (inited) {
                var i, isSame, len;
                if (lastMsg === args) {
                    isSame = true;
                } else if (lastMsg && lastMsg.length === args.length) {
                    for (i = 0, len = lastMsg.length; i < len; i++) {
                        isSame = lastMsg[i] === args[i];
                        if (!isSame) {
                            break;
                        }
                    }
                }
                if (!isSame) {
                    lastMsg = args;
                    var time = now() - latestTime;
                    var item = doc.createElement('li');
                    var em = doc.createElement('em');
                    var msgs = composeHtmlFragment(args);

                    latestTime = now();
                    item.className = level;
                    em.appendChild(doc.createTextNode(time / 1000));
                    item.appendChild(em);
                    item.appendChild(msgs);

                    var children = $itemList.children;
                    if (children.length) {
                        $itemList.insertBefore(item, children[0]);
                    } else {
                        $itemList.appendChild(item);
                    }
                    sameMsgTime = 0;
                } else {
                    sameMsgTime++;
                    var $em = $byTag('em', $itemList)[0];
                    var $li = $em.parentNode;
                    var sameTimes = sameMsgTime + 1;
                    var $times = $$('repeat', $li)[0];
                    var timesTxt = '(' + sameTimes + ')';
                    if (!$times) {
                        $times = doc.createElement('span');
                        $times.className = 'repeat';
                        $times.appendChild(doc.createTextNode(timesTxt));
                    } else {
                        $times.textContent = $times.innerText = timesTxt;
                    }
                    if ($em.nextSibling) {
                        $li.insertBefore($times, $em.nextSibling);
                    } else {
                        $li.appendChild($times);
                    }

                }


            } else {
                logCaches.push([level, args]);
            }

        },

        _toggleObject    : function ($listenEl, eventCache) {
            var status = eventCache.status;
            var $parentElement = $listenEl.parentNode;
            var width = $parentElement.offsetWidth - 52;
            var expand = $listenEl.innerHTML;
            if (-1 === status) {
                util._showInnerObject($parentElement, eventCache.data, width);
                $listenEl.innerHTML = '\u25BC' + expand.substr(1, expand.length - 1);
                eventCache.status = 1;
            } else if (0 === status) {
                util.each($byTag('ul', $parentElement), function ($el) {
                    if ($el.className === 'list sub') {
                        $el.style.display = 'block';
                        $listenEl.innerHTML = '\u25BC' + expand.substr(1, expand.length - 1);
                        eventCache.status = 1;
                        return false;
                    }
                });

            } else {
                util.each($byTag('ul', $parentElement), function ($el) {
                    if ($el.className === 'list sub') {
                        $el.style.display = 'none';
                        $listenEl.innerHTML = '\u25B6' + expand.substr(1, expand.length - 1);
                        eventCache.status = 0;
                        return false;
                    }
                });
            }
        },
        _showInnerObject : function ($parentElement, data, width) {
            var html = '',
                $ul = doc.createElement('ul');
            util.each(data, function (val, key) {
                html += '<li>';
                html += '<span class="object-key">' + key + ' : </span>';
                html += toHtml([isStr(val) ? '"' + cutStr(val, 40) + '"' : val], {
                    shouldCut    : true,
                    deep         : isPlainObj(val) ? true : false,
                    convertEnter : false
                });
                html += '</li>';
            });
            $ul.className = 'list sub';
            $ul.style.width = (width) + 'px';
            $ul.appendChild(htmlToFragment(html));
            $parentElement.appendChild($ul);
        }
    };

    wrapConsole();
    win._LogUtils = util;
    win._KNB_LOG = win._MTNB_LOG = _KNB_LOG;
    if ('complete' === doc.readyState) {
        init();
    } else {
        util.on(doc, 'DOMContentLoaded', init);
        util.on(win, 'load', init);
    }
})(window, document);
