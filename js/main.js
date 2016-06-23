require(['gitbook', 'jQuery'], function (gitbook, $) {
    var config = {};
    var allThreads = [];
    var allComments = {};
    var isLoggedin = false;
    var isLoaded = false;

    var SECTIONS_SELECTOR = 'p';
    var LIMIT_COMMENTS = 4;

    // Generate template for a comment
    /*
    '<img src="<%- comment.user.urls.avatar %>" class="comment-avatar" />' +
    '<div class="comment-body">' +
        '<a href="<%- comment.user.urls.profile %>" target="_blank" class="comment-user"><%- comment.user.name %></a>' +
        '<div class="comment-content"><% if (comment.title) { %><%- comment.title %><% if (comment.body) { %><br/><% } %><% } %><%= comment.body || "" %></div>' +
    '</div>'
    */
    function generateComment(comment) {
        var $userAvatar = $('<img>', {
            class: 'comment-avatar',
            src:   comment.user.urls.avatar
        });

        var $commentBody = $('<div>', { class: 'comment-body '});
        var $commentUser = $('<a>', {
            class:  'comment-user',
            target: '_blank',
            href:   comment.user.urls.profile,
            text:   comment.user.name
        });

        var commentContent = '';
        if (comment.title) {
            commentContent += comment.title;
            if (comment.body) {
                commentContent += '<br>';
            }
        }
        if (comment.body) {
            commentContent += comment.body;
        }

        var $commentContent = $('<div>', {
            class: 'comment-content',
            html:  commentContent
        });

        $commentBody.append($commentUser);
        $commentBody.append($commentContent);

        var $root = $('<div>');
        $root.append($userAvatar);
        $root.append($commentBody);

        return $root.html();
    }

    // Generate template for a thread
    /*
    '<div class="thread-body">' +
        '<div class="thread-title"><%- thread.title %></div>' +
        '<div class="thread-user">#<%- thread.number %> posted by <%- thread.user.name %></div>' +
    '</div>'
    */
    function generateThread(thread) {
        var $threadBody = $('<div>', {
            class: 'thread-body'
        });

        var $threadTitle = $('<div>', {
            class: 'thread-title',
            text: thread.title
        });

        var $threadUser = $('<div>', {
            class: 'thread-user',
            text: '#'+thread.number+' posted by '+thread.user.name
        });

        $threadBody.append($threadTitle);
        $threadBody.append($threadUser);

        var $root = $('<div>');
        $root.append($threadBody);

        return $root.html();
    }

    // Move content to the left
    // Calcul the right position
    function toggleComments(state, $from) {
        var $wrapper = gitbook.state.$book.find('.page-wrapper');
        var $inner = $wrapper.find('.page-inner');
        var $nextNavigation = gitbook.state.$book.find('.navigation.navigation-next');

        $wrapper.toggleClass('comments-open', state);
        // Fire toggle event
        gitbook.events.trigger('comment.toggled', [$from, state]);

        if (!$wrapper.hasClass('comments-open')) {
            $inner.css('left', '0px');
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
        return (gitbook.state.bookRoot+'gitbook/api/'+path).replace(/([^:]\/)\/+/g, '$1');
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
                isLoaded = true;
                isLoggedin = !!xhr.getResponseHeader('X-GitBook-Auth');
                success(result);
            },
            error: function(xhr, textStatus) {
                if (isLoaded) {
                    var errorMessage = (xhr.responseJSON? xhr.responseJSON.error : '') || xhr.responseText || textStatus;
                    alert('Error with inline comments: '+errorMessage);
                    console.log(xhr, textStatus);
                }
            }
        });
    }

    // Get absolute filepath
    function getFilepath() {
        if (gitbook.state.innerLanguage) return [gitbook.state.innerLanguage, gitbook.state.filepath].join('/');
        return gitbook.state.filepath;
    }

    // Fetch threads from gitbook.com and update listing
    function fetchThreads() {
        apiRequest('GET', 'discussions', {
            'filename': getFilepath(),
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

    // Create a new thread on backend
    function postThread(subject, body, section, done) {
        apiRequest('POST', 'discussions', {
            'title': subject,
            'body': body,
            'context': {
                'filename': getFilepath(),
                'chapterTitle': gitbook.state.chapterTitle,
                'section': section
            }
        }, done);
    }

    // Close a thread
    function closeThread(id) {
        allThreads = $.grep(allThreads, function(thread) {
            return thread.number != id;
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

        // Compute matching for threads
        var results = $.map(allThreads, function(thread) {
            var threadWords = (thread.context.section || '').split(' ');

            var commonWordsWithSection = $.grep(threadWords, function(word) {
                return $.inArray(word, words) !== -1;
            });
            var commonWordsFromSection = $.grep(words, function(word) {
                return $.inArray(word, threadWords) !== -1;
            });

            var matching = (
                (commonWordsWithSection.length/threadWords.length)
                + (commonWordsFromSection.length/words.length)
            ) / 2;

            return {
                matching: matching,
                thread: thread
            };
        });

        // Keep highly matched threads
        results = $.grep(results, function(r) {
            return r.matching > 0.8;
        });

        // Return threads
        return $.map(results, function(r) {
            return r.thread;
        });
    }

    // Return text for a section
    function sectionText($section) {
        return $section
            .clone()
            .find('.comments-area,.comments-icon')
            .remove()
            .end()
            .text();
    }

    // Create form to create thread
    function createThreadCreation($commentsArea, $section) {
        // Post area
        var $title, $description, $toolbar;
        var $postArea = $('<div>', {
            'class': 'comments-post'
        });

        if (isLoggedin) {
            $title = $('<input>', {
                'type': 'text',
                'placeholder': 'Start a new discussion'
            });

            $description = $('<input>', {
                'type': 'text',
                'placeholder': 'Optional comment'
            });

            $toolbar = createToolbar([
                {
                    text: 'Post',
                    click: function() {
                        postThread($title.val(), $description.val(), sectionText($section), function(thread) {
                            // Add to the list of all threads
                            allThreads.push(thread);
                            updateSections();

                            // Update view with this thread
                            createThreadComments($commentsArea, $section, thread);
                        });
                    }
                }
            ]);

            $description.hide();
            $title.keyup(function(e) {
                if ($title.val().length > 3) {
                    $description.show();
                } else if (!$description.val()) {
                    $description.hide();
                }
            });

            $postArea.append($title);
            $postArea.append($description);
            $postArea.append($toolbar);
        } else {
            $toolbar = createToolbar([
                {
                    text: 'Sign in to comment',
                    click: redirectToLogin
                }
            ]);
            $postArea.append($toolbar);
        }

        $commentsArea.empty();
        $commentsArea.append($postArea);

        if ($title) $title.focus();
    }

    // Create and return a thread for listing
    function createThread(thread) {
        return $('<div>', {
            'class': 'thread',
            'html': generateThread(thread)
        });
    }

    // Create and return a comment
    function createComment(comment, isThread) {
        return $('<div>', {
            'class': 'comment',
            'html': generateComment(comment)
        });
    }

    // Create an return a toolbar
    function createToolbar(actions) {
        var $toolbar = $('<div>', {
            'class': 'comments-toolbar'
        });

        $.each(actions, function(i, action) {
            var $action = $('<a>', {
                'href': '#',
                'text': action.text,
                'click': function(e) {
                    e.preventDefault();
                    action.click($(this));
                }
            });

            $action.appendTo($toolbar);
        });

        return $toolbar;
    }

    // Display comment entry in post area for a thread
    function createThreadCommentForm($postArea, thread) {
        $postArea.empty();

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
                    click: function($from) {
                        toggleSection($section, threads, $from);
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

        $commentsArea.empty();
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

        $.each(threads, function(i, thread) {
            var $thread = createThread(thread);
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

        $commentsArea.empty();
        $commentsArea.append($threads);
        $commentsArea.append($toolbar);
    }

    // Close all section
    function closeAllSections() {
        gitbook.state.$book.find('.page-wrapper .comments-section').removeClass('has-comments-open');
    }

    // Toggle comments display
    function toggleSection($section, threads, $from) {
        var isOpen = !$section.hasClass('has-comments-open');
        closeAllSections();
        $section.toggleClass('has-comments-open', isOpen);
        toggleComments(isOpen, $from);

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
        var text = sectionText($section);
        if (text.length < 5) return;

        // Find matching threads with this section
        var threads = filterThreads(text);
        var nComments = 0;
        $.each(threads, function(i, thread) {
            nComments += thread.comments + 1;
        });

        // Create marker
        var $marker = $('<div>', {
            'class': 'marker',
            'text': nComments? nComments : '+'
        });
        $marker.on('click', function() {
            toggleSection($section, threads, $(this));
        });

        var $icon = $('<div>', {
            'class': 'comments-icon'
        });
        $icon.append($marker);

        $section.find('.comments-icon').remove();
        $section.addClass('comments-section');
        $section.toggleClass('has-comments', (nComments > 0));
        if (config.highlightCommented) $section.toggleClass('has-highlight-comments', (nComments > 0));
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
        // Find corresponding thread
        var filtered = $.grep(allThreads, function(thread) {
            return thread.number == number;
        });
        var thread = filtered[0];

        if (!allComments[number] || !thread) return;

        // Comments are displayed
        var $list = gitbook.state.$book.find('.page-wrapper div[data-thcomments="'+number+'"]');
        if ($list.length == 0) return;

        // Cleanup current list
        $list.empty();

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

        var comments = (allComments[number].list || []).reverse();
        $.each(comments, function(i, comment) {
            $list.append(createComment(comment));
        });
    }


    gitbook.events.bind('start', function (e, cfg) {
        config = cfg.comment || {};
    });

    gitbook.events.bind('page.change', function () {
        allThreads = [];
        fetchThreads();
    });
});
