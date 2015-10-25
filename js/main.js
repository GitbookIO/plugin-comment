require(['gitbook', 'jQuery', 'lodash'], function (gitbook, $, _) {
    var allThreads = [];
    var allComments = {};
    var isLoggedin = false;

    var SECTIONS_SELECTOR = 'p';
    var LIMIT_COMMENTS = 4;

    var TPL_COMMENT = _.template(
        '<img src="<%- user.urls.avatar %>" class="comment-avatar" />' +
        '<div class="comment-body">' +
            '<a href="<%- user.urls.profile %>" target="_blank" class="comment-user"><%- user.name %></a>' +
            '<div class="comment-content"><%= body || title %></div>' +
        '</div>');

    var TPL_THREAD = _.template(
        '<div class="thread-body">' +
            '<div class="thread-title"><%= title %></div>' +
            '<div class="thread-user">#<%- number %> posted by <%- user.name %></div>' +
        '</div>');

    // Move content to the left
    // Calcul the right position
    function toggleComments(state) {
        var $wrapper = gitbook.state.$book.find('.page-wrapper');
        var $inner = $wrapper.find('.page-inner');
        var $nextNavigation = gitbook.state.$book.find('.navigation.navigation-next');

        $wrapper.toggleClass('comments-open', state);
        if (!$wrapper.hasClass('comments-open')) {
            $inner.css('left', 'auto');
        } else {
            var commentsWidth = 330;
            var innerWidth = $inner.width();
            var wrapperWidth = $wrapper.width();
            var navWidth = $nextNavigation.length == 0? 0 : $nextNavigation.width();
            var marginWidth = ((wrapperWidth - innerWidth) / 2) - navWidth;

            var left = (marginWidth-commentsWidth);
            left = Math.max(left, -commentsWidth);
            left = Math.min(left, 0);

            $inner.css('left', left+'px');
        }
    }

    // Reurn root for api
    function apiUrl(path) {
        //return 'http://localhost:5000/content/book/samypesse/test-beta/gitbook/api/'+path;
        return (gitbook.state.root+'/gitbook/api/'+path).replace(/\/\/+/g, '/');
    }

    // Redirect user to login page
    function redirectToLogin() {
        location.href = apiUrl('login');
    }

    // Open an url in a new tab
    function openInNewTab(url) {
        var win = window.open(url, '_blank');
        win.focus();
    }

    // Make an api request
    function apiRequest(method, route, data, success) {
        $.ajax({
            method: method,
            dataType: 'json',
            url: apiUrl(route),
            data: data,
            success: function(result, status, xhr) {
                isLoggedin = !!xhr.getResponseHeader('X-GitBook-Auth');
                success(result);
            },
            error: function(xhr, textStatus) {
                alert('Error with comments: '+textStatus);
            }
        });
    }

    // Fetch threads from gitbook.com and update listing
    function fetchThreads() {
        apiRequest('GET', 'discussions', {
            'filename': gitbook.state.filepath,
            'state': 'open'
        }, function(result) {
            allThreads = result.list;
            updateSections();
        });
    }

    // Fetch threads from gitbook.com and update listing
    function fetchComments(id) {
        apiRequest('GET', 'discussions/'+id+'/comments', {
            'limit': LIMIT_COMMENTS
        }, function(result) {
            allComments[id] = result;
            updateComments(id);
        });
    }

    // Create a new thread on th backend
    function postThread(subject, body, section, done) {
        apiRequest('POST', 'discussions', {
            'title': subject,
            'body': body,
            'context': {
                'filename': gitbook.state.filepath,
                'section': section
            }
        }, done);
    }

    // Close a thread
    function closeThread(id) {
        allThreads = _.reject(allThreads, {
            'number': id
        });
        updateSections();

        apiRequest('POST', 'discussions/'+id, {
            state: 'closed'
        }, function() {
            fetchThreads();
        });
    }

    // Post a new comment
    function postComment(id, body, done) {
        apiRequest('POST', 'discussions/'+id+'/comments', {
            body: body
        }, function(result) {
            // Prefill data
            allComments[id] = allComments[id] || [];
            allComments[id].total = allComments[id].total + 1;
            allComments[id].list.push(result);
            updateComments(id);

            // Sync fetch all comments
            fetchComments(id);
            done(result);
        });
    }

    // Return list of threads matching a section
    function filterThreads(section) {
        var words = section.split(' ');

        return _.chain(allThreads)
            .map(function(thread) {
                var threadWords = (thread.context.section || '').split(' ');

                var commonWordsWithSection = _.filter(threadWords, function(word) {
                    return _.contains(words, word);
                });
                var commonWordsFromSection = _.filter(words, function(word) {
                    return _.contains(threadWords, word);
                });

                var matching = (
                    (commonWordsWithSection.length/threadWords.length)
                    + (commonWordsFromSection.length/words.length)
                ) / 2;

                return {
                    matching: matching,
                    thread: thread
                };
            })
            .filter(function(r) {
                return r.matching > 0.8;
            })
            .sortBy('matching')
            .pluck('thread')
            .value();
    }

    // Create form to create thread
    function createThreadCreation($commentsArea, $section) {
        // Post area
        var $input;
        var $postArea = $('<div>', {
            'class': 'comments-post'
        });

        if (isLoggedin) {
            $input = $('<input>', {
                'type': 'text',
                'placeholder': 'Start a new discussion'
            });

            var $toolbar = createToolbar([
                {
                    text: 'Post',
                    click: function() {
                        postThread($input.val(), '', $section.text(), function(thread) {
                            // Add to the list of all threads
                            allThreads.push(thread);
                            updateSections();

                            // Update view with this thread
                            createThreadComments($commentsArea, $section, thread);
                        });
                    }
                }
            ]);

            $postArea.append($input);
            $postArea.append($toolbar);
        } else {
            var $toolbar = createToolbar([
                {
                    text: 'Sign in to comment',
                    click: redirectToLogin
                }
            ]);
            $postArea.append($toolbar);
        }

        $commentsArea.html('');
        $commentsArea.append($postArea);

        if ($input) $input.focus();
    }

    // Create and return a thread for listing
    function createThread(thread) {
        return $('<div>', {
            'class': 'thread',
            'html': TPL_THREAD(thread)
        });
    }

    // Create and return a comment
    function createComment(comment, isThread) {
        return $('<div>', {
            'class': 'comment',
            'html': TPL_COMMENT(comment)
        });
    }

    // Create an return a toolbar
    function createToolbar(actions) {
        var $toolbar = $('<div>', {
            'class': 'comments-toolbar'
        });

        _.each(actions, function(action) {
            var $action = $('<a>', {
                'href': '#',
                'text': action.text,
                'click': function(e) {
                    e.preventDefault();
                    action.click();
                }
            });

            $action.appendTo($toolbar);
        });

        return $toolbar;
    }

    // Display comment entry in post area for a thread
    function createThreadCommentForm($postArea, thread) {
        $postArea.html('');

        var $input = $('<input>', {
            'type': 'text',
            'placeholder': 'Leave a comment'
        });

        var $toolbar = createToolbar([
            {
                text: 'Post',
                click: function() {
                    postComment(thread.number, $input.val(), function() {
                        $input.val('');
                    });
                }
            }
        ]);

        $postArea.append($input);
        $postArea.append($toolbar);

        $input.focus();
    }

    // Display a thread and its comments
    function createThreadComments($commentsArea, $section, thread, threads) {
        // Go fetch comments
        fetchComments(thread.number);

        var actions = [];

        if (isLoggedin) {
            if (thread.permissions.comment) {
                actions.push({
                    text: 'Comment',
                    click: function() {
                        createThreadCommentForm($postArea, thread);
                    }
                });
            }

            if (thread.permissions.close) {
                actions.push({
                    text: 'Close',
                    click: function() {
                        toggleSection($section, threads);
                        closeThread(thread.number);
                    }
                });
            }

            actions.push({
                text: 'New Thread',
                click: function() {
                    createThreadCreation($commentsArea, $section);
                }
            });
        } else {
            actions = [
                {
                    text: 'Sign in to comment',
                    click: redirectToLogin
                }
            ];
        }

        var $postArea = $('<div>', {
            'class': 'comments-post'
        });
        $postArea.append(createToolbar(actions));


        var $comments = $('<div>', {
            'class': 'comments-list',
            'data-thcomments': thread.number
        });

        $commentsArea.html('');
        $commentsArea.append(createComment(thread));
        $commentsArea.append($comments);
        $commentsArea.append($postArea);

        updateComments(thread.number);
    }

    // Create a list of threads to select one to show
    function createThreadsList($commentsArea, $section, threads) {
        var $threads = $('<div>', {
            'class': 'comments-threads'
        });

        _.each(threads, function(thread) {
            var $thread = createThread(thread)
            $thread.click(function(e) {
                createThreadComments($commentsArea, $section, thread);
            });
            $threads.append($thread);
        });

        var $toolbar;

        if (isLoggedin) {
            $toolbar = createToolbar([
                {
                    text: 'New Thread',
                    click: function() {
                        createThreadCreation($commentsArea, $section);
                    }
                }
            ]);
        } else {
            $toolbar = createToolbar([
                {
                    text: 'Sign in to create a thread',
                    click: redirectToLogin
                }
            ]);
        }

        $commentsArea.html('');
        $commentsArea.append($threads);
        $commentsArea.append($toolbar);
    }

    // Close all section
    function closeAllSections() {
        gitbook.state.$book.find('.page-wrapper .comments-section').removeClass('has-comments-open');
    }

    // Toggle comments display
    function toggleSection($section, threads) {
        var isOpen = !$section.hasClass('has-comments-open');
        closeAllSections();
        $section.toggleClass('has-comments-open', isOpen);
        toggleComments(isOpen);

        if (!isOpen) return;

        $section.find('.comments-area').remove();
        var $commentsArea = $('<div>', {
            'class': 'comments-area'
        });
        $section.append($commentsArea);

        // Has multiples threads
        if (threads.length > 1) {
            createThreadsList($commentsArea, $section, threads);
        } else if (threads.length == 1) {
            createThreadComments($commentsArea, $section, threads[0], threads);
        } else {
            createThreadCreation($commentsArea, $section);
        }
    }

    // Initialize comments system on a paragraph (aka section)
    function bindSection($section) {
        // Find matching threads with this section
        var threads = filterThreads($section.text());
        var nComments = _.reduce(threads, function(sum, thread) {
            return sum + 1 + thread.comments;
        }, 0);

        // Create marker
        var $marker = $('<div>', {
            'class': 'marker',
            'text': nComments? nComments : '+'
        });
        $marker.on('click', function() {
            toggleSection($section, threads);
        });

        var $icon = $('<div>', {
            'class': 'comments-icon'
        });
        $icon.append($marker);

        $section.addClass('comments-section');
        if (nComments > 0) $section.addClass('has-comments');
        $section.append($icon);
    }

    // Update all comments sections
    function updateSections() {
        var $wrapper = gitbook.state.$book.find('.page-wrapper');
        var $sections = $wrapper.find(SECTIONS_SELECTOR);

        $sections.each(function() {
            bindSection($(this));
        });
    }

    // Update comments for a thread
    function updateComments(number) {
        var thread = _.find(allThreads, {
            'number': number
        });

        if (!allComments[number] || !thread) return;

        // Comments are displayed
        var $list = gitbook.state.$book.find('.page-wrapper div[data-thcomments="'+number+'"]');
        if ($list.length == 0) return;

        // Cleanup current list
        $list.html('');

        // Has comment left?
        var hasLeft = Math.max(0, allComments[number].total - LIMIT_COMMENTS);

        if (hasLeft > 0) {
            $list.append(createToolbar([
                {
                    text: 'View '+hasLeft+' more comments',
                    click: function() {
                        openInNewTab(thread.urls.details);
                    }
                }
            ]));
        }

        _.chain(allComments[number].list || [])
            .reverse()
            .each(function(comment) {
                $list.append(createComment(comment));
            })
            .value();
    }


    gitbook.events.bind('start', function (e, config) {

    });

    gitbook.events.bind('page.change', function () {
        allThreads = [];
        fetchThreads();
    });
});
